import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore }  from '../store/authStore'
import { useToastStore } from '../store/toastStore'

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const register  = useAuthStore(s => s.register)
  const showToast = useToastStore(s => s.show)
  const navigate  = useNavigate()
  const location  = useLocation()

  function handleBack() {
    if (location.key && location.key !== 'default') navigate(-1)
    else navigate('/')
  }

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())               e.name     = 'Vui lòng nhập họ tên'
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = 'Email không hợp lệ'
    if (form.password.length < 6)         e.password = 'Mật khẩu ít nhất 6 ký tự'
    if (form.password !== form.confirm)   e.confirm  = 'Mật khẩu không khớp'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register(form.name.trim(), form.email, form.password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      showToast({ message: err.message || 'Đăng ký thất bại, thử lại sau', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full border rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none transition-colors duration-200 ${
      errors[field] ? 'border-red-400 focus:border-red-500' : 'border-divider focus:border-ink'
    }`

  return (
    <div className="min-h-screen bg-surface-warm flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-label uppercase text-muted hover:text-ink transition-colors mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-semibold text-ink">Hiệu Sách Chin</Link>
          <p className="mt-2 text-sm text-muted">Tạo tài khoản mới</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-divider-lt rounded-sm shadow-card p-8 space-y-5"
        >
          {[
            { field: 'name',     label: 'Họ và tên',          type: 'text',     placeholder: 'Nguyễn Văn A' },
            { field: 'email',    label: 'Email',               type: 'email',    placeholder: 'ban@email.com' },
            { field: 'password', label: 'Mật khẩu',           type: 'password', placeholder: '••••••••' },
            { field: 'confirm',  label: 'Xác nhận mật khẩu',  type: 'password', placeholder: '••••••••' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field} className="space-y-1">
              <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">
                {label}
              </label>
              <input
                type={type}
                value={form[field]}
                onChange={update(field)}
                placeholder={placeholder}
                className={inputClass(field)}
              />
              {errors[field] && (
                <p className="text-xs text-red-500">{errors[field]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase py-3 rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'Đang tạo tài khoản…' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Đã có tài khoản?{' '}
          <Link to="/auth/login" state={{ from: location.state?.from }} className="text-ink font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
