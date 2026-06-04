const Notification = require('../models/Notification')

/* GET /api/notifications  [auth] */
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false })
    res.json({ success: true, data: notifications, unreadCount })
  } catch (err) { next(err) }
}

/* PUT /api/notifications/read-all  [auth] */
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' })
  } catch (err) { next(err) }
}

/* PUT /api/notifications/:id/read  [auth] */
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

/* Utility — dùng từ các controller khác */
exports.createNotification = async ({ userId, type = 'SYSTEM', title, message, link = '' }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link })
  } catch {}
}
