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
  trailer:       { type: String }, // YouTube URL
  stock:         { type: Number, default: 0, min: 0 },
  visible:       { type: Boolean, default: true },
  badge:         { type: String, enum: ['best', 'new', 'sale', null], default: null },
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:   { type: Number, default: 0, min: 0 },
  featured:      { type: Boolean, default: false },
}, { timestamps: true })

/* Text index for search */
productSchema.index({ title: 'text', author: 'text', category: 'text' })
productSchema.index({ categorySlug: 1 })
productSchema.index({ visible: 1, createdAt: -1 })

module.exports = mongoose.model('Product', productSchema)
