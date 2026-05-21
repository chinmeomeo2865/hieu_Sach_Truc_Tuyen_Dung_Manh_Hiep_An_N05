const express = require('express')
const { getUsers, getUserDetail } = require('../controllers/userController')
const { protect, authorize }      = require('../middleware/auth')

const router = express.Router()

router.get('/',    protect, authorize('admin'), getUsers)
router.get('/:id', protect, authorize('admin'), getUserDetail)

module.exports = router
