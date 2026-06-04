const express = require('express')
const { protect } = require('../middleware/auth')
const { createPayOSLink, handlePayOSReturn, payosWebhook } = require('../controllers/paymentController')

const router = express.Router()

router.post('/payos/create',   protect, createPayOSLink)
router.get('/payos/return',    handlePayOSReturn)
router.post('/payos/webhook',  payosWebhook)

module.exports = router
