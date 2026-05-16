const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')
const errorHandler = require('./middleware/error')

const app = express()

/* ── Security ───────────────────────────────────────────── */
app.use(helmet())
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
]
app.use(cors({
  origin:      (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true,
}))

/* ── Rate limiting ──────────────────────────────────────── */
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message:  { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
}))

/* ── Body parsing ───────────────────────────────────────── */
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

/* ── Logging ────────────────────────────────────────────── */
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'))

/* ── Routes ─────────────────────────────────────────────── */
app.use('/api/auth',     require('./routes/auth'))
app.use('/api/products', require('./routes/products'))
app.use('/api/cart',     require('./routes/cart'))
app.use('/api/orders',   require('./routes/orders'))

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
