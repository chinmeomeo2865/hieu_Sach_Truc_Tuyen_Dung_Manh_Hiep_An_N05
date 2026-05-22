const mongoose = require('mongoose')

const promotionSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['percent', 'fixed'], required: true },
  value:       { type: Number, required: true, min: 0 },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  products:    [{
    product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    originalPrice: { type: Number, required: true },
  }],
  status:      { type: String, enum: ['upcoming', 'active', 'ended'], default: 'upcoming' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

promotionSchema.index({ status: 1, startDate: 1, endDate: 1 })

module.exports = mongoose.model('Promotion', promotionSchema)
