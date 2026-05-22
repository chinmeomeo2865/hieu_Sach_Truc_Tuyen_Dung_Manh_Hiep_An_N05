import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    navigate('/auth/login')
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
    <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-8">
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">Hồ sơ cá nhân</h1>

      {/* Thông tin cá nhân */}
      <section className="bg-white border border-divider-lt rounded-sm p-6">
        <h2 className="font-display font-semibold text-ink mb-5">Thông tin cá nhân</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-muted bg-surface-subtle cursor-not-allowed"
            />
            <p className="text-xs text-subtle">Email không thể thay đổi</p>
          </div>

          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Họ và tên</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={updateProfileField('name')}
              placeholder="Nguyễn Văn A"
              className={`w-full border rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors ${profileErrors.name ? 'border-red-400' : 'border-divider'}`}
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
              className={`w-full border rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors ${profileErrors.phone ? 'border-red-400' : 'border-divider'}`}
            />
            {profileErrors.phone && <p className="text-xs text-red-500">{profileErrors.phone}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors"
            >
              {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>

      {/* Đổi mật khẩu */}
      <section className="bg-white border border-divider-lt rounded-sm p-6">
        <h2 className="font-display font-semibold text-ink mb-5">Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
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
                className={`w-full border rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors ${passErrors[field] ? 'border-red-400' : 'border-divider'}`}
              />
              {passErrors[field] && <p className="text-xs text-red-500">{passErrors[field]}</p>}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPass}
              className="px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors"
            >
              {savingPass ? 'Đang xử lý…' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
