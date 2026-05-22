const mongoose = require('mongoose')

const inventoryTransactionSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type:        { type: String, enum: ['import', 'export', 'audit_adjust', 'return'], required: true },
  quantity:    { type: Number, required: true },
  stockBefore: { type: Number, required: true },
  stockAfter:  { type: Number, required: true },
  costPrice:   { type: Number },
  supplier:    { type: String },
  reason:      { type: String },
  notes:       { type: String },
  referenceOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

inventoryTransactionSchema.index({ product: 1, createdAt: -1 })
inventoryTransactionSchema.index({ performedBy: 1, createdAt: -1 })

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema)
