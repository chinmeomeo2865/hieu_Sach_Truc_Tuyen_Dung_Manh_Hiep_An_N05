import { useState, useCallback }  from 'react'
import { useNavigate }            from 'react-router-dom'
import { useAuthStore }           from '../../store/authStore'
import { useToastStore }          from '../../store/toastStore'

/* ── Eye icon ─────────────────────────────────────────────────── */
function EyeIcon({ open }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  )
}

/* ── Password strength ────────────────────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 6)  score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { score, label: 'Rất yếu', color: 'bg-red-400' }
  if (score === 2) return { score, label: 'Yếu',    color: 'bg-orange-400' }
  if (score === 3) return { score, label: 'Trung bình', color: 'bg-amber-400' }
  if (score === 4) return { score, label: 'Mạnh',   color: 'bg-emerald-400' }
  return                  { score, label: 'Rất mạnh', color: 'bg-emerald-500' }
}

const PHONE_REGEX = /^0\d{9}$/

export default function AccountProfilePage() {
  const user           = useAuthStore(s => s.user)
  const updateProfile  = useAuthStore(s => s.updateProfile)
  const changePassword = useAuthStore(s => s.changePassword)
  const isAuth         = useAuthStore(s => !!s.token)
  const showToast      = useToastStore(s => s.show)
  const navigate       = useNavigate()

  if (!isAuth) {
    navigate('/auth/login', { replace: true, state: { from: '/account/profile' } })
    return null
  }

  const [profileForm, setProfileForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [passErrors, setPassErrors] = useState({})
  const [savingPass, setSavingPass] = useState(false)
  const [passShow,   setPassShow]   = useState({ currentPassword: false, newPassword: false, confirm: false })
  const [passSuccess, setPassSuccess] = useState(false)

  const toggleShow = useCallback((field) => {
    setPassShow(p => ({ ...p, [field]: !p[field] }))
  }, [])

  const strength = getStrength(passForm.newPassword)
  const confirmMatch =
    passForm.confirm.length > 0 && passForm.newPassword === passForm.confirm

  function updateProfileField(field) {
    return e => {
      setProfileForm(f => ({ ...f, [field]: e.target.value }))
      setProfileErrors(err => ({ ...err, [field]: '' }))
    }
  }

  function updatePassField(field) {
    return e => {
      setPassForm(f => ({ ...f, [field]: e.target.value }))
      setPassErrors(err => ({ ...err, [field]: '' }))
      if (field !== 'currentPassword') setPassSuccess(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    const errors = {}
    if (!profileForm.name.trim()) errors.name = 'Vui lòng nhập họ tên'
    const cleanPhone = (profileForm.phone || '').replace(/[\s.-]/g, '')
    if (profileForm.phone && !PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'
    }
    if (Object.keys(errors).length) { setProfileErrors(errors); return }

    setSavingProfile(true)
    try {
      await updateProfile({ name: profileForm.name.trim(), phone: cleanPhone || undefined })
      showToast({ message: 'Cập nhật thông tin thành công', type: 'success' })
      setProfileForm(f => ({ ...f, phone: cleanPhone }))
    } catch (err) {
      showToast({ message: err.message || 'Cập nhật thất bại', type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    const errors = {}
    if (!passForm.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    if (!passForm.newPassword || passForm.newPassword.length < 6) errors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự'
    if (passForm.newPassword !== passForm.confirm) errors.confirm = 'Xác nhận mật khẩu không khớp'
    if (Object.keys(errors).length) { setPassErrors(errors); return }

    setSavingPass(true)
    try {
      await changePassword(passForm.currentPassword, passForm.newPassword)
      showToast({ message: 'Đổi mật khẩu thành công 🎉', type: 'success' })
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
      setPassShow({ currentPassword: false, newPassword: false, confirm: false })
      setPassSuccess(true)
    } catch (err) {
      showToast({ message: err.message || 'Đổi mật khẩu thất bại', type: 'error' })
      setPassErrors(prev => ({ ...prev, currentPassword: 'Mật khẩu hiện tại không đúng' }))
    } finally {
      setSavingPass(false)
    }
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent">Tài khoản</p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink mt-0.5">Hồ sơ cá nhân</h1>
      </div>

      {/* Thông tin cá nhân */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-divider-lt pb-3 justify-center">
          <span className="text-lg">👤</span>
          <h2 className="font-display font-semibold text-ink text-lg">Thông tin cá nhân</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed text-center">
          Quản lý thông tin liên hệ và họ tên hiển thị của bạn. Những thông tin này giúp quá trình mua sách và giao nhận diễn ra chính xác nhất.
        </p>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-divider rounded-xl px-4 py-2.5 text-sm text-muted bg-surface-subtle cursor-not-allowed"
            />
            <p className="text-xs text-subtle">Email đăng ký tài khoản không thể thay đổi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Họ và tên</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={updateProfileField('name')}
                placeholder="Nguyễn Văn A"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all ${profileErrors.name ? 'border-red-400 bg-red-50/10' : 'border-divider'}`}
              />
              {profileErrors.name && <p className="text-xs text-red-500">{profileErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Số điện thoại</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={updateProfileField('phone')}
                placeholder="09x xxx xxxx"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all ${profileErrors.phone ? 'border-red-400 bg-red-50/10' : 'border-divider'}`}
              />
              {profileErrors.phone && <p className="text-xs text-red-500">{profileErrors.phone}</p>}
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-8 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>

      <div className="border-t border-divider-lt" />

      {/* Đổi mật khẩu */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-divider-lt pb-3 justify-center">
          <span className="text-lg">🔒</span>
          <h2 className="font-display font-semibold text-ink text-lg">Đổi mật khẩu</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed text-center">
          Sử dụng mật khẩu dài ít nhất 6 ký tự, kết hợp chữ hoa, chữ số và ký tự đặc biệt để tăng độ bảo mật.
        </p>

        {/* Success banner */}
        {passSuccess && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm font-medium text-emerald-700">Mật khẩu đã được cập nhật thành công!</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">

          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={passShow.currentPassword ? 'text' : 'password'}
                value={passForm.currentPassword}
                onChange={updatePassField('currentPassword')}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all ${
                  passErrors.currentPassword ? 'border-red-400 bg-red-50/10' : 'border-divider'
                }`}
              />
              <button
                type="button"
                onClick={() => toggleShow('currentPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink transition-colors p-0.5"
                tabIndex={-1}
                aria-label={passShow.currentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <EyeIcon open={passShow.currentPassword} />
              </button>
            </div>
            {passErrors.currentPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                </svg>
                {passErrors.currentPassword}
              </p>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={passShow.newPassword ? 'text' : 'password'}
                value={passForm.newPassword}
                onChange={updatePassField('newPassword')}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all ${
                  passErrors.newPassword ? 'border-red-400 bg-red-50/10' : 'border-divider'
                }`}
              />
              <button
                type="button"
                onClick={() => toggleShow('newPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink transition-colors p-0.5"
                tabIndex={-1}
                aria-label={passShow.newPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <EyeIcon open={passShow.newPassword} />
              </button>
            </div>

            {/* Strength bar */}
            {passForm.newPassword.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : 'bg-divider'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] font-semibold ${
                  strength.score <= 1 ? 'text-red-500' :
                  strength.score === 2 ? 'text-orange-500' :
                  strength.score === 3 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  Độ mạnh: {strength.label}
                </p>
              </div>
            )}

            {passErrors.newPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                </svg>
                {passErrors.newPassword}
              </p>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={passShow.confirm ? 'text' : 'password'}
                value={passForm.confirm}
                onChange={updatePassField('confirm')}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                className={`w-full border rounded-xl px-4 py-2.5 pr-20 text-sm text-ink placeholder:text-subtle focus:outline-none focus:ring-2 transition-all ${
                  passErrors.confirm
                    ? 'border-red-400 bg-red-50/10 focus:ring-red-100'
                    : confirmMatch
                    ? 'border-emerald-400 bg-emerald-50/20 focus:ring-emerald-100'
                    : 'border-divider focus:border-ink focus:ring-ink/10'
                }`}
              />
              {/* Match indicator */}
              {passForm.confirm.length > 0 && (
                <span className={`absolute right-10 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none ${
                  confirmMatch ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {confirmMatch ? '✓ Khớp' : '✗ Sai'}
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleShow('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink transition-colors p-0.5"
                tabIndex={-1}
                aria-label={passShow.confirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <EyeIcon open={passShow.confirm} />
              </button>
            </div>
            {passErrors.confirm && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                </svg>
                {passErrors.confirm}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={savingPass || (passForm.confirm.length > 0 && !confirmMatch)}
              className="px-8 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-xl hover:bg-ink-80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            >
              {savingPass ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Đang xử lý…
                </span>
              ) : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
