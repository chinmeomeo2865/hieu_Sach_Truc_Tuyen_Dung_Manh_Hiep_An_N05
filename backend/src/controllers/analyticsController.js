const Order = require('../models/Order')
const User  = require('../models/User')
const Product = require('../models/Product')

exports.getStats = async (req, res, next) => {
  try {
    const { startDate: qStart, endDate: qEnd, period } = req.query
    const now = new Date()
    let startDate
    let endDate = now

    if (qStart && qEnd) {
      startDate = new Date(qStart)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(qEnd)
      endDate.setHours(23, 59, 59, 999)
    } else {
      const p = period || '30days'
      if (p === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (p === '7days') {
        startDate = new Date(now.getTime() - 7 * 86400000)
      } else {
        startDate = new Date(now.getTime() - 30 * 86400000)
      }
    }

    const df = { createdAt: { $gte: startDate, $lte: endDate } }

    const [
      totalOrders, deliveredOrders, cancelledOrders,
      revenueAgg, topProducts, recentOrders,
      totalCustomers, newCustomers, byStatus,
      userRoleStats,
      totalMembers,
      lowStockProducts,
      lowStockCount,
      paymentMethods,
    ] = await Promise.all([
      Order.countDocuments(df),
      Order.countDocuments({ ...df, status: 'DELIVERED' }),
      Order.countDocuments({ ...df, status: 'CANCELLED' }),

      Order.aggregate([
        { $match: { status: 'DELIVERED', ...df } },
        { $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          discount: { $sum: '$discount' },
          count:   { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $match: { status: { $nin: ['CANCELLED', 'RETURNED'] }, ...df } },
        { $unwind: '$items' },
        { $group: {
          _id:     '$items.product',
          title:   { $first: '$items.title' },
          author:  { $first: '$items.author' },
          image:   { $first: '$items.image' },
          soldQty: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        }},
        { $sort: { soldQty: -1 } },
        { $limit: 5 },
      ]),

      Order.find(df)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(50)
        .select('_id orderCode status total createdAt user items'),

      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', ...df }),

      Order.aggregate([
        { $match: df },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),

      User.countDocuments({}),

      Product.find({ stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(5)
        .select('title author stock image price'),

      Product.countDocuments({ stock: { $lte: 10 } }),

      Order.aggregate([
        { $match: df },
        { $group: { _id: '$payment', count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
    ])

    const totalRevenue = revenueAgg.reduce((s, d) => s + d.revenue, 0)
    const totalDiscount = revenueAgg.reduce((s, d) => s + (d.discount || 0), 0)
    const statusMap    = Object.fromEntries(byStatus.map(s => [s._id, s.count]))
    const successRate  = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0
    const rolesMap     = Object.fromEntries(userRoleStats.map(r => [r._id, r.count]))

    res.json({
      success: true,
      data: {
        period: qStart && qEnd ? 'custom' : period || '30days',
        summary: {
          totalRevenue,
          totalDiscount,
          totalOrders,
          deliveredOrders,
          cancelledOrders,
          successRate,
          totalCustomers,
          newCustomers,
          avgOrderValue: deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0,
          totalMembers,
          rolesCount: {
            admin: rolesMap.admin || 0,
            product_manager: rolesMap.product_manager || 0,
            customer: rolesMap.customer || 0,
            warehouse: rolesMap.warehouse || 0,
          }
        },
        revenueByDay:  revenueAgg,
        topProducts,
        recentOrders,
        ordersByStatus: statusMap,
        lowStockProducts,
        lowStockCount,
        paymentMethods,
      },
    })
  } catch (err) { next(err) }
}
