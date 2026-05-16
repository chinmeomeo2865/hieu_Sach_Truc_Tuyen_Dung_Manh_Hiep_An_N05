const router = require('express').Router()
const { protect } = require('../middleware/auth')
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController')

/* All cart routes require authentication */
router.use(protect)

router.get('/',                     getCart)
router.post('/items',               addItem)
router.put('/items/:productId',     updateItem)
router.delete('/items/:productId',  removeItem)
router.delete('/',                  clearCart)

module.exports = router
