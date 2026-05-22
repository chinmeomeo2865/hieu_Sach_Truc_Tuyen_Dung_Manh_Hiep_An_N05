const express = require('express')
const {
  getUsers, getUserDetail,
  getInternalUsers, createInternalUser, updateInternalUser,
  toggleUserActive, deleteInternalUser,
} = require('../controllers/userController')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

/* Customer management */
router.get('/',    protect, authorize('admin'), getUsers)
router.get('/:id', protect, authorize('admin'), getUserDetail)

/* Internal staff management */
router.get   ('/internal/list',  protect, authorize('admin'), getInternalUsers)
router.post  ('/internal',       protect, authorize('admin'), createInternalUser)
router.put   ('/internal/:id',   protect, authorize('admin'), updateInternalUser)
router.put   ('/:id/status',     protect, authorize('admin'), toggleUserActive)
router.delete('/internal/:id',   protect, authorize('admin'), deleteInternalUser)

module.exports = router
