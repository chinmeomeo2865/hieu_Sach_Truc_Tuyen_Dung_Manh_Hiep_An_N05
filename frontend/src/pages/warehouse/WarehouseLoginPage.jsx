import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function WarehouseLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const login    = useAuthStore(s => s.login)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== 'warehouse' && user.role !== 'admin') {
        logout()
        setError('Tài khoản này không có quyền truy cập hệ thống kho.')
        return
      }
      navigate('/warehouse', { replace: true })
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1c1c1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-400/15 border border-amber-400/30 rounded-xl mb-4">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <p className="font-display text-[22px] font-semibold text-white leading-tight">
            Hệ thống kho
          </p>
          <p className="mt-1 text-[11px] tracking-widest uppercase text-white/30 font-semibold">
            Hiệu Sách Chin · Thủ kho
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl px-7 py-7 space-y-4 backdrop-blur-sm">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40">
              Email
            </label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="thukho@hieusachcin.vn"
              className="w-full bg-white/8 border border-white/12 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40">
              Mật khẩu
            </label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/8 border border-white/12 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all [color-scheme:dark]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-400 text-[#1c1c1a] text-[12px] font-bold tracking-wider uppercase py-3 rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-colors mt-1"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  Đang đăng nhập…
                </span>
              : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center mt-5 text-[10px] text-white/20">
          Chỉ dành cho nhân viên kho · Hiệu Sách Chin
        </p>
      </div>
    </div>
  )
}
