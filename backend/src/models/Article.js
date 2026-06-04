const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  summary:    { type: String, default: '' },
  content:    { type: String, default: '' },
  coverImage: { type: String, default: '' },
  category:   { type: String, default: 'Góc đọc sách' },
  readTime:   { type: Number, default: 3 },
  status:     { type: String, enum: ['PUBLISHED', 'DRAFT', 'HIDDEN'], default: 'DRAFT' },
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

articleSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Article', articleSchema)
