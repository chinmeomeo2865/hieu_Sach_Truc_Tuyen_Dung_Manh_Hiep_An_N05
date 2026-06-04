const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:    { type: String, default: '' },
  type:           { type: String, enum: ['percent', 'fixed'], required: true },
  value:          { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount:    { type: Number },
  maxUses:        { type: Number, default: 0 },
  usedCount:      { type: Number, default: 0 },
  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  active:         { type: Boolean, default: true },
}, { timestamps: true })

// code index provided by unique:true on field

module.exports = mongoose.model('Coupon', couponSchema)
