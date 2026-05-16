const mongoose = require('mongoose')

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED']
const PAYMENT_METHODS = ['ONLINE', 'COD']

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title:   { type: String, required: true },
  image:   { type: String },
  author:  { type: String },
  qty:     { type: Number, required: true, min: 1 },
  price:   { type: Number, required: true },
}, { _id: false })

const addressSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  phone:  { type: String, required: true },
  street: { type: String, required: true },
  city:   { type: String, required: true },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:      [orderItemSchema],
  status:     { type: String, enum: ORDER_STATUSES,   default: 'PENDING' },
  payment:    { type: String, enum: PAYMENT_METHODS,  required: true },
  address:    { type: addressSchema, required: true },
  total:      { type: Number, required: true, min: 0 },
  discount:   { type: Number, default: 0 },
  couponCode: { type: String },
  note:       { type: String },
  statusHistory: [{
    status:    { type: String, enum: ORDER_STATUSES },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, { timestamps: true })

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1 })

module.exports = mongoose.model('Order', orderSchema)
