const express = require('express')
const { protect, authorize } = require('../middleware/auth')
const {
  createReview,
  getMyReviews,
  getRecentReviews,
  getAllReviewsAdmin,
  deleteReview,
} = require('../controllers/reviewController')

const router = express.Router()

router.post('/',                 protect, createReview)
router.get('/my-reviews',        protect, getMyReviews)
router.get('/recent',            getRecentReviews)
router.get('/admin/all',         protect, authorize('admin'), getAllReviewsAdmin)
router.delete('/:id',            protect, authorize('admin'), deleteReview)

module.exports = router
