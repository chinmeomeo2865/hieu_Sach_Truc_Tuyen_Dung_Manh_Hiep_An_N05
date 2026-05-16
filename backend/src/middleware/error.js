const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500
  let message    = err.message    || 'Lỗi server'

  /* Mongoose validation */
  if (err.name === 'ValidationError') {
    statusCode = 400
    message    = Object.values(err.errors).map(e => e.message).join(', ')
  }

  /* Mongoose duplicate key */
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message    = field === 'email' ? 'Email đã được sử dụng' : `${field} đã tồn tại`
  }

  /* Mongoose cast error (invalid ObjectId) */
  if (err.name === 'CastError') {
    statusCode = 404
    message    = 'Không tìm thấy tài nguyên'
  }

  /* JWT errors */
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Token không hợp lệ' }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token đã hết hạn' }

  if (process.env.NODE_ENV !== 'production') console.error(err.stack)

  res.status(statusCode).json({ success: false, message })
}

module.exports = errorHandler
