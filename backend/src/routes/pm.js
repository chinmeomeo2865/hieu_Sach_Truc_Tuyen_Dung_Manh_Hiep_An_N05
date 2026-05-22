const router = require('express').Router()
const { protect, authorize } = require('../middleware/auth')
const pm = require('../controllers/pmController')

const guard = [protect, authorize('product_manager', 'admin')]

router.get('/stats',                    guard, pm.getStats)
router.get('/categories',               guard, pm.getCategories)
router.post('/categories',              guard, pm.createCategory)
router.put('/categories/:id',           guard, pm.updateCategory)
router.delete('/categories/:id',        guard, pm.deleteCategory)
router.get('/promotions',               guard, pm.getPromotions)
router.post('/promotions',              guard, pm.createPromotion)
router.post('/promotions/:id/end',      guard, pm.endPromotion)
router.delete('/promotions/:id',        guard, pm.deletePromotion)
router.post('/visibility',              guard, pm.toggleVisibility)
router.get('/activity',                 guard, pm.getActivity)

module.exports = router
