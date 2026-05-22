const router = require('express').Router()
const { protect, authorize } = require('../middleware/auth')
const cc = require('../controllers/couponController')

router.post('/validate', protect, cc.validate)

const admin = [protect, authorize('admin', 'product_manager')]
router.get('/',       admin, cc.getAll)
router.post('/',      admin, cc.create)
router.put('/:id',    admin, cc.update)
router.delete('/:id', [protect, authorize('admin')], cc.remove)

module.exports = router
