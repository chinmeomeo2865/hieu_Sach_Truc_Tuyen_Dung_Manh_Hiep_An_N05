const jwt  = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const User = require('../models/User')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' })

/* POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { name, email, password } = req.body
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ success: false, message: 'Email đã được sử dụng' })

    const user  = await User.create({ name, email, password })
    const token = signToken(user._id)

    res.status(201).json({ success: true, token, data: user })
  } catch (err) { next(err) }
}

/* POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }
    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' })
    }

    const token = signToken(user._id)
    res.json({ success: true, token, data: user })
  } catch (err) { next(err) }
}

/* GET /api/auth/me */
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user })
}

/* PUT /api/auth/me */
const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    )
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

/* PUT /api/auth/password */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' })
    }
    user.password = newPassword
    await user.save()

    res.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (err) { next(err) }
}

/* GET /api/auth/addresses */
const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses')
    res.json({ success: true, data: user.addresses })
  } catch (err) { next(err) }
}

/* POST /api/auth/addresses */
const addAddress = async (req, res, next) => {
  try {
    const { label, name, phone, street, city, isDefault } = req.body
    const user = await User.findById(req.user._id)

    if (isDefault) user.addresses.forEach(a => { a.isDefault = false })
    user.addresses.push({ label, name, phone, street, city, isDefault: !!isDefault })
    await user.save()

    res.status(201).json({ success: true, data: user.addresses })
  } catch (err) { next(err) }
}

/* PUT /api/auth/addresses/:addrId */
const updateAddress = async (req, res, next) => {
  try {
    const { label, name, phone, street, city, isDefault } = req.body
    const user = await User.findById(req.user._id)
    const addr = user.addresses.id(req.params.addrId)
    if (!addr) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' })

    if (isDefault) user.addresses.forEach(a => { a.isDefault = false })
    Object.assign(addr, { label, name, phone, street, city, isDefault: !!isDefault })
    await user.save()

    res.json({ success: true, data: user.addresses })
  } catch (err) { next(err) }
}

/* DELETE /api/auth/addresses/:addrId */
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addrId)
    await user.save()
    res.json({ success: true, data: user.addresses })
  } catch (err) { next(err) }
}

/* PUT /api/auth/addresses/:addrId/default */
const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    user.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.addrId })
    await user.save()
    res.json({ success: true, data: user.addresses })
  } catch (err) { next(err) }
}

module.exports = { register, login, getMe, updateMe, changePassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress }
