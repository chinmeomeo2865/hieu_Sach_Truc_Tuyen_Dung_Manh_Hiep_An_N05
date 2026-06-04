const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')
const errorHandler = require('./middleware/error')

const app = express()

/* ── Security ───────────────────────────────────────────── */
app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (
      origin === (process.env.CLIENT_URL || '') ||
      origin.endsWith('.vercel.app') ||
      origin === 'http://localhost:5173' ||
      origin === 'http://localhost:5174'
    ) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

/* ── Rate limiting ──────────────────────────────────────── */
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  standardHeaders: true,
  legacyHeaders:   false,
  message:  { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
}))

/* ── Body parsing ───────────────────────────────────────── */
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

/* ── Logging ────────────────────────────────────────────── */
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'))

/* ── Routes ─────────────────────────────────────────────── */
app.use('/api/auth',      require('./routes/auth'))
app.use('/api/products',  require('./routes/products'))
app.use('/api/cart',      require('./routes/cart'))
app.use('/api/orders',    require('./routes/orders'))
app.use('/api/users',     require('./routes/users'))
app.use('/api/reviews',   require('./routes/reviews'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/settings',  require('./routes/settings'))
app.use('/api/warehouse', require('./routes/warehouse'))
app.use('/api/pm',        require('./routes/pm'))
app.use('/api/coupons',   require('./routes/coupons'))
app.use('/api/upload',   require('./routes/upload'))
app.use('/api/articles',      require('./routes/articles'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/payments',      require('./routes/payments'))
app.use('/uploads',      require('express').static(require('path').join(__dirname, '../uploads')))

app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'Hiệu Sách Chin API is running' })
)

/* ── 404 ────────────────────────────────────────────────── */
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route không tồn tại' })
)

/* ── Error handler (must be last) ───────────────────────── */
app.use(errorHandler)

module.exports = app
