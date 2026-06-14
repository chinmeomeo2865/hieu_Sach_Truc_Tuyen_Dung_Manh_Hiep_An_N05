import { useState, useEffect } from 'react'
import PMLayout from '../../components/pm/PMLayout'
import { api }     from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const inputCls = "w-full border border-[#EAE6DF] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#9B9389] focus:outline-none focus:border-[#1A1A1A] bg-[#FAF8F5] focus:bg-white transition-colors"

export default function PMSettingsPage() {
  const showToast = useToastStore(s => s.show)
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
    <PMLayout title="Cài đặt">
      <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="h-32 bg-[#F2EFEA] rounded-xl animate-pulse" />)}
      </div>
    </PMLayout>
  )

  return (
    <PMLayout title="Cài đặt hệ thống">
      {/* Header */}
      <div className="border-b border-[#EAE6DF] pb-3 mb-5">
        <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Cấu hình Banners Quảng cáo</h2>
        <p className="text-[11px] text-[#9B9389] mt-0.5">Quản lý các banner hiển thị trên Slider trang chủ Hero section</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
            <p className="font-display text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wide mb-4">Danh sách Banner đang chạy</p>
            
            {(!settings?.banners || settings.banners.length === 0) ? (
              <div className="py-12 text-center text-[#9B9389]">
                <p className="text-[12.5px] font-medium">Chưa có banner nào được cấu hình</p>
                <p className="text-[11px] mt-1">Trang chủ đang sử dụng banner mặc định của hệ thống.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {settings.banners.map((b, i) => (
                  <div key={i} className={`flex gap-4 items-start p-4 border rounded-xl transition-all ${b.active ? 'border-[#EAE6DF] bg-white' : 'border-dashed border-[#EAE6DF] bg-[#FAF8F5]/60 opacity-60'}`}>
                    {b.imageUrl && (
                      <img src={b.imageUrl} alt={b.title} className="w-24 h-14 object-cover rounded-lg flex-shrink-0 bg-[#FAF8F5] border border-[#EAE6DF]" onError={e => { e.target.style.display = 'none' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1A1A1A] truncate">{b.title || `Banner #${i + 1}`}</p>
                      <p className="text-[11px] text-[#9B9389] truncate mt-0.5 font-mono">{b.imageUrl}</p>
                      {b.link && <p className="text-[11px] text-amber-700 truncate mt-0.5">{b.link}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleBanner(i)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${b.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-[#EAE6DF] text-[#615C56] hover:bg-[#D8D2CA]'}`}>
                        {b.active ? 'Hiển thị' : 'Ẩn'}
                      </button>
                      <button onClick={() => removeBanner(i)}
                        className="p-2 rounded-lg hover:bg-red-50 text-[#9B9389] hover:text-red-600 transition-colors border border-transparent hover:border-red-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Banner Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm sticky top-20">
            <p className="font-display text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wide mb-4">Thêm banner mới</p>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">Tiêu đề Banner</label>
                <input value={newBanner.title} onChange={e => setNewBanner(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Tiêu đề gợi nhớ..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">URL Hình ảnh *</label>
                <input value={newBanner.imageUrl} onChange={e => setNewBanner(p => ({ ...p, imageUrl: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">Link liên kết (URL)</label>
                <input value={newBanner.link} onChange={e => setNewBanner(p => ({ ...p, link: e.target.value }))} className={inputCls} placeholder="/books, /offers, ..." />
              </div>

              {newBanner.imageUrl && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">Xem trước</p>
                  <img src={newBanner.imageUrl} alt="preview" className="w-full h-28 object-cover rounded-lg bg-[#FAF8F5] border border-[#EAE6DF]" onError={e => { e.target.style.display = 'none' }} />
                </div>
              )}

              <button onClick={addBanner} disabled={!newBanner.imageUrl.trim() || saving}
                className="w-full py-2.5 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-wider rounded-lg hover:bg-black disabled:opacity-40 transition-colors">
                {saving ? 'Đang cập nhật...' : 'Thêm banner'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PMLayout>
  )
}
