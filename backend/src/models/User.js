const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const addressSchema = new mongoose.Schema({
  label:     { type: String, default: 'Nhà' },
  name:      { type: String, required: true },
  phone:     { type: String, required: true },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true })

const userSchema = new mongoose.Schema({
  name:      { type: String, required: [true, 'Tên là bắt buộc'], trim: true },
  email:     { type: String, required: [true, 'Email là bắt buộc'], unique: true, lowercase: true },
  password:  { type: String, required: [true, 'Mật khẩu là bắt buộc'], minlength: 6, select: false },
  role:      {
    type:    String,
    enum:    ['customer', 'admin', 'product_manager', 'warehouse'],
    default: 'customer',
  },
  phone:     { type: String },
  addresses: [addressSchema],
  active:    { type: Boolean, default: true },
}, { timestamps: true })

/* Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

/* Remove sensitive fields from JSON output */
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
