const router = require('express').Router()
const { protect, authorize } = require('../middleware/auth')
const {
  getMyOrders, getOrder, createOrder,
  cancelOrder, updateStatus, getAllOrders,
} = require('../controllers/orderController')

router.use(protect)

/* Customer */
router.get('/',         getMyOrders)
router.post('/',        createOrder)
router.get('/:id',      getOrder)
router.put('/:id/cancel', cancelOrder)

/* Warehouse + Admin */
router.put(
  '/:id/status',
  authorize('warehouse', 'admin'),
  updateStatus
)

/* Admin only */
router.get(
  '/admin/all',
  authorize('admin'),
  getAllOrders
)

module.exports = router
