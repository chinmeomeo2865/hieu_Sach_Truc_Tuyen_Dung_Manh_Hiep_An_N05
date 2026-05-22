const express = require('express')
const { protect } = require('../middleware/auth')
const {
  createReview,
  getMyReviews,
  getRecentReviews,
} = require('../controllers/reviewController')

const router = express.Router()

router.post('/',           protect, createReview)
router.get('/my-reviews',  protect, getMyReviews)
router.get('/recent',      getRecentReviews)   // public, dùng cho homepage

module.exports = router
