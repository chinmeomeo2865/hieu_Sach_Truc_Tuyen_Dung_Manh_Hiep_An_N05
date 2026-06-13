const express = require('express')
const { getSettings, getPublicSettings, updateSettings } = require('../controllers/settingsController')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()
router.get('/public', getPublicSettings)
router.get('/',  protect, authorize('admin'), getSettings)
router.put('/',  protect, authorize('admin'), updateSettings)
module.exports = router
