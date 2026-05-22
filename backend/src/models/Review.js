const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order',   required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true })

// Mỗi user chỉ review 1 lần / sản phẩm
reviewSchema.index({ user: 1, product: 1 }, { unique: true })
reviewSchema.index({ product: 1, createdAt: -1 })

module.exports = mongoose.model('Review', reviewSchema)
