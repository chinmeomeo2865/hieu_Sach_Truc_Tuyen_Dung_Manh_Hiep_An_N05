const User  = require('../models/User')
const Order = require('../models/Order')

exports.getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const search = req.query.search?.trim()

    const filter = { role: 'customer' }
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ])

    // Đếm số đơn cho mỗi user
    const ids = users.map(u => u._id)
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: ids } } },
      { $group: { _id: '$user', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ])
    const countMap = {}
    orderCounts.forEach(o => { countMap[o._id.toString()] = { count: o.count, total: o.total } })

    const data = users.map(u => ({
      ...u.toJSON(),
      orderCount: countMap[u._id.toString()]?.count  || 0,
      orderTotal: countMap[u._id.toString()]?.total  || 0,
    }))

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) { next(err) }
}

exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' })

    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ success: true, data: { ...user.toJSON(), orders } })
  } catch (err) { next(err) }
}
