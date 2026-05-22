/**
 * Production migration script — chạy 1 lần sau khi deploy
 * node src/migrate-production.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

const User      = require('./models/User')
const Category  = require('./models/Category')
const Coupon    = require('./models/Coupon')
const Product   = require('./models/Product')
const Promotion = require('./models/Promotion')

function normalizeVietnamese(str = '') {
  return str.toLowerCase().replace(/[đĐ]/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function slugify(str = '') {
  return normalizeVietnamese(str).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/* ── 1. nameNormalized cho users ──────────────────────────── */
async function migrateUsers() {
  const users = await User.find({ nameNormalized: { $exists: false } })
  if (!users.length) { console.log('✓ Users: đã có nameNormalized'); return }
  for (const u of users) {
    await User.findByIdAndUpdate(u._id, { nameNormalized: normalizeVietnamese(u.name || '') })
  }
  console.log(`✓ Users: cập nhật nameNormalized cho ${users.length} tài khoản`)
}

/* ── 2. Seed categories ───────────────────────────────────── */
async function seedCategories() {
  const CATS = [
    { name: 'Văn học',      slug: 'van-hoc',   description: 'Tiểu thuyết, truyện ngắn, thơ ca' },
    { name: 'Kỹ năng sống', slug: 'ky-nang',   description: 'Phát triển bản thân, kỹ năng mềm' },
    { name: 'Thiếu nhi',    slug: 'thieu-nhi', description: 'Sách dành cho trẻ em' },
    { name: 'Kiến thức',    slug: 'kien-thuc', description: 'Khoa học, giáo dục, bách khoa' },
    { name: 'Triết học',    slug: 'triet-hoc', description: 'Triết học Đông Tây, tư duy' },
    { name: 'Lịch sử',      slug: 'lich-su',   description: 'Lịch sử Việt Nam và thế giới' },
  ]
  let added = 0
  for (const c of CATS) {
    const exists = await Category.findOne({ slug: c.slug })
    if (!exists) { await Category.create(c); added++ }
  }
  console.log(`✓ Categories: ${added} mới, ${CATS.length - added} đã tồn tại`)
}

/* ── 3. Seed coupons ─────────────────────────────────────── */
async function seedCoupons() {
  const now = new Date()
  const far = new Date('2027-12-31T23:59:59')
  const COUPONS = [
    { code: 'CHIN10',   description: 'Giảm 10% cho mọi đơn (tối đa 100k)',     type: 'percent', value: 10,    minOrderAmount: 0,      maxDiscount: 100000, maxUses: 0,   startDate: now, endDate: far },
    { code: 'CHIN20',   description: 'Giảm 20% đơn từ 200k (tối đa 150k)',     type: 'percent', value: 20,    minOrderAmount: 200000, maxDiscount: 150000, maxUses: 100, startDate: now, endDate: far },
    { code: 'GIAM50K',  description: 'Giảm 50.000₫ cho đơn từ 150k',           type: 'fixed',   value: 50000, minOrderAmount: 150000,                      maxUses: 50,  startDate: now, endDate: far },
    { code: 'NEWUSER',  description: 'Khách mới giảm 30.000₫',                 type: 'fixed',   value: 30000, minOrderAmount: 0,                           maxUses: 1,   startDate: now, endDate: far },
  ]
  let added = 0
  for (const c of COUPONS) {
    const exists = await Coupon.findOne({ code: c.code })
    if (!exists) { await Coupon.create(c); added++ }
  }
  console.log(`✓ Coupons: ${added} mới, ${COUPONS.length - added} đã tồn tại`)
}

/* ── 4. Sync product ratings từ reviews thật ─────────────── */
async function syncRatings() {
  const Review = require('./models/Review')
  const stats  = await Review.aggregate([
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  if (!stats.length) { console.log('✓ Ratings: không có review, bỏ qua'); return }
  for (const s of stats) {
    await Product.findByIdAndUpdate(s._id, {
      rating:      Math.round(s.avgRating * 10) / 10,
      reviewCount: s.count,
    })
  }
  console.log(`✓ Ratings: sync ${stats.length} sản phẩm có review`)
}

/* ── 5. Tạo account PM + Warehouse nếu chưa có ───────────── */
async function seedStaffAccounts() {
  const accounts = [
    { name: 'Product Manager', email: 'pm@hieusachcin.vn',      password: 'pm123456',      role: 'product_manager' },
    { name: 'Thủ Kho',         email: 'thukho@hieusachcin.vn',  password: 'thukho123456',  role: 'warehouse' },
  ]
  let added = 0
  for (const a of accounts) {
    const exists = await User.findOne({ email: a.email })
    if (!exists) { await User.create(a); added++ }
  }
  console.log(`✓ Staff accounts: ${added} mới, ${accounts.length - added} đã tồn tại`)
}

/* ── Main ─────────────────────────────────────────────────── */
async function run() {
  console.log('\n🚀 Bắt đầu migration production...\n')
  await mongoose.connect(process.env.MONGO_URI)
  console.log(`✓ Kết nối MongoDB: ${mongoose.connection.host}\n`)

  await migrateUsers()
  await seedCategories()
  await seedCoupons()
  await syncRatings()
  await seedStaffAccounts()

  console.log('\n✅ Migration hoàn tất!\n')
  console.log('Tài khoản nội bộ:')
  console.log('  Admin:   admin@hieusachcin.vn  /  admin123456')
  console.log('  PM:      pm@hieusachcin.vn     /  pm123456')
  console.log('  Kho:     thukho@hieusachcin.vn /  thukho123456')
  console.log('\nMã giảm giá test: CHIN10 · CHIN20 · GIAM50K · NEWUSER\n')

  await mongoose.disconnect()
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Lỗi migration:', err.message)
  process.exit(1)
})
