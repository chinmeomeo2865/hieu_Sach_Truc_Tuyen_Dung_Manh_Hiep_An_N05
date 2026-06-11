const Product     = require('../models/Product')
const Category    = require('../models/Category')
const Promotion   = require('../models/Promotion')
const ActivityLog = require('../models/ActivityLog')

async function log(action, description, userId, entity, entityId, metadata) {
  await ActivityLog.create({ action, description, performedBy: userId, entity, entityId, metadata }).catch(() => {})
}

/* ── Dashboard stats ──────────────────────────────────────── */
exports.getStats = async (req, res, next) => {
  try {
    const [total, visible, hidden, outOfStock, activePromos, totalCats, lowStockCount, lowStockProducts, topCategories] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ visible: true }),
      Product.countDocuments({ visible: false }),
      Product.countDocuments({ stock: 0, visible: true }),
      Promotion.countDocuments({ status: 'active' }),
      Category.countDocuments({}),
      Product.countDocuments({ visible: true, stock: { $lte: 10 } }),
      Product.find({ visible: true, stock: { $lte: 10 } }).sort({ stock: 1 }).limit(5).select('title author image stock'),
      Product.aggregate([
        { $group: { _id: '$categorySlug', category: { $first: '$category' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ])
    res.json({ success: true, data: { total, visible, hidden, outOfStock, activePromos, totalCats, lowStockCount, lowStockProducts, topCategories } })
  } catch (err) { next(err) }
}

/* ── Categories ───────────────────────────────────────────── */
exports.getCategories = async (req, res, next) => {
  try {
    const cats = await Category.find().sort({ name: 1 })
    // count products per category
    const counts = await Product.aggregate([
      { $group: { _id: '$categorySlug', count: { $sum: 1 } } },
    ])
    const countMap = {}
    counts.forEach(c => { countMap[c._id] = c.count })
    const data = cats.map(c => ({ ...c.toJSON(), productCount: countMap[c.slug] || 0 }))
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' })
    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const exists = await Category.findOne({ $or: [{ name: name.trim() }, { slug }] })
    if (exists) return res.status(409).json({ success: false, message: 'Tên danh mục đã tồn tại' })
    const cat = await Category.create({ name: name.trim(), slug, description, image })
    await log('create_category', `Thêm danh mục "${cat.name}"`, req.user._id, 'category', cat._id)
    res.status(201).json({ success: true, data: cat })
  } catch (err) { next(err) }
}

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body
    const cat = await Category.findById(req.params.id)
    if (!cat) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' })
    if (name && name.trim() !== cat.name) {
      const exists = await Category.findOne({ name: name.trim(), _id: { $ne: cat._id } })
      if (exists) return res.status(409).json({ success: false, message: 'Tên danh mục đã tồn tại' })
      cat.name = name.trim()
    }
    if (description !== undefined) cat.description = description
    if (image !== undefined) cat.image = image
    await cat.save()
    await log('update_category', `Sửa danh mục "${cat.name}"`, req.user._id, 'category', cat._id)
    res.json({ success: true, data: cat })
  } catch (err) { next(err) }
}

exports.deleteCategory = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id)
    if (!cat) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' })
    const productCount = await Product.countDocuments({ categorySlug: cat.slug })
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Danh mục còn ${productCount} sản phẩm. Chuyển sản phẩm sang danh mục khác trước khi xóa.`,
      })
    }
    await cat.deleteOne()
    await log('delete_category', `Xóa danh mục "${cat.name}"`, req.user._id, 'category', cat._id)
    res.json({ success: true, message: 'Đã xóa danh mục' })
  } catch (err) { next(err) }
}

/* ── Promotions ───────────────────────────────────────────── */
exports.getPromotions = async (req, res, next) => {
  try {
    const promos = await Promotion.find()
      .populate('products.product', 'title image price')
      .sort({ createdAt: -1 })
    // auto-update status based on dates
    const now = new Date()
    for (const p of promos) {
      if (p.status === 'upcoming' && new Date(p.startDate) <= now && new Date(p.endDate) >= now) {
        p.status = 'active'; await p.save()
      } else if (p.status === 'active' && new Date(p.endDate) < now) {
        p.status = 'ended'; await p.save()
      }
    }
    res.json({ success: true, data: promos })
  } catch (err) { next(err) }
}

exports.createPromotion = async (req, res, next) => {
  try {
    const { name, description, type, value, startDate, endDate, productIds } = req.body
    if (!name || !type || value === undefined || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' })
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc phải sau ngày bắt đầu' })
    }
    if (type === 'percent' && (value <= 0 || value >= 100)) {
      return res.status(400).json({ success: false, message: 'Phần trăm giảm phải từ 1–99%' })
    }

    const products = []
    for (const pid of (productIds || [])) {
      const p = await Product.findById(pid)
      if (p) products.push({ product: p._id, originalPrice: p.price })
    }

    const now = new Date()
    const start = new Date(startDate)
    const status = start <= now ? 'active' : 'upcoming'

    const promo = await Promotion.create({
      name, description, type, value, startDate, endDate, products, status, createdBy: req.user._id,
    })

    if (status === 'active') {
      for (const item of products) {
        const discounted = type === 'percent'
          ? Math.round(item.originalPrice * (1 - value / 100))
          : Math.max(0, item.originalPrice - value)
        await Product.findByIdAndUpdate(item.product, {
          originalPrice: item.originalPrice,
          price: discounted,
          badge: 'sale',
        })
      }
    }

    await log('create_promotion', `Tạo khuyến mãi "${promo.name}"`, req.user._id, 'promotion', promo._id)
    res.status(201).json({ success: true, data: promo })
  } catch (err) { next(err) }
}

exports.endPromotion = async (req, res, next) => {
  try {
    const promo = await Promotion.findById(req.params.id)
    if (!promo) return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' })
    if (promo.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Khuyến mãi đã kết thúc' })
    }
    // restore prices
    for (const item of promo.products) {
      await Product.findByIdAndUpdate(item.product, {
        price: item.originalPrice,
        $unset: { originalPrice: '' },
        badge: null,
      })
    }
    promo.status = 'ended'
    promo.endDate = new Date()
    await promo.save()
    await log('end_promotion', `Kết thúc khuyến mãi "${promo.name}"`, req.user._id, 'promotion', promo._id)
    res.json({ success: true, message: 'Đã kết thúc khuyến mãi' })
  } catch (err) { next(err) }
}

exports.deletePromotion = async (req, res, next) => {
  try {
    const promo = await Promotion.findById(req.params.id)
    if (!promo) return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' })
    if (promo.status === 'active') {
      for (const item of promo.products) {
        await Product.findByIdAndUpdate(item.product, {
          price: item.originalPrice, $unset: { originalPrice: '' }, badge: null,
        })
      }
    }
    await promo.deleteOne()
    res.json({ success: true, message: 'Đã xóa khuyến mãi' })
  } catch (err) { next(err) }
}

/* ── Visibility bulk toggle ───────────────────────────────── */
exports.toggleVisibility = async (req, res, next) => {
  try {
    const { productId, visible } = req.body
    const product = await Product.findByIdAndUpdate(productId, { visible }, { new: true })
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
    await log('toggle_visibility',
      `${visible ? 'Hiển thị' : 'Ẩn'} sản phẩm "${product.title}"`,
      req.user._id, 'product', product._id)
    res.json({ success: true, data: { _id: product._id, visible: product.visible } })
  } catch (err) { next(err) }
}

/* ── Activity log ─────────────────────────────────────────── */
const ACTIVITY_ACTIONS = ['create_category', 'update_category', 'delete_category', 'create_promotion', 'end_promotion', 'toggle_visibility', 'create_product', 'update_product', 'delete_product']

exports.getActivity = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 30)
    const baseFilter = { action: { $in: ACTIVITY_ACTIONS } }
    const filter = { ...baseFilter }
    if (['category', 'product', 'promotion'].includes(req.query.entity)) {
      filter.entity = req.query.entity
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [logs, total, entityCounts, todayCount] = await Promise.all([
      ActivityLog.find(filter)
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(filter),
      ActivityLog.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$entity', count: { $sum: 1 } } },
      ]),
      ActivityLog.countDocuments({ ...baseFilter, createdAt: { $gte: startOfToday } }),
    ])

    const byEntity = entityCounts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {})
    const grandTotal = entityCounts.reduce((sum, c) => sum + c.count, 0)

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { total: grandTotal, today: todayCount, byEntity },
    })
  } catch (err) { next(err) }
}
