const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema({
  action:      { type: String, required: true },
  entity:      { type: String },
  entityId:    { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metadata:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

activityLogSchema.index({ performedBy: 1, createdAt: -1 })
activityLogSchema.index({ createdAt: -1 })

module.exports = mongoose.model('ActivityLog', activityLogSchema)
