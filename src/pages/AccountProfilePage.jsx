import { useState }      from 'react'
import { useNavigate }   from 'react-router-dom'
import { useAuthStore }  from '../store/authStore'
import { useToastStore } from '../store/toastStore'

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
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    const errors = {}
    if (!profileForm.name.trim()) errors.name = 'Vui lòng nhập họ tên'
    if (profileForm.phone && !PHONE_REGEX.test(profileForm.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'
    }
    if (Object.keys(errors).length) { setProfileErrors(errors); return }

    setSavingProfile(true)
    try {
      await updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone.trim() || undefined })
      showToast({ message: 'Cập nhật thông tin thành công', type: 'success' })
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
      showToast({ message: 'Đổi mật khẩu thành công', type: 'success' })
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      showToast({ message: err.message || 'Đổi mật khẩu thất bại', type: 'error' })
    } finally {
      setSavingPass(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent">Tài khoản</p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink mt-0.5">Hồ sơ cá nhân</h1>
      </div>

      {/* Thông tin cá nhân */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-divider-lt pb-3">
          <span className="text-lg">👤</span>
          <h2 className="font-display font-semibold text-ink text-lg">Thông tin cá nhân</h2>
        </div>
        <p className="text-xs text-muted max-w-xl leading-relaxed">
          Quản lý thông tin liên hệ và họ tên hiển thị của bạn. Những thông tin này giúp quá trình mua sách và giao nhận diễn ra chính xác nhất.
        </p>
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>

      <div className="border-t border-divider-lt" />

      {/* Đổi mật khẩu */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-divider-lt pb-3">
          <span className="text-lg">🔒</span>
          <h2 className="font-display font-semibold text-ink text-lg">Đổi mật khẩu</h2>
        </div>
        <p className="text-xs text-muted max-w-xl leading-relaxed">
          Bạn nên sử dụng mật khẩu mạnh dài ít nhất 6 ký tự, kết hợp chữ cái và chữ số để tăng tính an toàn cho tài khoản.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {[
            { field: 'currentPassword', label: 'Mật khẩu hiện tại', placeholder: '••••••••' },
            { field: 'newPassword',     label: 'Mật khẩu mới',      placeholder: 'Tối thiểu 6 ký tự' },
            { field: 'confirm',         label: 'Xác nhận mật khẩu mới', placeholder: '••••••••' },
          ].map(({ field, label, placeholder }) => (
            <div key={field} className="space-y-1">
              <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">{label}</label>
              <input
                type="password"
                value={passForm[field]}
                onChange={updatePassField(field)}
                placeholder={placeholder}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all ${passErrors[field] ? 'border-red-400 bg-red-50/10' : 'border-divider'}`}
              />
              {passErrors[field] && <p className="text-xs text-red-500">{passErrors[field]}</p>}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPass}
              className="px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {savingPass ? 'Đang xử lý…' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
