const jwt  = require('jsonwebtoken')
const User = require('../models/User')

/* Verify JWT and attach user to req */
const protect = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' })
  }
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(decoded.id)
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' })
    }
    req.user = user
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' })
  }
}

/* Role-based access control — pass one or more allowed roles */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập' })
  }
  next()
}

module.exports = { protect, authorize }
