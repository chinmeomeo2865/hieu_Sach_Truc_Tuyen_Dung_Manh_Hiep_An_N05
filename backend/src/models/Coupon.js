const mongoose = require('mongoose')

/* Cơ chế giảm: percent (kèm maxDiscount), fixed, free_shipping (kèm maxShipDiscount).
   5 "loại" voucher mà người dùng thấy = tổ hợp cơ chế giảm + ràng buộc
   (minOrderAmount, firstOrderOnly). Thiết kế mở rộng: appliesTo chừa sẵn cho
   voucher theo danh mục / sản phẩm / VIP sau này. */
const couponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:    { type: String, default: '' },

  /* Cơ chế giảm */
  type:           { type: String, enum: ['percent', 'fixed', 'free_shipping'], required: true },
  value:          { type: Number, default: 0, min: 0 },   // % hoặc số tiền; free_shipping bỏ qua
  maxDiscount:    { type: Number },                       // trần giảm cho percent
  maxShipDiscount:{ type: Number },                       // trần hỗ trợ ship cho free_shipping

  /* Ràng buộc */
  minOrderAmount: { type: Number, default: 0 },           // loại "đơn tối thiểu"
  firstOrderOnly: { type: Boolean, default: false },      // loại "khách hàng mới"
  perUserLimit:   { type: Number, default: 0 },           // 0 = không giới hạn / tài khoản
  maxUses:        { type: Number, default: 0 },           // 0 = không giới hạn tổng
  usedCount:      { type: Number, default: 0 },

  /* Phạm vi áp dụng — mở rộng tương lai */
  appliesTo:      { type: String, enum: ['all', 'category', 'product'], default: 'all' },
  targetCategories: [{ type: String }],                   // categorySlug — dùng khi appliesTo='category'
  targetProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  active:         { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Coupon', couponSchema)
