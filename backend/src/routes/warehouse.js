const router = require('express').Router()
const { protect, authorize } = require('../middleware/auth')
const wh = require('../controllers/warehouseController')

const guard = [protect, authorize('warehouse', 'admin')]

router.get('/stats',                   guard, wh.getStats)
router.get('/orders',                  guard, wh.getWarehouseOrders)
router.put('/orders/:id/status',       guard, wh.updateOrderStatus)
router.get('/inventory',               guard, wh.getInventory)
router.post('/inventory/import',       guard, wh.importStock)
router.post('/inventory/audit',        guard, wh.submitAudit)
router.get('/inventory/transactions',  guard, wh.getTransactions)
router.get('/returns',                 guard, wh.getReturns)
router.post('/returns/:id/process',    guard, wh.processReturn)
router.get('/activity',               guard, wh.getActivity)
router.get('/low-stock',               guard, wh.getLowStock)

module.exports = router
