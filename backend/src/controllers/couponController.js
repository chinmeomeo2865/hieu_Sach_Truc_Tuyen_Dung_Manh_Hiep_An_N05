const Coupon = require('../models/Coupon')

function calcDiscount(coupon, subtotal) {
  if (coupon.type === 'percent') {
    const raw = Math.round(subtotal * coupon.value / 100)
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
  }
  return Math.min(coupon.value, subtotal)
}

/* POST /api/coupons/validate  [auth] */
exports.validate = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body
    if (!code?.trim()) return res.status(400).json({ success: false, message: 'Nhập mã giảm giá' })

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() })

    if (!coupon || !coupon.active) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa' })
    }
    const now = new Date()
    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: `Mã chưa có hiệu lực (từ ${coupon.startDate.toLocaleDateString('vi-VN')})` })
    }
    if (now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' })
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã được sử dụng hết' })
    }
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫ để dùng mã này`,
      })
    }

    const discount = calcDiscount(coupon, subtotal)

    res.json({
      success: true,
      data: {
        code:        coupon.code,
        description: coupon.description,
        type:        coupon.type,
        value:       coupon.value,
        discount,
        maxDiscount: coupon.maxDiscount,
      },
    })
  } catch (err) { next(err) }
}

/* ── Admin CRUD ───────────────────────────────────────────── */

exports.getAll = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json({ success: true, data: coupons })
  } catch (err) { next(err) }
}

exports.create = async (req, res, next) => {
  try {
    const { code, description, type, value, minOrderAmount, maxDiscount, maxUses, startDate, endDate } = req.body
    if (!code || !type || value === undefined || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' })
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'Ngày hết hạn phải sau ngày bắt đầu' })
    }
    const exists = await Coupon.findOne({ code: code.trim().toUpperCase() })
    if (exists) return res.status(409).json({ success: false, message: 'Mã coupon đã tồn tại' })

    const coupon = await Coupon.create({ code, description, type, value, minOrderAmount, maxDiscount, maxUses, startDate, endDate })
    res.status(201).json({ success: true, data: coupon })
  } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
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

exports.calcDiscount = calcDiscount
