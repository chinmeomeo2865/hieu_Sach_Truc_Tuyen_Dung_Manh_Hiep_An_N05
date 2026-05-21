const { validationResult } = require('express-validator')
const Product = require('../models/Product')

/* GET /api/products */
const getProducts = async (req, res, next) => {
  try {
    const {
      search, category, badge, featured,
      sort = 'newest',
      page = 1, limit = 12,
    } = req.query

    const filter = { visible: true }

    if (search)   filter.$text = { $search: search }
    if (category) filter.categorySlug = category
    if (badge)    filter.badge = badge
    if (featured === 'true') filter.featured = true

    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_asc:  { price:  1 },
      price_desc: { price: -1 },
      rating:     { rating: -1 },
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

/* GET /api/products/:id */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, visible: true })
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
    const product = await Product.create(req.body)
    res.status(201).json({ success: true, data: product })
  } catch (err) { next(err) }
}

/* PUT /api/products/:id  — pm / admin */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

/* DELETE /api/products/:id  — admin (soft delete) */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { visible: false },
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
      req.params.id, { stock }, { new: true }
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
      visible,
      sort = 'newest',
      page = 1, limit = 20,
    } = req.query

    const filter = {}
    if (search)              filter.$text        = { $search: search }
    if (category)            filter.categorySlug = category
    if (badge)               filter.badge        = badge
    if (visible === 'true')  filter.visible      = true
    if (visible === 'false') filter.visible      = false

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
