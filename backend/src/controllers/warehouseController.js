const Product              = require('../models/Product')
const Order                = require('../models/Order')
const InventoryTransaction = require('../models/InventoryTransaction')
const ActivityLog          = require('../models/ActivityLog')

async function log(action, description, userId, entity, entityId, metadata) {
  await ActivityLog.create({ action, description, performedBy: userId, entity, entityId, metadata }).catch(() => {})
}

const WAREHOUSE_ACTIONS = ['import_stock', 'export_stock', 'update_order_status', 'process_return', 'submit_audit']

/* ── Dashboard stats ──────────────────────────────────────── */
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [pendingPacking, lowStock, returns, importedToday, recentActivity] = await Promise.all([
      Order.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED', 'PACKING'] } }),
      Product.countDocuments({ stock: { $lte: 10, $gt: 0 }, visible: true }),
      Order.countDocuments({ status: { $in: ['CANCELLED', 'RETURNED'] }, updatedAt: { $gte: today } }),
      InventoryTransaction.countDocuments({ type: 'import', createdAt: { $gte: today } }),
      ActivityLog.find({ action: { $in: WAREHOUSE_ACTIONS } })
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
    const search = req.query.search?.trim()
    const date   = req.query.date // today | 7days | 30days

    const ACTIVE = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING']
    const ALL    = [...ACTIVE, 'DELIVERED']

    const filter = { status: { $in: ACTIVE } }
    if (status && ALL.includes(status)) filter.status = status

    if (search) {
      filter.$or = [
        { orderCode:       { $regex: search, $options: 'i' } },
        { 'address.name':  { $regex: search, $options: 'i' } },
        { 'address.phone': { $regex: search, $options: 'i' } },
      ]
    }

    if (['today', '7days', '30days'].includes(date)) {
      const start = new Date()
      if (date === 'today') start.setHours(0, 0, 0, 0)
      if (date === '7days')  start.setDate(start.getDate() - 7)
      if (date === '30days') start.setDate(start.getDate() - 30)
      filter.createdAt = { $gte: start }
    }

    /* Ưu tiên xử lý: PACKING (đang dở) → CONFIRMED (chờ) → SHIPPING (đợi shipper),
       trong mỗi nhóm đơn cũ nhất trước. Tab Đã giao: mới nhất trước. */
    const sortStage = status === 'DELIVERED'
      ? { createdAt: -1 }
      : { statusRank: 1, createdAt: 1 }

    const [orders, total, countAgg] = await Promise.all([
      Order.aggregate([
        { $match: filter },
        { $addFields: { statusRank: { $indexOfArray: [['PENDING', 'PACKING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'], '$status'] } } },
        { $sort: sortStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: { status: { $in: ALL } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    await Order.populate(orders, { path: 'user', select: 'name email phone' })

    const counts = countAgg.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {})
    counts.active = ACTIVE.reduce((s, k) => s + (counts[k] || 0), 0)
    counts.total  = ALL.reduce((s, k) => s + (counts[k] || 0), 0)

    res.json({ success: true, data: orders, counts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
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

    const [products, total, summaryAgg] = await Promise.all([
      Product.find(query).sort({ stock: 1, title: 1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(query),
      Product.aggregate([
        { $match: { visible: true } },
        { $group: {
          _id: null,
          totalSku:   { $sum: 1 },
          totalUnits: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          lowCount:   { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] } },
          outCount:   { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        } },
      ]),
    ])

    const summary = summaryAgg[0] || { totalSku: 0, totalUnits: 0, totalValue: 0, lowCount: 0, outCount: 0 }

    res.json({ success: true, data: products, summary, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
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
      req.user._id, 'product', product._id, { quantity, notes })

    res.json({ success: true, data: { product, stockBefore, stockAfter: product.stock } })
  } catch (err) { next(err) }
}

/* ── Export stock ─────────────────────────────────────────── */
exports.exportStock = async (req, res, next) => {
  try {
    const { productId, quantity, reason, notes } = req.body
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' })
    }

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })

    const qty = parseInt(quantity)
    if (qty > product.stock) {
      return res.status(400).json({ success: false, message: `Số lượng xuất (${qty}) vượt tồn kho hiện tại (${product.stock})` })
    }

    const stockBefore = product.stock
    product.stock -= qty
    await product.save()

    await InventoryTransaction.create({
      product: productId, type: 'export',
      quantity: qty, stockBefore, stockAfter: product.stock,
      reason, notes, performedBy: req.user._id,
    })

    await log('export_stock',
      `Xuất kho "${product.title}": -${qty} (${stockBefore} → ${product.stock})`,
      req.user._id, 'product', product._id, { quantity: qty, reason, notes })

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

    const adjustments = results
      .filter(r => r.diff !== 0)
      .map(r => {
        const item = items.find(it => String(it.productId) === String(r.product))
        return { title: r.title, diff: r.diff, reason: item?.reason || 'Kiểm kê' }
      })

    await log('submit_audit',
      `Kiểm kê kho: ${items.length} sản phẩm, ${adjustments.length} điều chỉnh`,
      req.user._id, null, null, { count: items.length, adjustments })

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
    const search = req.query.search?.trim()
    const date   = req.query.date // today | 7days | 30days

    const filter = { status: { $in: ['CANCELLED', 'RETURNED'] }, returnProcessed: { $ne: true } }
    if (status && ['CANCELLED', 'RETURNED'].includes(status)) filter.status = status

    if (search) {
      filter.$or = [
        { orderCode:       { $regex: search, $options: 'i' } },
        { 'address.name':  { $regex: search, $options: 'i' } },
        { 'address.phone': { $regex: search, $options: 'i' } },
      ]
    }

    if (['today', '7days', '30days'].includes(date)) {
      const start = new Date()
      if (date === 'today') start.setHours(0, 0, 0, 0)
      if (date === '7days')  start.setDate(start.getDate() - 7)
      if (date === '30days') start.setDate(start.getDate() - 30)
      filter.updatedAt = { $gte: start }
    }

    const [orders, total, countAgg] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: { status: { $in: ['CANCELLED', 'RETURNED'] } } },
        { $group: {
          _id: '$status',
          total:   { $sum: 1 },
          pending: { $sum: { $cond: [{ $ne: ['$returnProcessed', true] }, 1, 0] } },
        } },
      ]),
    ])

    const byStatus = countAgg.reduce((acc, c) => ({ ...acc, [c._id]: c }), {})
    const counts = {
      CANCELLED:        byStatus.CANCELLED?.total   || 0,
      RETURNED:         byStatus.RETURNED?.total    || 0,
      pendingCancelled: byStatus.CANCELLED?.pending || 0,
      pendingReturned:  byStatus.RETURNED?.pending  || 0,
    }
    counts.total   = counts.CANCELLED + counts.RETURNED
    counts.pending = counts.pendingCancelled + counts.pendingReturned

    res.json({ success: true, data: orders, counts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
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

    if (order.status !== 'CANCELLED') {
      order.status = 'RETURNED'
      order.statusHistory.push({ status: 'RETURNED', changedAt: new Date(), changedBy: req.user._id })
    }
    order.returnProcessed = true
    await order.save()

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
    const baseFilter = { action: { $in: WAREHOUSE_ACTIONS } }
    const filter = { ...baseFilter }
    if (WAREHOUSE_ACTIONS.includes(req.query.action)) {
      filter.action = req.query.action
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [logs, total, actionCounts, todayCount] = await Promise.all([
      ActivityLog.find(filter)
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(filter),
      ActivityLog.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      ActivityLog.countDocuments({ ...baseFilter, createdAt: { $gte: startOfToday } }),
    ])

    const byAction = actionCounts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {})
    const grandTotal = actionCounts.reduce((sum, c) => sum + c.count, 0)

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { total: grandTotal, today: todayCount, byAction },
    })
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
