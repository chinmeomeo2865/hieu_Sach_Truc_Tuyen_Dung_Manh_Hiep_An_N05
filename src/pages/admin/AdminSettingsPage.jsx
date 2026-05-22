import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api }     from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const SECTIONS = [
  { id: 'general',  label: 'Tổng quan',       icon: '🏪' },
  { id: 'shipping', label: 'Vận chuyển',       icon: '🚚' },
  { id: 'banners',  label: 'Banner & Hình ảnh', icon: '🖼️' },
  { id: 'social',   label: 'Mạng xã hội',      icon: '📱' },
]

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f0f0f0]">
        <p className="text-[14px] font-semibold text-[#0f0f0f]">{title}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-[#f5f5f4] last:border-0 last:pb-0 first:pt-0">
      <div className="sm:w-52 flex-shrink-0">
        <p className="text-[12px] font-semibold text-[#0f0f0f]">{label}</p>
        {hint && <p className="text-[11px] text-[#a3a3a3] mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

const inputCls = "w-full border border-[#e5e5e5] rounded-lg px-3.5 py-2.5 text-[13px] text-[#0f0f0f] placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#0f0f0f] transition-colors"

export default function AdminSettingsPage() {
  const showToast = useToastStore(s => s.show)
  const [active, setActive]   = useState('general')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '' })

  useEffect(() => {
    api.get('/api/settings')
      .then(r => setSettings(r.data))
      .catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function save(patch) {
    setSaving(true)
    try {
      const res = await api.put('/api/settings', patch)
      setSettings(res.data)
      showToast({ message: 'Đã lưu cài đặt', type: 'success' })
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setSaving(false) }
  }

  function set(path, value) {
    setSettings(prev => {
      const next = { ...prev }
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) { obj[keys[i]] = { ...obj[keys[i]] }; obj = obj[keys[i]] }
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  function addBanner() {
    if (!newBanner.imageUrl.trim()) return
    const updated = [...(settings?.banners || []), { ...newBanner, active: true, order: settings?.banners?.length || 0 }]
    save({ banners: updated })
    setNewBanner({ title: '', imageUrl: '', link: '' })
  }

  function removeBanner(i) {
    const updated = settings.banners.filter((_, idx) => idx !== i)
    save({ banners: updated })
  }

  function toggleBanner(i) {
    const updated = settings.banners.map((b, idx) => idx === i ? { ...b, active: !b.active } : b)
    save({ banners: updated })
  }

  if (loading) return (
    <AdminLayout title="Cài đặt">
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#f5f5f4] rounded-xl animate-pulse" />)}
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="Cài đặt hệ thống">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-44 flex-shrink-0">
          <nav className="space-y-0.5 sticky top-20">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[12px] font-medium text-left transition-all duration-150
                  ${active === s.id ? 'bg-[#0f0f0f] text-white' : 'text-[#525252] hover:bg-[#f5f5f4] hover:text-[#0f0f0f]'}`}>
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {active === 'general' && (
            <Section title="Thông tin cửa hàng">
              <Field label="Tên cửa hàng">
                <input value={settings?.siteName || ''} onChange={e => set('siteName', e.target.value)} className={inputCls} placeholder="Hiệu Sách Chin" />
              </Field>
              <Field label="Email hỗ trợ" hint="Hiển thị trong footer và trang liên hệ">
                <input type="email" value={settings?.supportEmail || ''} onChange={e => set('supportEmail', e.target.value)} className={inputCls} placeholder="support@example.com" />
              </Field>
              <Field label="Số điện thoại" hint="Hotline hỗ trợ khách hàng">
                <input value={settings?.hotline || ''} onChange={e => set('hotline', e.target.value)} className={inputCls} placeholder="0383 687 670" />
              </Field>
              <div className="flex justify-end pt-2">
                <button onClick={() => save({ siteName: settings.siteName, supportEmail: settings.supportEmail, hotline: settings.hotline })} disabled={saving}
                  className="px-5 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] disabled:opacity-50 transition-colors">
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </Section>
          )}

          {active === 'shipping' && (
            <Section title="Cài đặt vận chuyển">
              <Field label="Phí vận chuyển" hint="Phí áp dụng khi đơn chưa đủ ngưỡng miễn phí">
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={settings?.shippingFee ?? 0} onChange={e => set('shippingFee', Number(e.target.value))} className={inputCls} />
                  <span className="text-[12px] text-[#737373] flex-shrink-0">₫</span>
                </div>
                <p className="text-[11px] text-[#a3a3a3] mt-1">0 = miễn phí tất cả đơn hàng</p>
              </Field>
              <Field label="Ngưỡng miễn phí ship" hint="Đơn hàng từ mức này trở lên được miễn phí vận chuyển">
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={settings?.freeShippingThreshold ?? 250000} onChange={e => set('freeShippingThreshold', Number(e.target.value))} className={inputCls} />
                  <span className="text-[12px] text-[#737373] flex-shrink-0">₫</span>
                </div>
              </Field>
              <div className="mt-4 p-4 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
                <p className="text-[12px] font-semibold text-[#0f0f0f] mb-1">Xem trước</p>
                <p className="text-[12px] text-[#737373]">
                  {settings?.shippingFee === 0
                    ? 'Miễn phí vận chuyển tất cả đơn'
                    : `Phí ship: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(settings?.shippingFee || 0)} · Miễn phí từ ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(settings?.freeShippingThreshold || 0)}`
                  }
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => save({ shippingFee: settings.shippingFee, freeShippingThreshold: settings.freeShippingThreshold })} disabled={saving}
                  className="px-5 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] disabled:opacity-50 transition-colors">
                  {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
                </button>
              </div>
            </Section>
          )}

          {active === 'banners' && (
            <Section title="Quản lý Banner">
              {/* Existing banners */}
              {settings?.banners?.length > 0 && (
                <div className="space-y-3 mb-5">
                  {settings.banners.map((b, i) => (
                    <div key={i} className={`flex gap-3 items-start p-3.5 border rounded-xl transition-all ${b.active ? 'border-[#e5e5e5]' : 'border-dashed border-[#e5e5e5] opacity-60'}`}>
                      {b.imageUrl && (
                        <img src={b.imageUrl} alt={b.title} className="w-20 h-12 object-cover rounded-lg flex-shrink-0 bg-[#f0f0f0]" onError={e => { e.target.style.display = 'none' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0f0f0f] truncate">{b.title || 'Banner ' + (i + 1)}</p>
                        <p className="text-[11px] text-[#a3a3a3] truncate mt-0.5">{b.imageUrl}</p>
                        {b.link && <p className="text-[11px] text-sky-600 truncate mt-0.5">{b.link}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => toggleBanner(i)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${b.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-[#f0f0f0] text-[#737373] hover:bg-[#e5e5e5]'}`}>
                          {b.active ? 'Hiển thị' : 'Ẩn'}
                        </button>
                        <button onClick={() => removeBanner(i)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#a3a3a3] hover:text-red-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add banner */}
              <div className="border border-dashed border-[#e5e5e5] rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-semibold text-[#0f0f0f]">Thêm banner mới</p>
                <input value={newBanner.title} onChange={e => setNewBanner(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Tiêu đề banner (tuỳ chọn)" />
                <input value={newBanner.imageUrl} onChange={e => setNewBanner(p => ({ ...p, imageUrl: e.target.value }))} className={inputCls} placeholder="URL hình ảnh *" />
                <input value={newBanner.link} onChange={e => setNewBanner(p => ({ ...p, link: e.target.value }))} className={inputCls} placeholder="Link khi click (tuỳ chọn)" />
                {newBanner.imageUrl && (
                  <img src={newBanner.imageUrl} alt="preview" className="w-full h-28 object-cover rounded-lg bg-[#f0f0f0]" onError={e => { e.target.style.display = 'none' }} />
                )}
                <button onClick={addBanner} disabled={!newBanner.imageUrl.trim() || saving}
                  className="w-full py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] disabled:opacity-40 transition-colors">
                  Thêm banner
                </button>
              </div>
            </Section>
          )}

          {active === 'social' && (
            <Section title="Mạng xã hội">
              {[
                { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/...' },
                { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@...' },
              ].map(({ key, label, placeholder }) => (
                <Field key={key} label={label}>
                  <input
                    value={settings?.socialLinks?.[key] || ''}
                    onChange={e => set(`socialLinks.${key}`, e.target.value)}
                    className={inputCls} placeholder={placeholder}
                  />
                </Field>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={() => save({ socialLinks: settings.socialLinks })} disabled={saving}
                  className="px-5 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] disabled:opacity-50 transition-colors">
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
