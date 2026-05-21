const router = require('express').Router()
const { body } = require('express-validator')
const { protect, authorize } = require('../middleware/auth')
const {
  getProducts, getProduct,
  createProduct, updateProduct, deleteProduct, updateStock,
  getAdminProducts,
} = require('../controllers/productController')

const productRules = [
  body('title').trim().notEmpty().withMessage('Tên sách là bắt buộc'),
  body('author').trim().notEmpty().withMessage('Tác giả là bắt buộc'),
  body('price').isNumeric().withMessage('Giá phải là số').custom(v => v >= 0),
  body('category').trim().notEmpty().withMessage('Thể loại là bắt buộc'),
  body('categorySlug').trim().notEmpty().withMessage('Slug thể loại là bắt buộc'),
]

/* Public */
router.get('/', getProducts)

/* Admin / product_manager — must be before /:id */
router.get(
  '/admin/all',
  protect, authorize('product_manager', 'admin'),
  getAdminProducts
)

router.get('/:id', getProduct)

/* Protected — product_manager or admin */
router.post(
  '/',
  protect, authorize('product_manager', 'admin'),
  productRules, createProduct
)
router.put(
  '/:id',
  protect, authorize('product_manager', 'admin'),
  updateProduct
)
router.delete(
  '/:id',
  protect, authorize('admin'),
  deleteProduct
)
router.put(
  '/:id/stock',
  protect, authorize('warehouse', 'admin'),
  updateStock
)

module.exports = router
