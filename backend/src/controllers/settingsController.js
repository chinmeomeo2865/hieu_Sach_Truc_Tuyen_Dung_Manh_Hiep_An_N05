const Settings = require('../models/Settings')

const DEFAULT = {
  _id: 'singleton',
  shippingFee: 0,
  freeShippingThreshold: 250000,
  siteName: 'Hiệu Sách Chin',
  supportEmail: '23011987@st.phenikaa-uni.edu.vn',
  hotline: '0383 687 670',
  socialLinks: { facebook: '', instagram: '', tiktok: '' },
  banners: [],
}

exports.getSettings = async (req, res, next) => {
  try {
    let s = await Settings.findById('singleton')
    if (!s) s = await Settings.create(DEFAULT)
    res.json({ success: true, data: s })
  } catch (err) { next(err) }
}

/* GET /api/settings/public — cấu hình an toàn cho khách (phí ship, liên hệ) */
exports.getPublicSettings = async (req, res, next) => {
  try {
    let s = await Settings.findById('singleton')
    if (!s) s = await Settings.create(DEFAULT)
    res.json({ success: true, data: {
      shippingFee:           s.shippingFee,
      freeShippingThreshold: s.freeShippingThreshold,
      siteName:              s.siteName,
      hotline:               s.hotline,
      supportEmail:          s.supportEmail,
      socialLinks:           s.socialLinks,
    }})
  } catch (err) { next(err) }
}

exports.updateSettings = async (req, res, next) => {
  try {
    const allowed = ['shippingFee', 'freeShippingThreshold', 'siteName', 'supportEmail', 'hotline', 'socialLinks', 'banners']
    const update  = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })

    const s = await Settings.findByIdAndUpdate(
      'singleton',
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    res.json({ success: true, data: s })
  } catch (err) { next(err) }
}
