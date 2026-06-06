const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const { createNotification } = require('../controllers/notificationController')
const emailService = require('./emailService')

const startAutoCancelJob = () => {
  console.log('[Cron Service] Auto-cancel job initialized running every 5 minutes.')
  
  setInterval(async () => {
    try {
      const expirationTime = new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
      
      const expiredOrders = await Order.find({
        payment: 'ONLINE',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        createdAt: { $lte: expirationTime }
      })
      
      if (expiredOrders.length === 0) return
      
      console.log(`[Cron Service] Found ${expiredOrders.length} expired unpaid online orders. Processing cancellation...`)
      
      for (const order of expiredOrders) {
        // 1. Restore stock
        if (order.items && order.items.length > 0) {
          await Product.bulkWrite(
            order.items.map(item => ({
              updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: item.qty } }
              }
            }))
          )
        }
        
        // 2. Update status and history
        order.status = 'CANCELLED'
        order.statusHistory.push({
          status: 'CANCELLED',
          changedAt: new Date(),
          changedBy: null // System auto-cancelled
        })
        
        await order.save()
        console.log(`[Cron Service] Auto-cancelled order #${order.orderCode || order._id}`)
        
        // 3. Send notification
        try {
          await createNotification({
            userId: order.user,
            type: 'ORDER_STATUS',
            title: 'Đơn hàng tự động hủy',
            message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn đã tự động hủy do quá hạn thanh toán 20 phút.`,
            link: '/account/orders'
          })
        } catch (notifErr) {
          console.error('[Cron Service] Notification error:', notifErr.message)
        }
        
        // 4. Send email
        try {
          const orderUser = await User.findById(order.user).select('email')
          if (orderUser?.email) {
            await emailService.sendStatusUpdate(order, 'CANCELLED', orderUser.email)
          }
        } catch (emailErr) {
          console.error('[Cron Service] Email error:', emailErr.message)
        }
      }
    } catch (err) {
      console.error('[Cron Service] Auto-cancel job error:', err.message)
    }
  }, 5 * 60 * 1000) // Run every 5 minutes
}

module.exports = { startAutoCancelJob }
