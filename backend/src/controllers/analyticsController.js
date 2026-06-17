const Order = require('../models/Order')
const User  = require('../models/User')
const Product = require('../models/Product')

const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay   = d => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

/* Giải khoảng thời gian từ preset hoặc custom range */
function resolveRange({ period, qStart, qEnd }) {
  const now = new Date()
  if (qStart && qEnd) {
    return { startDate: startOfDay(new Date(qStart)), endDate: endOfDay(new Date(qEnd)), period: 'custom' }
  }
  const p = period || '30days'
  switch (p) {
    case 'today':
      return { startDate: startOfDay(now), endDate: now, period: p }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { startDate: startOfDay(y), endDate: endOfDay(y), period: p }
    }
    case '7days': {
      const s = new Date(now); s.setDate(s.getDate() - 6)
      return { startDate: startOfDay(s), endDate: now, period: p }
    }
    case 'this_month':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now, period: p }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
      return { startDate: s, endDate: e, period: p }
    }
    case '30days':
    default: {
      const s = new Date(now); s.setDate(s.getDate() - 29)
      return { startDate: startOfDay(s), endDate: now, period: '30days' }
    }
  }
}

/* Tóm tắt 4 chỉ số chính cho 1 khoảng — dùng cho kỳ trước (nhẹ) */
async function periodSummary(startDate, endDate) {
  const df = { createdAt: { $gte: startDate, $lte: endDate } }
  const [revAgg, orders, soldAgg, newCustomers] = await Promise.all([
    Order.aggregate([{ $match: { status: 'DELIVERED', ...df } }, { $group: { _id: null, revenue: { $sum: '$total' } } }]),
    Order.countDocuments(df),
    Order.aggregate([
      { $match: { status: { $nin: ['CANCELLED', 'RETURNED'] }, ...df } },
      { $unwind: '$items' },
      { $group: { _id: null, qty: { $sum: '$items.qty' } } },
    ]),
    User.countDocuments({ role: 'customer', ...df }),
  ])
  return {
    revenue:      revAgg[0]?.revenue  || 0,
    orders,
    productsSold: soldAgg[0]?.qty     || 0,
    newCustomers,
  }
}

function pctChange(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0
  return Math.round(((cur - prev) / prev) * 100)
}

/* Chuỗi dữ liệu theo ngày, lấp đầy ngày trống = 0 (UTC, khớp $dateToString) */
function buildDaily(startDate, endDate, revMap, ordMap, cusMap) {
  const out = []
  const cur  = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
  const last = new Date(Date.UTC(endDate.getUTCFullYear(),   endDate.getUTCMonth(),   endDate.getUTCDate()))
  let guard = 0
  while (cur <= last && guard < 400) {
    const key = cur.toISOString().slice(0, 10)
    out.push({
      _id:          key,
      revenue:      revMap[key]?.revenue || 0,
      discount:     revMap[key]?.discount || 0,
      orders:       ordMap[key] || 0,
      newCustomers: cusMap[key] || 0,
    })
    cur.setUTCDate(cur.getUTCDate() + 1)
    guard++
  }
  return out
}

exports.getStats = async (req, res, next) => {
  try {
    const { startDate: qStart, endDate: qEnd, period } = req.query
    const { startDate, endDate, period: resolvedPeriod } = resolveRange({ period, qStart, qEnd })

    /* Kỳ trước = cùng độ dài, ngay trước kỳ hiện tại */
    const durationMs = endDate - startDate
    const prevEnd    = new Date(startDate.getTime() - 1)
    const prevStart  = new Date(prevEnd.getTime() - durationMs)

    const df = { createdAt: { $gte: startDate, $lte: endDate } }

    const [
      totalOrders, deliveredOrders, cancelledOrders,
      revenueAgg, productsSoldAgg, topProducts, recentOrders,
      totalCustomers, newCustomers, byStatus,
      userRoleStats, totalMembers,
      lowStockProducts, lowStockCount, paymentMethods,
      ordersByDayAgg, customersByDayAgg,
      prev,
    ] = await Promise.all([
      Order.countDocuments(df),
      Order.countDocuments({ ...df, status: 'DELIVERED' }),
      Order.countDocuments({ ...df, status: 'CANCELLED' }),

      Order.aggregate([
        { $match: { status: 'DELIVERED', ...df } },
        { $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue:  { $sum: '$total' },
          discount: { $sum: '$discount' },
          count:    { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $match: { status: { $nin: ['CANCELLED', 'RETURNED'] }, ...df } },
        { $unwind: '$items' },
        { $group: { _id: null, qty: { $sum: '$items.qty' } } },
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

      Order.aggregate([{ $match: df }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({}),

      Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(5).select('title author stock image price'),
      Product.countDocuments({ stock: { $lte: 10 } }),

      Order.aggregate([{ $match: df }, { $group: { _id: '$payment', count: { $sum: 1 }, total: { $sum: '$total' } } }]),

      /* Đơn theo ngày (tất cả trạng thái) */
      Order.aggregate([
        { $match: df },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      /* Khách mới theo ngày */
      User.aggregate([
        { $match: { role: 'customer', ...df } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),

      /* Kỳ trước */
      periodSummary(prevStart, prevEnd),
    ])

    const totalRevenue  = revenueAgg.reduce((s, d) => s + d.revenue, 0)
    const totalDiscount = revenueAgg.reduce((s, d) => s + (d.discount || 0), 0)
    const productsSold  = productsSoldAgg[0]?.qty || 0
    const statusMap     = Object.fromEntries(byStatus.map(s => [s._id, s.count]))
    const successRate   = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0
    const rolesMap      = Object.fromEntries(userRoleStats.map(r => [r._id, r.count]))

    const revMap = Object.fromEntries(revenueAgg.map(d => [d._id, d]))
    const ordMap = Object.fromEntries(ordersByDayAgg.map(d => [d._id, d.count]))
    const cusMap = Object.fromEntries(customersByDayAgg.map(d => [d._id, d.count]))
    const daily  = buildDaily(startDate, endDate, revMap, ordMap, cusMap)

    const comparison = {
      revenue:      { current: totalRevenue, previous: prev.revenue,      pct: pctChange(totalRevenue, prev.revenue) },
      orders:       { current: totalOrders,  previous: prev.orders,       pct: pctChange(totalOrders, prev.orders) },
      productsSold: { current: productsSold, previous: prev.productsSold, pct: pctChange(productsSold, prev.productsSold) },
      newCustomers: { current: newCustomers, previous: prev.newCustomers, pct: pctChange(newCustomers, prev.newCustomers) },
    }

    res.json({
      success: true,
      data: {
        period: resolvedPeriod,
        range: { startDate, endDate, prevStart, prevEnd },
        summary: {
          totalRevenue,
          totalDiscount,
          totalOrders,
          deliveredOrders,
          cancelledOrders,
          successRate,
          totalCustomers,
          newCustomers,
          productsSold,
          avgOrderValue: deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0,
          totalMembers,
          rolesCount: {
            admin: rolesMap.admin || 0,
            product_manager: rolesMap.product_manager || 0,
            customer: rolesMap.customer || 0,
            warehouse: rolesMap.warehouse || 0,
          },
        },
        comparison,
        daily,
        revenueByDay: revenueAgg,
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
