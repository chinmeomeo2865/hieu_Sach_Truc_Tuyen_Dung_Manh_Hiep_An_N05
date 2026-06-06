import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function PMLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const login    = useAuthStore(s => s.login)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== 'product_manager' && user.role !== 'admin') {
        logout()
        setError('Tài khoản này không có quyền truy cập trang quản lý sản phẩm.')
        return
      }
      navigate('/pm', { replace: true })
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không đúng.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/15 border border-blue-500/25 rounded-xl mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <p className="font-display text-[22px] font-semibold text-white">Product Manager</p>
          <p className="mt-1 text-[11px] tracking-widest uppercase text-white/25 font-semibold">Hiệu Sách Chin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl px-7 py-7 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="pm@hieusachcin.vn"
              className="w-full bg-white/8 border border-white/12 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all [color-scheme:dark]"/>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40">Mật khẩu</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/8 border border-white/12 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all [color-scheme:dark]"/>
          </div>
          {error && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-500 text-white text-[12px] font-bold tracking-wider uppercase py-3 rounded-xl hover:bg-blue-400 disabled:opacity-50 transition-colors mt-1">
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center mt-5 text-[10px] text-white/20">Chỉ dành cho Product Manager · Hiệu Sách Chin</p>
      </div>
    </div>
  )
}
