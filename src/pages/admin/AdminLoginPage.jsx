import { useState }       from 'react'
import { useNavigate }    from 'react-router-dom'
import { useAuthStore }   from '../../store/authStore'

export default function AdminLoginPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const login  = useAuthStore(s => s.login)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== 'admin') {
        logout()
        setError('Tài khoản này không có quyền truy cập trang quản trị.')
        return
      }
      navigate('/admin/orders', { replace: true })
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-display text-2xl font-semibold text-white">
            Hiệu Sách <em className="italic font-medium">Chin</em>
          </p>
          <p className="mt-1.5 text-xs tracking-label-lg uppercase text-white/40">
            Trang quản trị
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#111010] border border-white/10 rounded-sm px-8 py-8 space-y-5"
        >
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-white/50">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@hieusachcin.vn"
              className="w-full bg-[#1e1c1a] border border-white/15 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors duration-200 [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-white/50">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1e1c1a] border border-white/15 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors duration-200 [color-scheme:dark]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-ink text-2xs font-semibold tracking-label-lg uppercase py-3 rounded-sm hover:bg-white/90 disabled:opacity-50 transition-colors duration-200 mt-2"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center mt-6 text-[11px] text-white/30">
          Trang này chỉ dành cho quản trị viên Hiệu Sách Chin.
        </p>
      </div>
    </div>
  )
}
