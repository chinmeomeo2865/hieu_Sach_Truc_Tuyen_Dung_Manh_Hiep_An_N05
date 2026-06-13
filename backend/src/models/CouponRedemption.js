const mongoose = require('mongoose')

/* Ghi nhận mỗi lượt một user dùng một voucher trên một đơn — dùng để đếm
   giới hạn số lần / tài khoản (perUserLimit) và phục vụ thống kê sau này. */
const couponRedemptionSchema = new mongoose.Schema({
  coupon:   { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  code:     { type: String },
  discount: { type: Number, default: 0 },      // tiền giảm trên hàng
  shipDiscount: { type: Number, default: 0 },  // tiền hỗ trợ ship
}, { timestamps: true })

couponRedemptionSchema.index({ coupon: 1, user: 1 })

module.exports = mongoose.model('CouponRedemption', couponRedemptionSchema)
