const Coupon            = require('../models/Coupon')
const CouponRedemption  = require('../models/CouponRedemption')
const Order             = require('../models/Order')
const Settings          = require('../models/Settings')

/* ── Phí ship theo Settings (server là nguồn xác thực) ─────── */
async function getShippingFee(subtotal) {
  const s = await Settings.findById('singleton').lean().catch(() => null)
  const fee       = s?.shippingFee || 0
  const threshold = s?.freeShippingThreshold || 0
  if (threshold > 0 && subtotal >= threshold) return 0
  return fee
}

/* ── Tính tiền giảm theo cơ chế ────────────────────────────── */
function calcDiscount(coupon, subtotal, shippingFee = 0) {
  let discount = 0, shipDiscount = 0
  if (coupon.type === 'percent') {
    const raw = Math.round(subtotal * coupon.value / 100)
    discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, subtotal)
  } else if (coupon.type === 'free_shipping') {
    shipDiscount = coupon.maxShipDiscount ? Math.min(shippingFee, coupon.maxShipDiscount) : shippingFee
  }
  return { discount, shipDiscount }
}

/* ── Kiểm tra điều kiện áp dụng (dùng chung validate + tạo đơn) ── */
async function evaluateCoupon(coupon, { subtotal, userId }) {
  if (!coupon || !coupon.active) return { ok: false, message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa' }
  const now = new Date()
  if (now < coupon.startDate) return { ok: false, message: `Mã chưa có hiệu lực (từ ${coupon.startDate.toLocaleDateString('vi-VN')})` }
  if (now > coupon.endDate)   return { ok: false, message: 'Mã giảm giá đã hết hạn' }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: 'Mã giảm giá đã được sử dụng hết' }
  }
  if (subtotal < (coupon.minOrderAmount || 0)) {
    return { ok: false, message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫ để dùng mã này` }
  }
  if (coupon.firstOrderOnly && userId) {
    const prior = await Order.countDocuments({ user: userId, status: { $ne: 'CANCELLED' } })
    if (prior > 0) return { ok: false, message: 'Mã chỉ áp dụng cho đơn hàng đầu tiên của bạn' }
  }
  if (coupon.perUserLimit > 0 && userId) {
    const used = await CouponRedemption.countDocuments({ coupon: coupon._id, user: userId })
    if (used >= coupon.perUserLimit) {
      return { ok: false, message: `Bạn đã dùng mã này tối đa ${coupon.perUserLimit} lần` }
    }
  }
  return { ok: true }
}

/* POST /api/coupons/validate  [auth] */
exports.validate = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body
    if (!code?.trim()) return res.status(400).json({ success: false, message: 'Nhập mã giảm giá' })

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() })
    if (!coupon) return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' })

    const sub = Number(subtotal) || 0
    const check = await evaluateCoupon(coupon, { subtotal: sub, userId: req.user?._id })
    if (!check.ok) return res.status(400).json({ success: false, message: check.message })

    const shippingFee = await getShippingFee(sub)
    const { discount, shipDiscount } = calcDiscount(coupon, sub, shippingFee)

    if (coupon.type === 'free_shipping' && shipDiscount === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được miễn phí vận chuyển' })
    }
    if (coupon.type !== 'free_shipping' && discount === 0) {
      return res.status(400).json({ success: false, message: 'Mã không tạo ra giảm giá cho đơn này' })
    }

    res.json({
      success: true,
      data: {
        code:        coupon.code,
        description: coupon.description,
        type:        coupon.type,
        value:       coupon.value,
        discount,
        shipDiscount,
        shippingFee,
      },
    })
  } catch (err) { next(err) }
}

/* ── Admin CRUD ───────────────────────────────────────────── */

const EDITABLE = [
  'code', 'description', 'type', 'value', 'maxDiscount', 'maxShipDiscount',
  'minOrderAmount', 'firstOrderOnly', 'perUserLimit', 'maxUses',
  'appliesTo', 'targetCategories', 'targetProducts',
  'startDate', 'endDate', 'active',
]
function pick(body) {
  const out = {}
  for (const k of EDITABLE) if (body[k] !== undefined) out[k] = body[k]
  return out
}

exports.getAll = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json({ success: true, data: coupons })
  } catch (err) { next(err) }
}

exports.create = async (req, res, next) => {
  try {
    const data = pick(req.body)
    if (!data.code || !data.type || !data.startDate || !data.endDate) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' })
    }
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return res.status(400).json({ success: false, message: 'Ngày hết hạn phải sau ngày bắt đầu' })
    }
    if (data.type !== 'free_shipping' && (!data.value || data.value <= 0)) {
      return res.status(400).json({ success: false, message: 'Giá trị giảm phải lớn hơn 0' })
    }
    if (data.type === 'percent' && data.value >= 100) {
      return res.status(400).json({ success: false, message: 'Phần trăm giảm phải nhỏ hơn 100%' })
    }
    const exists = await Coupon.findOne({ code: data.code.trim().toUpperCase() })
    if (exists) return res.status(409).json({ success: false, message: 'Mã coupon đã tồn tại' })

    const coupon = await Coupon.create(data)
    res.status(201).json({ success: true, data: coupon })
  } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
  try {
    const data = pick(req.body)
    delete data.usedCount
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy coupon' })
    res.json({ success: true, data: coupon })
  } catch (err) { next(err) }
}

exports.remove = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Đã xóa coupon' })
  } catch (err) { next(err) }
}

exports.calcDiscount   = calcDiscount
exports.evaluateCoupon = evaluateCoupon
exports.getShippingFee = getShippingFee
