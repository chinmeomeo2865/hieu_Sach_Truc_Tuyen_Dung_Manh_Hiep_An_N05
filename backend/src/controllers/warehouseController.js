const Product              = require('../models/Product')
const Order                = require('../models/Order')
const InventoryTransaction = require('../models/InventoryTransaction')
const ActivityLog          = require('../models/ActivityLog')

async function log(action, description, userId, entity, entityId, metadata) {
  await ActivityLog.create({ action, description, performedBy: userId, entity, entityId, metadata }).catch(() => {})
}

/* ── Dashboard stats ──────────────────────────────────────── */
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [pendingPacking, lowStock, returns, importedToday, recentActivity] = await Promise.all([
      Order.countDocuments({ status: { $in: ['CONFIRMED', 'PACKING'] } }),
      Product.countDocuments({ stock: { $lte: 10, $gt: 0 }, visible: true }),
      Order.countDocuments({ status: { $in: ['CANCELLED', 'RETURNED'] }, updatedAt: { $gte: today } }),
      InventoryTransaction.countDocuments({ type: 'import', createdAt: { $gte: today } }),
      ActivityLog.find()
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(8),
    ])

    res.json({ success: true, data: { pendingPacking, lowStock, returns, importedToday, recentActivity } })
  } catch (err) { next(err) }
}

/* ── Warehouse orders (CONFIRMED / PACKING / SHIPPING) ───── */
exports.getWarehouseOrders = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1)
    const limit  = Math.min(50, parseInt(req.query.limit) || 20)
    const status = req.query.status

    const filter = { status: { $in: ['CONFIRMED', 'PACKING', 'SHIPPING'] } }
    if (status && ['CONFIRMED', 'PACKING', 'SHIPPING'].includes(status)) filter.status = status

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ])

    res.json({ success: true, data: orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

/* ── Update order status (warehouse workflow) ─────────────── */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body
    const ALLOWED = ['CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED']
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' })

    const prevStatus = order.status
    order.status = status
    order.statusHistory.push({ status, changedAt: new Date(), changedBy: req.user._id })
    await order.save()

    await log('update_order_status',
      `Đơn #${order._id.toString().slice(-8).toUpperCase()}: ${prevStatus} → ${status}`,
      req.user._id, 'order', order._id, { prevStatus, newStatus: status, note })

    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

/* ── Inventory: list products with stock info ─────────────── */
exports.getInventory = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1)
    const limit  = Math.min(100, parseInt(req.query.limit) || 30)
    const search = req.query.search?.trim()
    const filter = req.query.filter // 'low' | 'out'

    const query = { visible: true }
    if (search) query.$or = [
      { title:  { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ]
    if (filter === 'low') query.stock = { $gt: 0, $lte: 10 }
    if (filter === 'out') query.stock = 0

    const [products, total] = await Promise.all([
      Product.find(query).sort({ stock: 1, title: 1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(query),
    ])

    res.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

/* ── Import stock ─────────────────────────────────────────── */
exports.importStock = async (req, res, next) => {
  try {
    const { productId, quantity, costPrice, supplier, notes } = req.body
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' })
    }

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })

    const stockBefore = product.stock
    product.stock += parseInt(quantity)
    await product.save()

    await InventoryTransaction.create({
      product: productId, type: 'import',
      quantity, stockBefore, stockAfter: product.stock,
      costPrice, supplier, notes, performedBy: req.user._id,
    })

    await log('import_stock',
      `Nhập kho "${product.title}": +${quantity} (${stockBefore} → ${product.stock})`,
      req.user._id, 'product', product._id, { quantity, supplier })

    res.json({ success: true, data: { product, stockBefore, stockAfter: product.stock } })
  } catch (err) { next(err) }
}

/* ── Audit: submit physical count ────────────────────────────*/
exports.submitAudit = async (req, res, next) => {
  try {
    const { items } = req.body // [{productId, actualCount, reason}]
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Dữ liệu kiểm kê không hợp lệ' })
    }

    const results = []
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) continue

      const diff = item.actualCount - product.stock
      if (diff === 0) { results.push({ product: product._id, diff: 0 }); continue }

      const stockBefore = product.stock
      product.stock = item.actualCount
      await product.save()

      await InventoryTransaction.create({
        product: product._id, type: 'audit_adjust',
        quantity: diff, stockBefore, stockAfter: product.stock,
        reason: item.reason || 'Kiểm kê', notes: item.notes,
        performedBy: req.user._id,
      })

      results.push({ product: product._id, title: product.title, diff, stockBefore, stockAfter: product.stock })
    }

    await log('submit_audit', `Kiểm kê kho: ${items.length} sản phẩm`, req.user._id, null, null, { count: items.length })

    res.json({ success: true, data: results })
  } catch (err) { next(err) }
}

/* ── Inventory transactions history ──────────────────────────*/
exports.getTransactions = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)

    const [txns, total] = await Promise.all([
      InventoryTransaction.find()
        .populate('product', 'title image')
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      InventoryTransaction.countDocuments(),
    ])

    res.json({ success: true, data: txns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

/* ── Returns / cancellations ─────────────────────────────────*/
exports.getReturns = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1)
    const limit  = Math.min(50, parseInt(req.query.limit) || 20)
    const status = req.query.status

    const filter = { status: { $in: ['CANCELLED', 'RETURNED'] } }
    if (status && ['CANCELLED', 'RETURNED'].includes(status)) filter.status = status

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ])

    res.json({ success: true, data: orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

/* ── Process return: restock or mark damaged ──────────────── */
exports.processReturn = async (req, res, next) => {
  try {
    const { restockItems, damagedItems, notes } = req.body
    // restockItems: [{productId, quantity}]
    // damagedItems: [{productId, quantity, reason}]

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' })

    for (const item of (restockItems || [])) {
      const product = await Product.findById(item.productId)
      if (!product) continue
      const stockBefore = product.stock
      product.stock += item.quantity
      await product.save()
      await InventoryTransaction.create({
        product: item.productId, type: 'return',
        quantity: item.quantity, stockBefore, stockAfter: product.stock,
        reason: 'Hoàn hàng nguyên vẹn', notes,
        referenceOrder: order._id, performedBy: req.user._id,
      })
    }

    for (const item of (damagedItems || [])) {
      await InventoryTransaction.create({
        product: item.productId, type: 'export',
        quantity: -item.quantity,
        stockBefore: 0, stockAfter: 0,
        reason: item.reason || 'Hàng lỗi - không nhập lại',
        referenceOrder: order._id, performedBy: req.user._id,
      })
    }

    if (order.status === 'CANCELLED') {
      order.status = 'CANCELLED'
    } else {
      order.status = 'RETURNED'
      order.statusHistory.push({ status: 'RETURNED', changedAt: new Date(), changedBy: req.user._id })
      await order.save()
    }

    await log('process_return',
      `Xử lý hoàn trả đơn #${order._id.toString().slice(-8).toUpperCase()}`,
      req.user._id, 'order', order._id, { restockItems, damagedItems })

    res.json({ success: true, message: 'Đã xử lý hoàn trả' })
  } catch (err) { next(err) }
}

/* ── Activity log ────────────────────────────────────────────*/
exports.getActivity = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 30)

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(),
    ])

    res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

/* ── Low stock products ───────────────────────────────────── */
exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({ stock: { $lte: 10 }, visible: true })
      .select('title author image stock category')
      .sort({ stock: 1 })
      .limit(20)
    res.json({ success: true, data: products })
  } catch (err) { next(err) }
}
