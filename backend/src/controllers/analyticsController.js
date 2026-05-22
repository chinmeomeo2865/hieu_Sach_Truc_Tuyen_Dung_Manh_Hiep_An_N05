const Order = require('../models/Order')
const User  = require('../models/User')

exports.getStats = async (req, res, next) => {
  try {
    const period = req.query.period || '30days'
    const now    = new Date()
    let   startDate

    if      (period === 'today')  startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === '7days')  startDate = new Date(now.getTime() - 7  * 86400000)
    else                          startDate = new Date(now.getTime() - 30 * 86400000)

    const df = { createdAt: { $gte: startDate } }

    const [
      totalOrders, deliveredOrders, cancelledOrders,
      revenueAgg, topProducts, recentOrders,
      totalCustomers, newCustomers, byStatus,
    ] = await Promise.all([
      Order.countDocuments(df),
      Order.countDocuments({ ...df, status: 'DELIVERED' }),
      Order.countDocuments({ ...df, status: 'CANCELLED' }),

      Order.aggregate([
        { $match: { status: 'DELIVERED', ...df } },
        { $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
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
        .limit(8)
        .select('_id status total createdAt user items'),

      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', ...df }),

      Order.aggregate([
        { $match: df },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    const totalRevenue = revenueAgg.reduce((s, d) => s + d.revenue, 0)
    const statusMap    = Object.fromEntries(byStatus.map(s => [s._id, s.count]))
    const successRate  = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue,
          totalOrders,
          deliveredOrders,
          cancelledOrders,
          successRate,
          totalCustomers,
          newCustomers,
          avgOrderValue: deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0,
        },
        revenueByDay:  revenueAgg,
        topProducts,
        recentOrders,
        ordersByStatus: statusMap,
      },
    })
  } catch (err) { next(err) }
}
