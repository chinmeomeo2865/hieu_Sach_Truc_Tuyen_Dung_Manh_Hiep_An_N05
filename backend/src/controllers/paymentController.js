const PayOS  = require('@payos/node')
const Order  = require('../models/Order')
const { createNotification } = require('./notificationController')
const emailService = require('../services/emailService')

let payos = null
try {
  if (process.env.PAYOS_CLIENT_ID) {
    payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY)
  }
} catch (e) {
  console.error('[PayOS] Init failed:', e.message)
}

/* POST /api/payments/payos/create  [auth] */
exports.createPayOSLink = async (req, res, next) => {
  try {
    if (!payos) return res.status(503).json({ success: false, message: 'Thanh toán online chưa được cấu hình' })

    const { orderId } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền thanh toán đơn này' })
    }
    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không ở trạng thái chờ thanh toán' })
    }

    const orderCode = parseInt(order._id.toString().slice(-8), 16) % 9007199254740991
    const returnUrl = `${process.env.CLIENT_URL}/payment-result?orderId=${order._id}`
    const cancelUrl = `${process.env.CLIENT_URL}/account/orders`

    const paymentData = {
      orderCode,
      amount: Math.round(order.total),
      description: `HSC-${order._id.toString().slice(-6).toUpperCase()}`,
      items: order.items.map(i => ({
        name: i.title.slice(0, 50),
        quantity: i.qty,
        price: Math.round(i.price),
      })),
      returnUrl,
      cancelUrl,
    }

    const paymentLink = await payos.createPaymentLink(paymentData)
    res.json({ success: true, data: { checkoutUrl: paymentLink.checkoutUrl } })
  } catch (err) {
    next(err)
  }
}

/* GET /api/payments/payos/return  — webhook / return URL handler */
exports.handlePayOSReturn = async (req, res, next) => {
  try {
    if (!payos) return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error`)

    const { orderId, code } = req.query

    if (code === '00' && orderId) {
      const order = await Order.findById(orderId)
      if (order && order.status === 'PENDING') {
        order.status = 'CONFIRMED'
        order.statusHistory.push({ status: 'CONFIRMED', changedBy: null })
        await order.save()

        createNotification({
          userId: order.user,
          type:   'ORDER_STATUS',
          title:  'Thanh toán thành công',
          message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã được thanh toán qua PayOS.`,
          link:   '/account/orders',
        })

        const orderUser = await require('../models/User').findById(order.user).select('email')
        if (orderUser?.email) emailService.sendStatusUpdate(order, 'CONFIRMED', orderUser.email)
      }
    }

    res.redirect(`${process.env.CLIENT_URL}/payment-result?orderId=${orderId}&status=${code === '00' ? 'success' : 'cancelled'}`)
  } catch (err) {
    next(err)
  }
}

/* POST /api/payments/payos/webhook  — PayOS server webhook */
exports.payosWebhook = async (req, res, next) => {
  try {
    if (!payos) return res.json({ success: false })

    const webhookData = payos.verifyPaymentWebhookData(req.body)
    if (webhookData.code === '00') {
      const desc = webhookData.description || ''
      const shortId = desc.replace('HSC-', '').toLowerCase()
      const order = await Order.findOne({
        _id: { $regex: new RegExp(shortId + '$', 'i') },
        status: 'PENDING',
      }).catch(() => null)

      if (order) {
        order.status = 'CONFIRMED'
        order.statusHistory.push({ status: 'CONFIRMED', changedBy: null })
        await order.save()
        createNotification({
          userId: order.user,
          type:   'ORDER_STATUS',
          title:  'Thanh toán thành công',
          message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã được thanh toán.`,
          link:   '/account/orders',
        })
      }
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
