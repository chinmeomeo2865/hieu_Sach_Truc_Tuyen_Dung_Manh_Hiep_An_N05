const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['ORDER_STATUS', 'SYSTEM'], default: 'SYSTEM' },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String, default: '' },
  read:    { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, read: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
