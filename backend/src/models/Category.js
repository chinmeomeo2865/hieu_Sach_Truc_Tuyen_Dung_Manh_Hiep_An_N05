const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  slug:        { type: String, required: true, trim: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
}, { timestamps: true })

// slug index provided by unique:true on field

module.exports = mongoose.model('Category', categorySchema)
