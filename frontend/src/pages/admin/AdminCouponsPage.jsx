import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout  from '../../components/admin/AdminLayout'
import ConfirmModal from '../../components/admin/ui/ConfirmModal'
import { api }      from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

function statusOf(c) {
  const now = new Date()
  if (!c.active)             return { label: 'Tắt',       color: 'bg-gray-100 text-gray-500' }
  if (now < new Date(c.startDate)) return { label: 'Chưa bắt đầu', color: 'bg-blue-50 text-blue-600' }
  if (now > new Date(c.endDate))   return { label: 'Hết hạn',  color: 'bg-red-50 text-red-500' }
  return { label: 'Đang chạy', color: 'bg-emerald-50 text-emerald-700' }
}

const EMPTY = { code:'', description:'', type:'percent', value:'', minOrderAmount:'', maxDiscount:'', maxUses:'0', startDate:'', endDate:'', active:true }

function CouponModal({ coupon, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const isEdit    = !!coupon
  const [form, setForm] = useState(isEdit ? {
    code: coupon.code, description: coupon.description, type: coupon.type,
    value: coupon.value, minOrderAmount: coupon.minOrderAmount || '',
    maxDiscount: coupon.maxDiscount || '', maxUses: coupon.maxUses ?? 0,
    startDate: coupon.startDate?.slice(0,16), endDate: coupon.endDate?.slice(0,16),
    active: coupon.active,
  } : { ...EMPTY })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [f]: v }))
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.code.trim())         e.code  = 'Mã là bắt buộc'
    if (!/^[A-Z0-9]+$/.test(form.code.trim().toUpperCase())) e.code = 'Chỉ dùng chữ hoa và số'
    if (!form.value || Number(form.value) <= 0) e.value = 'Giá trị không hợp lệ'
    if (form.type === 'percent' && Number(form.value) >= 100) e.value = 'Phần trăm phải < 100'
    if (!form.startDate) e.startDate = 'Chọn ngày bắt đầu'
    if (!form.endDate)   e.endDate   = 'Chọn ngày kết thúc'
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) e.endDate = 'Phải sau ngày bắt đầu'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase(), value: Number(form.value), minOrderAmount: Number(form.minOrderAmount)||0, maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, maxUses: Number(form.maxUses)||0 }
      if (isEdit) await api.put(`/api/coupons/${coupon._id}`, payload)
      else        await api.post('/api/coupons', payload)
      showToast({ message: isEdit ? 'Đã cập nhật coupon' : 'Đã tạo coupon', type: 'success' })
      onSaved()
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  const iCls = f => `w-full border rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink transition-colors ${errors[f] ? 'border-red-300 bg-red-50' : 'border-divider'}`
  const Err  = ({ f }) => errors[f] ? <p className="mt-1 text-xs text-red-500">{errors[f]}</p> : null
  const Lbl  = ({ children }) => <label className="block text-2xs font-semibold tracking-label-md uppercase text-muted mb-1.5">{children}</label>

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity:0, scale:0.97, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-sm shadow-xl w-full max-w-lg pointer-events-auto max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt shrink-0">
            <p className="text-sm font-semibold text-ink">{isEdit ? 'Chỉnh sửa coupon' : 'Tạo coupon mới'}</p>
            <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Lbl>Mã coupon *</Lbl>
                <input value={form.code} onChange={set('code')} placeholder="CHIN20" className={iCls('code')}
                  style={{ textTransform:'uppercase' }} disabled={isEdit}/>
                <Err f="code"/>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.active} onChange={set('active')} className="accent-ink"/>
                  <span className="text-sm text-ink font-medium">Kích hoạt</span>
                </label>
              </div>
              <div className="col-span-2">
                <Lbl>Mô tả</Lbl>
                <input value={form.description} onChange={set('description')} placeholder="Giảm 20% cho đơn từ 200k…" className={iCls('description')}/>
              </div>
              <div>
                <Lbl>Loại giảm *</Lbl>
                <select value={form.type} onChange={set('type')} className={iCls('type')}>
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (₫)</option>
                </select>
              </div>
              <div>
                <Lbl>Giá trị *</Lbl>
                <input type="number" min="0" value={form.value} onChange={set('value')} placeholder={form.type==='percent'?'20':'50000'} className={iCls('value')}/>
                <Err f="value"/>
              </div>
              <div>
                <Lbl>Đơn tối thiểu (₫)</Lbl>
                <input type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="0" className={iCls('minOrderAmount')}/>
              </div>
              {form.type === 'percent' && (
                <div>
                  <Lbl>Giảm tối đa (₫)</Lbl>
                  <input type="number" min="0" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="Không giới hạn" className={iCls('maxDiscount')}/>
                </div>
              )}
              <div>
                <Lbl>Số lần dùng tối đa</Lbl>
                <input type="number" min="0" value={form.maxUses} onChange={set('maxUses')} placeholder="0 = không giới hạn" className={iCls('maxUses')}/>
              </div>
              <div>
                <Lbl>Bắt đầu *</Lbl>
                <input type="datetime-local" value={form.startDate} onChange={set('startDate')} className={iCls('startDate')}/>
                <Err f="startDate"/>
              </div>
              <div>
                <Lbl>Kết thúc *</Lbl>
                <input type="datetime-local" value={form.endDate} onChange={set('endDate')} className={iCls('endDate')}/>
                <Err f="endDate"/>
              </div>
            </div>
          </form>
          <div className="px-6 py-4 border-t border-divider-lt shrink-0 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-divider rounded-sm text-sm font-semibold text-muted hover:border-ink transition-colors">Hủy</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-ink text-white rounded-sm text-sm font-semibold hover:bg-ink-80 disabled:opacity-50 transition-colors">
              {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo coupon'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function AdminCouponsPage() {
  const showToast = useToastStore(s => s.show)
  const [coupons,  setCoupons]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [delItem,  setDelItem]  = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/api/coupons'); setCoupons(r.data) }
    catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.del(`/api/coupons/${delItem._id}`)
      showToast({ message: `Đã xóa coupon "${delItem.code}"`, type: 'success' })
      setDelItem(null); fetchCoupons()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setDeleting(false) }
  }

  const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })

  return (
    <AdminLayout title="Coupon & Mã giảm giá">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0f0f0f] tracking-tight">Coupon</h2>
          <p className="text-[12px] text-[#a3a3a3] mt-0.5">{coupons.length} mã giảm giá</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Tạo coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
              {['Mã','Mô tả','Loại giảm','Điều kiện','Sử dụng','Hiệu lực','Trạng thái',''].map((h,i) => (
                <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#a3a3a3] border-b border-[#f0f0f0]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i) => (
              <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                {[60,140,80,100,60,120,80,50].map((w,j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{width:w}}/></td>)}
              </tr>
            )) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center">
                <p className="text-sm font-semibold text-[#0f0f0f]">Chưa có coupon nào</p>
                <p className="text-xs text-[#a3a3a3] mt-1">Tạo coupon đầu tiên để kích cầu mua sắm</p>
              </td></tr>
            ) : coupons.map(c => {
              const st = statusOf(c)
              return (
                <tr key={c._id} className="border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3.5">
                    <code className="text-[13px] font-bold text-[#0f0f0f] bg-[#f5f5f3] px-2 py-0.5 rounded">{c.code}</code>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-[#525252] max-w-[180px] truncate">{c.description || '—'}</td>
                  <td className="px-4 py-3.5 text-[12px] font-semibold text-[#0f0f0f]">
                    {c.type === 'percent'
                      ? <span>−{c.value}%{c.maxDiscount ? <span className="text-[10px] text-[#a3a3a3] font-normal"> (tối đa {formatPrice(c.maxDiscount)})</span> : ''}</span>
                      : <span>−{formatPrice(c.value)}</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-[#737373]">
                    {c.minOrderAmount > 0 ? `Đơn ≥ ${formatPrice(c.minOrderAmount)}` : 'Không giới hạn'}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-[#0f0f0f]">
                    {c.usedCount}{c.maxUses > 0 ? `/${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-[#737373]">
                    {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => setModal(c)} className="px-2.5 py-1.5 text-[11px] font-semibold border border-[#e5e5e5] rounded-lg hover:border-[#0f0f0f] transition-colors">Sửa</button>
                      <button onClick={() => setDelItem(c)} className="px-2.5 py-1.5 text-[11px] font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Xóa</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modal && <CouponModal coupon={modal==='new'?null:modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchCoupons() }}/>}
      </AnimatePresence>

      <ConfirmModal
        open={!!delItem}
        title={`Xóa coupon "${delItem?.code}"?`}
        message="Hành động này không thể hoàn tác. Coupon sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa"
        confirmClass="bg-red-500 hover:bg-red-600 text-white"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDelItem(null)}
      />
    </AdminLayout>
  )
}
