const User  = require('../models/User')
const Order = require('../models/Order')
const bcrypt = require('bcryptjs')

function normalizeVietnamese(str = '') {
  return str
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

exports.getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const search = req.query.search?.trim()

    const filter = { role: 'customer' }
    if (search) {
      const normalized = normalizeVietnamese(search)
      filter.$or = [
        { nameNormalized: { $regex: normalized,       $options: 'i' } },
        { email:          { $regex: search,           $options: 'i' } },
        { phone:          { $regex: search.replace(/\D/g, ''), $options: 'i' } },
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

    const [orders, orderStats] = await Promise.all([
      Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(20),
      Order.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
    ])

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        orders,
        orderCount: orderStats[0]?.count || 0,
        orderTotal: orderStats[0]?.total || 0,
      },
    })
  } catch (err) { next(err) }
}

/* ── Internal (staff) account management ──────────────────── */

exports.getInternalUsers = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.min(50, parseInt(req.query.limit) || 20)
    const search = req.query.search?.trim()
    const role   = req.query.role

    const filter = { role: { $in: ['admin', 'product_manager', 'warehouse'] } }
    if (role && filter.role.$in.includes(role)) filter.role = role
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ])

    res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

exports.createInternalUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' })
    }
    const ALLOWED = ['admin', 'product_manager', 'warehouse']
    if (!ALLOWED.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' })
    }
    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ success: false, message: 'Email đã tồn tại' })

    const user = await User.create({ name, email, password, role, phone })
    res.status(201).json({ success: true, data: { ...user.toJSON(), password: undefined } })
  } catch (err) { next(err) }
}

exports.updateInternalUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, password } = req.body
    const ALLOWED = ['admin', 'product_manager', 'warehouse']

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    if (user.role === 'customer') return res.status(400).json({ success: false, message: 'Dùng API khách hàng' })

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })
      if (exists) return res.status(409).json({ success: false, message: 'Email đã tồn tại' })
      user.email = email.toLowerCase()
    }
    if (name)  user.name  = name
    if (phone) user.phone = phone
    if (role && ALLOWED.includes(role)) user.role = role
    if (password && password.length >= 6) user.password = password

    await user.save()
    res.json({ success: true, data: { ...user.toJSON(), password: undefined } })
  } catch (err) { next(err) }
}

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    user.active = !user.active
    await user.save()
    res.json({ success: true, data: { active: user.active } })
  } catch (err) { next(err) }
}

exports.deleteInternalUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    if (user.role === 'customer') return res.status(400).json({ success: false, message: 'Dùng API khách hàng' })
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể xóa chính mình' })
    }
    await user.deleteOne()
    res.json({ success: true, message: 'Đã xóa tài khoản' })
  } catch (err) { next(err) }
}
