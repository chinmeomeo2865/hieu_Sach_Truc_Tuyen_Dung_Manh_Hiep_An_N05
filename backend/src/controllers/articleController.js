const Article = require('../models/Article')

/* GET /api/articles  [public] */
exports.getArticles = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  || '1', 10)
    const limit  = parseInt(req.query.limit || '9', 10)
    const skip   = (page - 1) * limit
    const status = req.query.status || 'PUBLISHED'

    const filter = status === 'all' ? {} : { status }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content'),
      Article.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) { next(err) }
}

/* GET /api/articles/recent  [public] — cho homepage */
exports.getRecentArticles = async (req, res, next) => {
  try {
    const limit = Math.min(6, parseInt(req.query.limit) || 3)
    const articles = await Article.find({ status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title summary coverImage category readTime createdAt')
    res.json({ success: true, data: articles })
  } catch (err) { next(err) }
}

/* GET /api/articles/:id  [public] */
exports.getArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name')
    if (!article || article.status === 'HIDDEN') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' })
    }
    res.json({ success: true, data: article })
  } catch (err) { next(err) }
}

/* POST /api/articles  [admin/pm] */
exports.createArticle = async (req, res, next) => {
  try {
    const { title, summary, content, coverImage, category, readTime, status } = req.body
    const article = await Article.create({
      title, summary, content, coverImage, category, readTime, status,
      author: req.user._id,
    })
    res.status(201).json({ success: true, data: article })
  } catch (err) { next(err) }
}

/* PUT /api/articles/:id  [admin/pm] */
exports.updateArticle = async (req, res, next) => {
  try {
    const { title, summary, content, coverImage, category, readTime, status } = req.body
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { title, summary, content, coverImage, category, readTime, status },
      { new: true, runValidators: true }
    )
    if (!article) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' })
    res.json({ success: true, data: article })
  } catch (err) { next(err) }
}

/* DELETE /api/articles/:id  [admin] */
exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id)
    if (!article) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' })
    res.json({ success: true, message: 'Đã xóa bài viết' })
  } catch (err) { next(err) }
}
