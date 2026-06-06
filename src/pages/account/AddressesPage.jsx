import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore }  from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { api }           from '../../services/api'

const CITIES = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Huế','Nha Trang','Biên Hòa','Vũng Tàu','Thái Nguyên','Khác']

const EMPTY_FORM = { label: '', name: '', phone: '', street: '', city: 'Hà Nội', isDefault: false }

function getAddressLabelIcon(label) {
  if (!label) return null
  const l = label.toLowerCase()
  if (l.includes('nhà') || l.includes('home') || l.includes('riêng')) return '🏠'
  if (l.includes('văn phòng') || l.includes('công ty') || l.includes('làm') || l.includes('work') || l.includes('office')) return '🏢'
  return '📍'
}

function AddressForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = f => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())   e.name   = 'Họ tên là bắt buộc'
    if (!/^0\d{9}$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ (VD: 0383687670)'
    if (!form.street.trim()) e.street = 'Địa chỉ là bắt buộc'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
  }

  const INPUT = 'w-full border border-divider rounded-xl px-4 py-2.5 text-[13.5px] text-[#0f0f0f] placeholder:text-[#a3a3a3] focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all'
  const ERROR = 'text-[11px] text-red-500 mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">Họ tên người nhận *</label>
          <input value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" className={INPUT} />
          {errors.name && <p className={ERROR}>{errors.name}</p>}
        </div>
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">Số điện thoại *</label>
          <input value={form.phone} onChange={set('phone')} placeholder="0383 687 670" className={INPUT} />
          {errors.phone && <p className={ERROR}>{errors.phone}</p>}
        </div>
      </div>
      <div>
        <label className="block text-2xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">Địa chỉ (số nhà, đường) *</label>
        <input value={form.street} onChange={set('street')} placeholder="123 Đường Nguyễn Trác" className={INPUT} />
        {errors.street && <p className={ERROR}>{errors.street}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">Tỉnh / Thành phố</label>
          <select value={form.city} onChange={set('city')} className={INPUT}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">Nhãn địa chỉ (tùy chọn)</label>
          <input value={form.label} onChange={set('label')} placeholder="VD: Nhà riêng, Văn phòng…" className={INPUT} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} className="w-4 h-4 accent-ink" />
        <span className="text-[13px] text-[#404040]">Đặt làm địa chỉ mặc định</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-ink text-white text-[13px] font-semibold rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer">
          {loading ? 'Đang lưu…' : 'Lưu địa chỉ'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 border border-divider text-ink-60 text-[13px] font-semibold rounded-xl hover:border-ink hover:text-ink transition-colors cursor-pointer">
          Hủy
        </button>
      </div>
    </form>
  )
}

export default function AddressesPage() {
  const isAuth   = useAuthStore(s => !!s.token)
  const showToast = useToastStore(s => s.show)
  const navigate  = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [mode,      setMode]      = useState(null) // null | 'add' | { editing: addr }

  useEffect(() => {
    if (!isAuth) { navigate('/auth/login', { replace: true, state: { from: '/account/addresses' } }); return }
    api.get('/api/auth/addresses')
      .then(r => setAddresses(r.data))
      .catch(() => showToast({ message: 'Không tải được địa chỉ', type: 'error' }))
      .finally(() => setLoading(false))
  }, [isAuth])

  async function handleSave(form) {
    setSaving(true)
    try {
      let res
      if (mode === 'add') {
        res = await api.post('/api/auth/addresses', form)
      } else {
        res = await api.put(`/api/auth/addresses/${mode.editing._id}`, form)
      }
      setAddresses(res.data)
      setMode(null)
      showToast({ message: mode === 'add' ? 'Đã thêm địa chỉ' : 'Đã cập nhật địa chỉ', type: 'success' })
    } catch (e) {
      showToast({ message: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa địa chỉ này?')) return
    try {
      const res = await api.delete(`/api/auth/addresses/${id}`)
      setAddresses(res.data)
      showToast({ message: 'Đã xóa địa chỉ', type: 'success' })
    } catch (e) {
      showToast({ message: e.message, type: 'error' })
    }
  }

  async function handleSetDefault(id) {
    try {
      const res = await api.put(`/api/auth/addresses/${id}/default`)
      setAddresses(res.data)
      showToast({ message: 'Đã đặt địa chỉ mặc định', type: 'success' })
    } catch (e) {
      showToast({ message: e.message, type: 'error' })
    }
  }

  if (loading) return (
    <div className="py-16 text-center text-sm text-muted">Đang tải…</div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-divider-lt pb-4">
        <div>
          <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-1">Tài khoản</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">Sổ địa chỉ</h1>
          <p className="text-xs text-muted mt-1">Quản lý địa chỉ giao hàng nhận hàng</p>
        </div>
        {!mode && (
          <button onClick={() => setMode('add')}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink text-white text-2xs font-semibold uppercase tracking-wider rounded-xl hover:bg-ink-80 transition-colors shadow-2xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Thêm địa chỉ
          </button>
        )}
      </div>

      {/* Form thêm/sửa */}
      {mode && (
        <div className="bg-[#fafaf9] border border-divider-lt rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-ink mb-4">
            {mode === 'add' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
          </p>
          <AddressForm
            initial={mode !== 'add' ? {
              label: mode.editing.label || '',
              name: mode.editing.name,
              phone: mode.editing.phone,
              street: mode.editing.street,
              city: mode.editing.city,
              isDefault: mode.editing.isDefault,
            } : undefined}
            onSave={handleSave}
            onCancel={() => setMode(null)}
            loading={saving}
          />
        </div>
      )}

      {/* Danh sách địa chỉ */}
      {addresses.length === 0 && !mode ? (
        <div className="text-center py-16 text-sm text-muted">
          <svg className="w-10 h-10 mx-auto mb-3 text-divider" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Chưa có địa chỉ nào. Thêm để thanh toán nhanh hơn!
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr._id}
              className={`border rounded-2xl p-5 transition-all duration-300 ${addr.isDefault ? 'border-ink bg-sand-50/50 shadow-2xs' : 'border-divider-lt bg-white hover:border-divider'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {addr.label && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent/5 px-2 py-0.5 rounded-md">
                        <span>{getAddressLabelIcon(addr.label)}</span>
                        <span>{addr.label}</span>
                      </span>
                    )}
                    {addr.isDefault && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-ink text-white px-2 py-0.5 rounded-md">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] font-semibold text-ink">{addr.name}</p>
                  <p className="text-xs text-muted mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-ink-80 mt-1">{addr.street}, {addr.city}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr._id)}
                      className="text-[11.5px] font-semibold text-muted hover:text-ink px-2.5 py-1 rounded-lg hover:bg-[#f5f5f4] transition-colors cursor-pointer">
                      Đặt mặc định
                    </button>
                  )}
                  <button onClick={() => setMode({ editing: addr })}
                    className="p-2 rounded-lg hover:bg-[#f5f5f4] text-muted hover:text-ink transition-colors cursor-pointer"
                    aria-label="Chỉnh sửa địa chỉ"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(addr._id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="Xóa địa chỉ"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
