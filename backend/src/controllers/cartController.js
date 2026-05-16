const Cart    = require('../models/Cart')
const Product = require('../models/Product')

const populateOpts = { path: 'items.product', select: 'title author image price stock visible' }

/* GET /api/cart */
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(populateOpts)
    if (!cart) return res.json({ success: true, data: { items: [], total: 0, totalItems: 0 } })
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

/* POST /api/cart/items  — add or increment */
const addItem = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body
    if (!productId) return res.status(400).json({ success: false, message: 'productId là bắt buộc' })

    const product = await Product.findOne({ _id: productId, visible: true })
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Chỉ còn ${product.stock} quyển trong kho` })
    }

    let cart = await Cart.findOne({ user: req.user._id })
    if (!cart) cart = new Cart({ user: req.user._id, items: [] })

    const idx = cart.items.findIndex(i => i.product.toString() === productId)
    if (idx >= 0) {
      const newQty = cart.items[idx].qty + Number(qty)
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Chỉ còn ${product.stock} quyển trong kho` })
      }
      cart.items[idx].qty = newQty
    } else {
      cart.items.push({ product: productId, qty: Number(qty), price: product.price })
    }

    await cart.save()
    await cart.populate(populateOpts)
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

/* PUT /api/cart/items/:productId  — set quantity */
const updateItem = async (req, res, next) => {
  try {
    const { qty } = req.body
    const { productId } = req.params

    if (!qty || qty < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' })
    }

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng trống' })

    if (Number(qty) === 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId)
    } else {
      const product = await Product.findById(productId)
      if (product && Number(qty) > product.stock) {
        return res.status(400).json({ success: false, message: `Chỉ còn ${product.stock} quyển trong kho` })
      }
      const item = cart.items.find(i => i.product.toString() === productId)
      if (!item) return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ' })
      item.qty = Number(qty)
    }

    await cart.save()
    await cart.populate(populateOpts)
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

/* DELETE /api/cart/items/:productId */
const removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng trống' })

    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId)
    await cart.save()
    await cart.populate(populateOpts)
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

/* DELETE /api/cart */
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng' })
  } catch (err) { next(err) }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart }
