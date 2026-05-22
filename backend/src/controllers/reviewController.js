const Review  = require('../models/Review')
const Product = require('../models/Product')
const Order   = require('../models/Order')

/* POST /api/reviews  [auth] */
exports.createReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment } = req.body

    if (!productId || !orderId || !rating) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá' })
    }

    // Kiểm tra đơn hàng đã DELIVERED, thuộc user, và chứa sản phẩm này
    const order = await Order.findOne({
      _id:    orderId,
      user:   req.user._id,
      status: 'DELIVERED',
      'items.product': productId,
    })
    if (!order) {
      return res.status(403).json({ success: false, message: 'Bạn chỉ có thể đánh giá sản phẩm trong đơn hàng đã giao' })
    }

    // Tạo hoặc cập nhật review (upsert)
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { user: req.user._id, product: productId, order: orderId, rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    // Cập nhật rating và reviewCount trên Product
    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    if (stats.length) {
      await Product.findByIdAndUpdate(productId, {
        rating:      Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].count,
      })
    }

    res.status(201).json({ success: true, data: review })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' })
    }
    next(err)
  }
}

/* GET /api/products/:id/reviews  [public] */
exports.getProductReviews = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page  || '1', 10)
    const limit = parseInt(req.query.limit || '10', 10)
    const skip  = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.id })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: req.params.id }),
    ])

    res.json({
      success: true,
      data: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

/* GET /api/reviews/my-reviews  [auth] — dùng để check đã review chưa */
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).select('product order rating')
    res.json({ success: true, data: reviews })
  } catch (err) {
    next(err)
  }
}

/* GET /api/reviews/recent  [public] — hiển thị trên trang chủ */
exports.getRecentReviews = async (req, res, next) => {
  try {
    const limit = Math.min(12, parseInt(req.query.limit) || 6)

    const reviews = await Review.find({ rating: { $gte: 4 }, comment: { $exists: true, $ne: '' } })
      .populate('user',    'name')
      .populate('product', 'title author image')
      .sort({ createdAt: -1 })
      .limit(limit)

    res.json({ success: true, data: reviews })
  } catch (err) {
    next(err)
  }
}
