const express = require('express')
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../uploads/covers')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `cover-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Chỉ chấp nhận file JPG, PNG hoặc WebP'))
  },
})

/* POST /api/upload/cover  [pm/admin] */
router.post('/cover', protect, authorize('product_manager', 'admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' })
  const url = `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`}/uploads/covers/${req.file.filename}`
  res.json({ success: true, data: { url } })
})

module.exports = router
