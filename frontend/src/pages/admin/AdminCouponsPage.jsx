import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice } from '../../utils/format'

/* ─── Cấu hình loại ─────────────────────────────────────────── */
const TYPE_LABEL = {
  percent:       { label: 'Giảm %',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  fixed:         { label: 'Giảm tiền',  cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  free_shipping: { label: 'Miễn ship',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

/* 5 preset đúng ví dụ yêu cầu */
const PRESETS = [
  { key: 'p1', label: 'Giảm %',        fill: { type:'percent', value:'10', maxDiscount:'50000' } },
  { key: 'p2', label: 'Giảm tiền',     fill: { type:'fixed', value:'30000' } },
  { key: 'p3', label: 'Miễn phí ship', fill: { type:'free_shipping', maxShipDiscount:'30000' } },
  { key: 'p4', label: 'Đơn tối thiểu', fill: { type:'fixed', value:'50000', minOrderAmount:'300000' } },
  { key: 'p5', label: 'Khách mới',     fill: { type:'percent', value:'15', firstOrderOnly:true } },
]

function valueLabel(c) {
  if (c.type === 'percent') return `-${c.value}%${c.maxDiscount ? ` · tối đa ${formatPrice(c.maxDiscount)}` : ''}`
  if (c.type === 'fixed')   return `-${formatPrice(c.value)}`
  return `Freeship${c.maxShipDiscount ? ` · tối đa ${formatPrice(c.maxShipDiscount)}` : ''}`
}
function conditions(c) {
  const out = []
  if (c.minOrderAmount > 0) out.push(`Đơn ≥ ${formatPrice(c.minOrderAmount)}`)
  if (c.firstOrderOnly)     out.push('Khách mới')
  if (c.perUserLimit > 0)   out.push(`${c.perUserLimit}×/người`)
  return out
}
function statusOf(c) {
  const now = new Date()
  if (!c.active) return { label: 'Tạm khóa', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  if (now > new Date(c.endDate)) return { label: 'Hết hạn', cls: 'bg-red-50 text-red-600 border-red-200' }
  if (now < new Date(c.startDate)) return { label: 'Sắp chạy', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { label: 'Hết lượt', cls: 'bg-orange-50 text-orange-700 border-orange-200' }
  return { label: 'Đang chạy', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}
function toLocalInput(d) {
  if (!d) return ''
  const dt = new Date(d)
  const pad = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

const EMPTY = {
  code:'', description:'', type:'percent', value:'', maxDiscount:'', maxShipDiscount:'',
  minOrderAmount:'', firstOrderOnly:false, perUserLimit:'', maxUses:'',
  startDate:'', endDate:'', active:true,
}

function CouponModal({ coupon, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const isEdit = !!coupon
  const [form, setForm] = useState(isEdit ? {
    code: coupon.code, description: coupon.description || '', type: coupon.type,
    value: coupon.value ?? '', maxDiscount: coupon.maxDiscount ?? '', maxShipDiscount: coupon.maxShipDiscount ?? '',
    minOrderAmount: coupon.minOrderAmount ?? '', firstOrderOnly: !!coupon.firstOrderOnly,
    perUserLimit: coupon.perUserLimit ?? '', maxUses: coupon.maxUses ?? '',
    startDate: toLocalInput(coupon.startDate), endDate: toLocalInput(coupon.endDate), active: coupon.active,
  } : { ...EMPTY })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [f]: val }))
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }))
  }
  function applyPreset(fill) {
    setForm(p => ({ ...EMPTY, code: p.code, description: p.description, startDate: p.startDate, endDate: p.endDate, active: p.active, ...fill }))
  }

  function validate() {
    const e = {}
    if (!form.code.trim()) e.code = 'Nhập mã code'
    if (form.type !== 'free_shipping' && (!form.value || Number(form.value) <= 0)) e.value = 'Giá trị giảm phải > 0'
    if (form.type === 'percent' && Number(form.value) >= 100) e.value = 'Phần trăm phải < 100'
    if (!form.startDate) e.startDate = 'Chọn ngày bắt đầu'
    if (!form.endDate) e.endDate = 'Chọn ngày kết thúc'
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) e.endDate = 'Phải sau ngày bắt đầu'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const num = v => v === '' || v === null ? undefined : Number(v)
    const payload = {
      code: form.code.trim().toUpperCase(), description: form.description.trim(),
      type: form.type,
      value: form.type === 'free_shipping' ? 0 : Number(form.value),
      maxDiscount:     form.type === 'percent' ? num(form.maxDiscount) : undefined,
      maxShipDiscount: form.type === 'free_shipping' ? num(form.maxShipDiscount) : undefined,
      minOrderAmount: num(form.minOrderAmount) || 0,
      firstOrderOnly: form.firstOrderOnly,
      perUserLimit:   num(form.perUserLimit) || 0,
      maxUses:        num(form.maxUses) || 0,
      startDate: form.startDate, endDate: form.endDate, active: form.active,
    }
    try {
      if (isEdit) await api.put(`/api/coupons/${coupon._id}`, payload)
      else        await api.post('/api/coupons', payload)
      showToast({ message: isEdit ? 'Đã cập nhật voucher' : 'Đã tạo voucher', type: 'success' })
      onSaved()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  const Lbl = ({ children }) => <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">{children}</label>
  const Err = ({ f }) => errors[f] ? <p className="mt-1 text-[11px] text-red-500 font-medium">{errors[f]}</p> : null
  const iCls = f => `w-full px-3.5 py-2.5 border rounded-xl text-[13px] bg-white focus:outline-none transition-colors ${errors[f] ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] focus:border-[#0f0f0f]'}`

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity:0, scale:0.96, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.96, y:12 }} transition={{ type:'spring', damping:28, stiffness:300 }}
          className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
            <p className="text-[14px] font-semibold text-[#0f0f0f]">{isEdit ? 'Chỉnh sửa voucher' : 'Tạo voucher'}</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {!isEdit && (
                <div>
                  <Lbl>Mẫu nhanh</Lbl>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map(p => (
                      <button key={p.key} type="button" onClick={() => applyPreset(p.fill)}
                        className="px-3 py-1.5 text-[11.5px] font-semibold border border-[#e5e5e5] rounded-lg hover:border-[#0f0f0f] hover:bg-[#fafafa] transition-colors">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Lbl>Mã code *</Lbl>
                  <input value={form.code} onChange={e => { setForm(p => ({ ...p, code: e.target.value.toUpperCase() })); if (errors.code) setErrors(p => ({ ...p, code: '' })) }}
                    placeholder="VD: WELCOME10" className={`${iCls('code')} font-mono`}/>
                  <Err f="code"/>
                </div>
                <div>
                  <Lbl>Cơ chế giảm *</Lbl>
                  <select value={form.type} onChange={set('type')} className={iCls('type')}>
                    <option value="percent">Giảm theo phần trăm (%)</option>
                    <option value="fixed">Giảm số tiền cố định (₫)</option>
                    <option value="free_shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Lbl>Mô tả (hiển thị cho khách)</Lbl>
                  <input value={form.description} onChange={set('description')} placeholder="VD: Giảm 10% tối đa 50.000₫" className={iCls('description')}/>
                </div>

                {form.type !== 'free_shipping' && (
                  <div>
                    <Lbl>{form.type === 'percent' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (₫) *'}</Lbl>
                    <input type="number" min="0" value={form.value} onChange={set('value')} placeholder={form.type === 'percent' ? '10' : '30000'} className={iCls('value')}/>
                    <Err f="value"/>
                  </div>
                )}
                {form.type === 'percent' && (
                  <div>
                    <Lbl>Giảm tối đa (₫)</Lbl>
                    <input type="number" min="0" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="50000 (tùy chọn)" className={iCls('maxDiscount')}/>
                  </div>
                )}
                {form.type === 'free_shipping' && (
                  <div>
                    <Lbl>Hỗ trợ ship tối đa (₫)</Lbl>
                    <input type="number" min="0" value={form.maxShipDiscount} onChange={set('maxShipDiscount')} placeholder="30000 (để trống = miễn toàn bộ)" className={iCls('maxShipDiscount')}/>
                  </div>
                )}

                <div>
                  <Lbl>Đơn tối thiểu (₫)</Lbl>
                  <input type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="0 = không yêu cầu" className={iCls('minOrderAmount')}/>
                </div>
                <div>
                  <Lbl>Giới hạn / tài khoản</Lbl>
                  <input type="number" min="0" value={form.perUserLimit} onChange={set('perUserLimit')} placeholder="0 = không giới hạn" className={iCls('perUserLimit')}/>
                </div>
                <div>
                  <Lbl>Tổng lượt sử dụng</Lbl>
                  <input type="number" min="0" value={form.maxUses} onChange={set('maxUses')} placeholder="0 = không giới hạn" className={iCls('maxUses')}/>
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.firstOrderOnly} onChange={set('firstOrderOnly')} className="w-4 h-4 accent-[#0f0f0f] rounded"/>
                    <span className="text-[12.5px] font-medium text-[#0f0f0f]">Chỉ đơn hàng đầu tiên (khách mới)</span>
                  </label>
                </div>

                <div>
                  <Lbl>Ngày bắt đầu *</Lbl>
                  <input type="datetime-local" value={form.startDate} onChange={set('startDate')} className={iCls('startDate')}/>
                  <Err f="startDate"/>
                </div>
                <div>
                  <Lbl>Ngày kết thúc *</Lbl>
                  <input type="datetime-local" value={form.endDate} onChange={set('endDate')} className={iCls('endDate')}/>
                  <Err f="endDate"/>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={set('active')} className="w-4 h-4 accent-[#0f0f0f] rounded"/>
                    <span className="text-[12.5px] font-medium text-[#0f0f0f]">Kích hoạt voucher</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#f0f0f0] shrink-0 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
                {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo voucher'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  )
}

function StatCard({ label, value, accent = 'text-[#0f0f0f]' }) {
  return (
    <div className="bg-white rounded-xl border border-[#ebebeb] p-4">
      <p className="text-[10px] font-bold tracking-wider text-[#a3a3a3] uppercase">{label}</p>
      <p className={`text-[24px] font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  )
}

export default function AdminCouponsPage() {
  const showToast = useToastStore(s => s.show)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // 'new' | coupon
  const [delItem, setDelItem] = useState(null)
  const [busyId,  setBusyId]  = useState(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/api/coupons'); setCoupons(r.data) }
    catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      total:  coupons.length,
      active: coupons.filter(c => c.active && now <= new Date(c.endDate) && now >= new Date(c.startDate) && !(c.maxUses > 0 && c.usedCount >= c.maxUses)).length,
      locked: coupons.filter(c => !c.active).length,
      dead:   coupons.filter(c => now > new Date(c.endDate) || (c.maxUses > 0 && c.usedCount >= c.maxUses)).length,
    }
  }, [coupons])

  async function toggleActive(c) {
    setBusyId(c._id)
    try {
      await api.put(`/api/coupons/${c._id}`, { active: !c.active })
      setCoupons(prev => prev.map(x => x._id === c._id ? { ...x, active: !x.active } : x))
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setBusyId(null) }
  }

  async function handleDelete(c) {
    try {
      await api.del(`/api/coupons/${c._id}`)
      showToast({ message: `Đã xóa "${c.code}"`, type: 'success' })
      setDelItem(null); fetchCoupons()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
  }

  return (
    <AdminLayout title="Mã giảm giá">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-3xl">
            <StatCard label="Tổng voucher" value={loading ? '—' : stats.total} />
            <StatCard label="Đang hoạt động" value={loading ? '—' : stats.active} accent="text-emerald-600" />
            <StatCard label="Tạm khóa" value={loading ? '—' : stats.locked} accent="text-[#525252]" />
            <StatCard label="Hết hạn / lượt" value={loading ? '—' : stats.dead} accent={stats.dead > 0 ? 'text-red-600' : 'text-[#0f0f0f]'} />
          </div>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-xl hover:bg-[#333] transition-colors whitespace-nowrap ml-4 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Tạo voucher
          </button>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Mã / Mô tả','Loại','Giá trị','Điều kiện','Lượt dùng','Hiệu lực','Trạng thái',''].map((h,i) => (
                  <th key={i} className={`px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3] ${h===''?'text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:6}).map((_,i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[150,70,90,120,60,100,70,80].map((w,j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{width:w}}/></td>)}
                  </tr>
                ))
                : coupons.length === 0
                  ? <tr><td colSpan={8} className="py-16 text-center"><p className="text-[13px] font-semibold text-[#0f0f0f]">Chưa có voucher nào</p><p className="text-[11px] text-[#a3a3a3] mt-1">Tạo voucher đầu tiên để khuyến mãi</p></td></tr>
                  : coupons.map(c => {
                    const t = TYPE_LABEL[c.type] || { label: c.type, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
                    const st = statusOf(c)
                    const conds = conditions(c)
                    return (
                      <tr key={c._id} className="border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[12.5px] font-mono font-bold text-[#0f0f0f]">{c.code}</p>
                          {c.description && <p className="text-[10.5px] text-[#a3a3a3] line-clamp-1 max-w-[180px]">{c.description}</p>}
                        </td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.cls}`}>{t.label}</span></td>
                        <td className="px-4 py-3 text-[12px] font-semibold text-[#0f0f0f] whitespace-nowrap">{valueLabel(c)}</td>
                        <td className="px-4 py-3">
                          {conds.length === 0 ? <span className="text-[11px] text-[#c4c4c4]">—</span> : (
                            <div className="flex flex-wrap gap-1">
                              {conds.map((cd,i) => <span key={i} className="px-1.5 py-0.5 rounded bg-[#f5f5f4] text-[10px] text-[#525252] font-medium whitespace-nowrap">{cd}</span>)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11.5px] text-[#525252] font-semibold">{c.usedCount}{c.maxUses > 0 ? `/${c.maxUses}` : ''}</td>
                        <td className="px-4 py-3 text-[10.5px] text-[#a3a3a3] whitespace-nowrap">
                          {new Date(c.startDate).toLocaleDateString('vi-VN')}<br/>→ {new Date(c.endDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.cls}`}>{st.label}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 justify-end items-center">
                            <button onClick={() => toggleActive(c)} disabled={busyId === c._id}
                              className="px-2.5 py-1.5 text-[10px] font-semibold border border-[#e5e5e5] rounded-lg hover:border-[#0f0f0f] transition-colors whitespace-nowrap">
                              {c.active ? 'Khóa' : 'Mở'}
                            </button>
                            <button onClick={() => setModal(c)}
                              className="px-2.5 py-1.5 text-[10px] font-semibold border border-[#e5e5e5] rounded-lg hover:border-[#0f0f0f] transition-colors">Sửa</button>
                            <button onClick={() => setDelItem(c)}
                              className="px-2.5 py-1.5 text-[10px] font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modal && <CouponModal coupon={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchCoupons() }}/>}
        {delItem && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={() => setDelItem(null)}/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:12}} transition={{ type:'spring', damping:28, stiffness:300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto p-6 text-center">
                <p className="text-[15px] font-semibold text-[#0f0f0f] mb-1">Xóa voucher?</p>
                <p className="text-[12px] text-[#737373] mb-4">Mã "{delItem.code}" sẽ bị xóa vĩnh viễn.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDelItem(null)} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold hover:border-[#a3a3a3] transition-colors">Hủy</button>
                  <button onClick={() => handleDelete(delItem)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-semibold hover:bg-red-600 transition-colors">Xóa</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
