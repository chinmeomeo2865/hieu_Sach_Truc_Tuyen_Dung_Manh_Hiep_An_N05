const express = require('express')
const { protect, authorize } = require('../middleware/auth')
const {
  getArticles, getRecentArticles, getArticle,
  createArticle, updateArticle, deleteArticle,
} = require('../controllers/articleController')

const router = express.Router()

router.get('/recent',  getRecentArticles)
router.get('/',        getArticles)
router.get('/:id',     getArticle)
router.post('/',       protect, authorize('admin', 'product_manager'), createArticle)
router.put('/:id',     protect, authorize('admin', 'product_manager'), updateArticle)
router.delete('/:id',  protect, authorize('admin'), deleteArticle)

module.exports = router
