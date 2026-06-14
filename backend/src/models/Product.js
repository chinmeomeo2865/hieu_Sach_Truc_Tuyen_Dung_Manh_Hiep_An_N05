const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  title:         { type: String, required: [true, 'Tên sách là bắt buộc'], trim: true },
  author:        { type: String, required: [true, 'Tác giả là bắt buộc'], trim: true },
  price:         { type: Number, required: [true, 'Giá là bắt buộc'], min: 0 },
  originalPrice: { type: Number, min: 0 },
  category:      { type: String, required: [true, 'Thể loại là bắt buộc'] },
  categorySlug:  { type: String, required: [true, 'Slug thể loại là bắt buộc'], lowercase: true },
  description:   { type: String },
  image:         { type: String },
  images:        [{ type: String }], // Album ảnh
  isbn:          { type: String, trim: true, default: '' },
  publisher:     { type: String, trim: true, default: '' },
  pages:         { type: Number, min: 0 },
  coverType:     { type: String, enum: ['Bìa cứng', 'Bìa mềm', 'Khác', ''], default: '' },
  trailer:       { type: String }, // YouTube URL
  stock:         { type: Number, default: 0, min: 0 },
  inStock:       { type: Boolean, default: true },
  status:        { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
  visible:       { type: Boolean, default: true },
  badge:         { type: String, enum: ['best', 'new', 'sale', null], default: null },
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:   { type: Number, default: 0, min: 0 },
  featured:      { type: Boolean, default: false },
  weight:        { type: Number, default: 0 },
}, { timestamps: true })

/* Pre-save middleware to sync inStock */
productSchema.pre('save', function(next) {
  this.inStock = this.stock > 0
  next()
})

/* Text index for search */
productSchema.index({ title: 'text', author: 'text', category: 'text' })
productSchema.index({ categorySlug: 1 })
productSchema.index({ visible: 1, createdAt: -1 })
productSchema.index({ inStock: -1, status: 1 })

module.exports = mongoose.model('Product', productSchema)
