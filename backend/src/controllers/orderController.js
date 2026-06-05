const Order   = require('../models/Order')
const Cart    = require('../models/Cart')
const Product = require('../models/Product')
const Coupon  = require('../models/Coupon')
const { calcDiscount } = require('./couponController')
const { createNotification } = require('./notificationController')
const emailService = require('../services/emailService')

const CANCELLABLE = ['PENDING', 'CONFIRMED']

const generateOrderCode = () => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let randomStr = ''
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `DSC-${yy}${mm}${dd}-${randomStr}`
}

/* GET /api/orders  — current user's orders */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const filter = { user: req.user._id }
    if (status) filter.status = status

    const skip   = (Number(page) - 1) * Number(limit)
    const total  = await Order.countDocuments(filter)
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    res.json({
      success: true,
      data:   orders,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) { next(err) }
}

/* GET /api/orders/:id */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone')
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' })

    const isOwner = order.user._id.toString() === req.user._id.toString()
    const isStaff = ['admin', 'warehouse'].includes(req.user.role)
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem đơn này' })
    }

    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

/* POST /api/orders  — create order from cart */
const createOrder = async (req, res, next) => {
  try {
    const { payment, address, couponCode, note } = req.body

    if (!payment || !address?.name || !address?.phone || !address?.street || !address?.city) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin thanh toán hoặc địa chỉ' })
    }

    /* Load cart with product details */
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' })
    }

    /* Validate stock for all items before any writes */
    for (const item of cart.items) {
      if (!item.product || !item.product.visible) {
        return res.status(400).json({ success: false, message: `Sản phẩm không còn khả dụng` })
      }
      if (item.product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `"${item.product.title}" chỉ còn ${item.product.stock} quyển`,
        })
      }
    }

    /* Decrement stock atomically */
    const bulkOps = cart.items.map(item => ({
      updateOne: {
        filter: { _id: item.product._id, stock: { $gte: item.qty } },
        update: { $inc: { stock: -item.qty } },
      },
    }))
    const result = await Product.bulkWrite(bulkOps)
    if (result.modifiedCount !== cart.items.length) {
      return res.status(400).json({ success: false, message: 'Một số sách vừa hết hàng, vui lòng kiểm tra lại giỏ' })
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0)

    /* Validate coupon nếu có */
    let discount = 0
    let appliedCoupon = null
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() })
      const now = new Date()
      if (!coupon || !coupon.active || now < coupon.startDate || now > coupon.endDate) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' })
      }
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã được sử dụng hết' })
      }
      if (subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Đơn tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫ để dùng mã này` })
      }
      discount = calcDiscount(coupon, subtotal)
      appliedCoupon = coupon
    }

    const total = subtotal - discount

    let orderCode
    let attempts = 0
    while (attempts < 5) {
      orderCode = generateOrderCode()
      const exists = await Order.findOne({ orderCode })
      if (!exists) break
      attempts++
    }

    /* Create order */
    const order = await Order.create({
      orderCode,
      user:    req.user._id,
      items:   cart.items.map(i => ({
        product: i.product._id,
        title:   i.product.title,
        author:  i.product.author,
        image:   i.product.image,
        qty:     i.qty,
        price:   i.price,
      })),
      payment,
      address,
      total,
      discount,
      couponCode: appliedCoupon?.code,
      note,
      statusHistory: [{ status: 'PENDING', changedBy: req.user._id }],
    })

    /* Tăng usedCount của coupon */
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } })
    }

    /* Clear cart */
    cart.items = []
    await cart.save()

    /* Email xác nhận */
    const buyer = await require('../models/User').findById(req.user._id).select('email')
    if (buyer?.email) emailService.sendOrderConfirmation(order, buyer.email)

    res.status(201).json({ success: true, data: order })
  } catch (err) { next(err) }
}

/* PUT /api/orders/:id/cancel  — user cancel */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' })

    const isOwner = order.user.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền hủy đơn này' })
    }
    if (!CANCELLABLE.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn ở trạng thái ${order.status}`,
      })
    }

    /* Restore stock */
    await Product.bulkWrite(
      order.items.map(item => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.qty } },
        },
      }))
    )

    order.status = 'CANCELLED'
    order.statusHistory.push({ status: 'CANCELLED', changedBy: req.user._id })
    await order.save()

    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

/* PUT /api/orders/:id/status  — warehouse / admin */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const VALID = ['CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'RETURNED']
    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' })

    /* Restore stock if RETURNED */
    if (status === 'RETURNED' && order.status !== 'RETURNED') {
      await Product.bulkWrite(
        order.items.map(item => ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stock: item.qty } },
          },
        }))
      )
    }

    order.status = status
    order.statusHistory.push({ status, changedBy: req.user._id })
    await order.save()

    const STATUS_LABELS = {
      CONFIRMED: 'Đã xác nhận', PACKING: 'Đang đóng gói',
      SHIPPING: 'Đang giao hàng', DELIVERED: 'Giao thành công', RETURNED: 'Đã hoàn trả',
    }
    createNotification({
      userId: order.user,
      type:  'ORDER_STATUS',
      title: `Đơn hàng ${STATUS_LABELS[status] || status}`,
      message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn đã được cập nhật: ${STATUS_LABELS[status] || status}.`,
      link: `/account/orders`,
    })

    /* Email thông báo */
    const orderUser = await require('../models/User').findById(order.user).select('email')
    if (orderUser?.email) emailService.sendStatusUpdate(order, status, orderUser.email)

    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

/* GET /api/admin/orders  — admin only */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status) filter.status = status

    const skip   = (Number(page) - 1) * Number(limit)
    const total  = await Order.countDocuments(filter)
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    res.json({
      success: true,
      data:   orders,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) { next(err) }
}

module.exports = { getMyOrders, getOrder, createOrder, cancelOrder, updateStatus, getAllOrders }
