const { validationResult } = require('express-validator')
const Product = require('../models/Product')
const InventoryTransaction = require('../models/InventoryTransaction')

/* GET /api/products */
const getProducts = async (req, res, next) => {
  try {
    const {
      search, category, badge, featured,
      sort = 'newest',
      page = 1, limit = 12,
    } = req.query

    // Lọc theo visible: true và status: 'active' đối với khách hàng công khai
    const filter = { visible: true, status: 'active' }

    if (search)   filter.$text = { $search: search }
    if (category) filter.categorySlug = category
    if (badge)    filter.badge = badge
    if (featured === 'true') filter.featured = true

    let sortOption
    if (!sort || sort === 'newest') {
      sortOption = { inStock: -1, weight: -1, createdAt: -1 }
    } else {
      const sortMap = {
        oldest:     { createdAt:  1 },
        price_asc:  { price:  1 },
        price_desc: { price: -1 },
        rating:     { rating: -1 },
      }
      const sortOptionSelected = sortMap[sort] ?? { createdAt: -1 }
      sortOption = { inStock: -1, ...sortOptionSelected }
    }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Product.countDocuments(filter)

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))

    res.json({
      success: true,
      data: products,
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) { next(err) }
}

/* GET /api/products/:id */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, visible: true, status: 'active' })
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

/* POST /api/products  — pm / admin */
const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }
    
    // Gán inStock tự động
    if (req.body.stock !== undefined) {
      req.body.inStock = Number(req.body.stock) > 0
    }

    const product = await Product.create(req.body)

    // Tạo lịch sử kho hàng ban đầu nếu stock > 0
    if (product.stock > 0) {
      await InventoryTransaction.create({
        product:     product._id,
        type:        'import',
        quantity:    product.stock,
        stockBefore: 0,
        stockAfter:  product.stock,
        reason:      'Nhập kho ban đầu khi tạo sách mới',
        performedBy: req.user._id,
      }).catch(() => {})
    }

    res.status(201).json({ success: true, data: product })
  } catch (err) { next(err) }
}

/* PUT /api/products/:id  — pm / admin */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })

    const oldStock = product.stock
    const newStock = req.body.stock !== undefined ? Number(req.body.stock) : oldStock
    const diff = newStock - oldStock

    if (req.body.stock !== undefined) {
      req.body.inStock = newStock > 0
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })

    // Ghi nhật ký kho hàng nếu tồn kho thay đổi
    if (diff !== 0) {
      await InventoryTransaction.create({
        product:     updatedProduct._id,
        type:        'audit_adjust',
        quantity:    diff,
        stockBefore: oldStock,
        stockAfter:  newStock,
        reason:      'Điều chỉnh tồn kho khi cập nhật thông tin sách',
        performedBy: req.user._id,
      }).catch(() => {})
    }

    res.json({ success: true, data: updatedProduct })
  } catch (err) { next(err) }
}

/* DELETE /api/products/:id  — admin (soft delete) */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { visible: false, status: 'archived' }, // Đổi luôn status sang archived khi soft delete
      { new: true }
    )
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    res.json({ success: true, message: 'Đã ẩn sách khỏi danh sách' })
  } catch (err) { next(err) }
}

/* PUT /api/products/:id/stock  — warehouse */
const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body
    if (stock == null || stock < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' })
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { stock, inStock: Number(stock) > 0 }, 
      { new: true }
    )
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

/* GET /api/products/admin/all  — admin / product_manager */
const getAdminProducts = async (req, res, next) => {
  try {
    const {
      search, category, badge,
      visible, status,
      sort = 'newest',
      page = 1, limit = 20,
    } = req.query

    const filter = {}
    if (search)              filter.$text        = { $search: search }
    if (category)            filter.categorySlug = category
    if (badge)               filter.badge        = badge
    if (visible === 'true')  filter.visible      = true
    if (visible === 'false') filter.visible      = false
    if (status)              filter.status       = status

    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_asc:  { price:  1 },
      price_desc: { price: -1 },
    }
    const sortOption = sortMap[sort] ?? sortMap.newest
    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Product.countDocuments(filter)

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))

    res.json({
      success: true,
      data: products,
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) { next(err) }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, getAdminProducts }
