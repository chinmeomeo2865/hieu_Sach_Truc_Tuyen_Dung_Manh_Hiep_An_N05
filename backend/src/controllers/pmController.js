const Product     = require('../models/Product')
const Category    = require('../models/Category')
const ActivityLog = require('../models/ActivityLog')

async function log(action, description, userId, entity, entityId, metadata) {
  await ActivityLog.create({ action, description, performedBy: userId, entity, entityId, metadata }).catch(() => {})
}

/* ── Dashboard stats ──────────────────────────────────────── */
exports.getStats = async (req, res, next) => {
  try {
    const [total, visible, hidden, outOfStock, totalCats, lowStockCount, lowStockProducts, topCategories] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ visible: true }),
      Product.countDocuments({ visible: false }),
      Product.countDocuments({ stock: 0, visible: true }),
      Category.countDocuments({}),
      Product.countDocuments({ visible: true, stock: { $lte: 10 } }),
      Product.find({ visible: true, stock: { $lte: 10 } }).sort({ stock: 1 }).limit(5).select('title author image stock'),
      Product.aggregate([
        { $group: { _id: '$categorySlug', category: { $first: '$category' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ])
    res.json({ success: true, data: { total, visible, hidden, outOfStock, totalCats, lowStockCount, lowStockProducts, topCategories } })
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
