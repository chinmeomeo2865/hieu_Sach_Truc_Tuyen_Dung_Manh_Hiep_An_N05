const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty:     { type: Number, required: true, min: 1 },
  price:   { type: Number, required: true }, // price snapshot at time of adding
}, { _id: false })

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true })

/* Virtual total */
cartSchema.virtual('total').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.qty, 0)
})

cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0)
})

cartSchema.set('toJSON',   { virtuals: true })
cartSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Cart', cartSchema)
