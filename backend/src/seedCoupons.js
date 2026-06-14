require('dotenv').config({ path: '../.env' })
require('dotenv').config()
const mongoose = require('mongoose')
const Coupon   = require('./models/Coupon')

const now   = new Date()
const start = new Date(now.getTime() - 24 * 3600 * 1000)          // hôm qua
const end   = new Date(now.getTime() + 90 * 24 * 3600 * 1000)     // +90 ngày

const COUPONS = [
  {
    code: 'GIAM10',
    description: 'Giảm 10% tối đa 50.000₫ cho mọi đơn',
    type: 'percent', value: 10, maxDiscount: 50000,
    perUserLimit: 3, maxUses: 0,
  },
  {
    code: 'GIAM30K',
    description: 'Giảm ngay 30.000₫',
    type: 'fixed', value: 30000,
    minOrderAmount: 100000, maxUses: 500,
  },
  {
    code: 'FREESHIP',
    description: 'Miễn phí vận chuyển, hỗ trợ tối đa 30.000₫',
    type: 'free_shipping', maxShipDiscount: 30000,
    perUserLimit: 5,
  },
  {
    code: 'DON300',
    description: 'Giảm 50.000₫ cho đơn từ 300.000₫',
    type: 'fixed', value: 50000, minOrderAmount: 300000,
  },
  {
    code: 'WELCOME15',
    description: 'Khách hàng mới: giảm 15% đơn đầu tiên',
    type: 'percent', value: 15, maxDiscount: 60000,
    firstOrderOnly: true, perUserLimit: 1,
  },
]

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('🍃  MongoDB connected')

  let created = 0, updated = 0
  for (const c of COUPONS) {
    const doc = { ...c, startDate: start, endDate: end, active: true }
    const existing = await Coupon.findOne({ code: c.code })
    if (existing) {
      // giữ usedCount, chỉ cập nhật cấu hình
      await Coupon.updateOne({ _id: existing._id }, { $set: doc })
      updated++
    } else {
      await Coupon.create(doc)
      created++
    }
  }

  console.log(`✅  Voucher seed xong: ${created} tạo mới, ${updated} cập nhật`)
  console.log('    Mã: ' + COUPONS.map(c => c.code).join(', '))
  await mongoose.disconnect()
  process.exit(0)
}

run().catch(err => { console.error('❌', err.message); process.exit(1) })
