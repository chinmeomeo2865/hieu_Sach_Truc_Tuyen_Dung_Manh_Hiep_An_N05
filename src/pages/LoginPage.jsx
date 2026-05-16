import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore }  from '../store/authStore'
import { useToastStore } from '../store/toastStore'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const login     = useAuthStore(s => s.login)
  const showToast = useToastStore(s => s.show)
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin/orders' : '/')
    } catch (err) {
      showToast({ message: err.message || 'Email hoặc mật khẩu không đúng', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-warm flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-semibold text-ink">Hiệu Sách Chin</Link>
          <p className="mt-2 text-sm text-muted">Đăng nhập để tiếp tục</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-divider-lt rounded-sm shadow-card p-8 space-y-5"
        >
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ban@email.com"
              className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors duration-200"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase py-3 rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Chưa có tài khoản?{' '}
          <Link to="/auth/register" className="text-ink font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
