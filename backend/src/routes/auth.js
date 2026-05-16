const router = require('express').Router()
const { body } = require('express-validator')
const { protect } = require('../middleware/auth')
const { register, login, getMe, updateMe, changePassword } = require('../controllers/authController')

const registerRules = [
  body('name').trim().notEmpty().withMessage('Tên là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
]

const loginRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
]

router.post('/register', registerRules, register)
router.post('/login',    loginRules,    login)
router.get('/me',        protect,       getMe)
router.put('/me',        protect,       updateMe)
router.put('/password',  protect,       changePassword)

module.exports = router
