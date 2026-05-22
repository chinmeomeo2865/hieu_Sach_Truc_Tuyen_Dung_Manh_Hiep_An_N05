const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
  _id:        { type: String, default: 'singleton' },
  shippingFee:              { type: Number, default: 0 },
  freeShippingThreshold:    { type: Number, default: 250000 },
  siteName:      { type: String, default: 'Hiệu Sách Chin' },
  supportEmail:  { type: String, default: '23011987@st.phenikaa-uni.edu.vn' },
  hotline:       { type: String, default: '0383 687 670' },
  socialLinks: {
    facebook:  { type: String, default: '' },
    instagram: { type: String, default: '' },
    tiktok:    { type: String, default: '' },
  },
  banners: [{
    title:    String,
    imageUrl: String,
    link:     String,
    active:   { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
  }],
}, { timestamps: true, _id: false })

module.exports = mongoose.model('Settings', settingsSchema)
