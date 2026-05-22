import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice } from '../../utils/format'

const STATUS_CFG = {
  upcoming: { label: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  active:   { label: 'Đang chạy',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ended:    { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

function Countdown({ endDate }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    function calc() {
      const diff = new Date(endDate) - new Date()
      if (diff <= 0) { setTimeLeft('Đã kết thúc'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(d > 0 ? `${d}n ${h}h` : `${h}h ${m}m`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [endDate])
  return <span className="text-[10px] text-[#a3a3a3] font-medium tabular-nums">⏱ {timeLeft}</span>
}

function PromotionModal({ onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm] = useState({ name:'', description:'', type:'percent', value:'', startDate:'', endDate:'', productIds:[] })
  const [products, setProducts] = useState([])
  const [search, setSearch]     = useState('')
  const [filteredP, setFilteredP] = useState([])
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    api.get('/api/products?limit=100').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredP(q ? products.filter(p => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)) : products)
  }, [search, products])

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function toggleProduct(id) {
    setForm(p => ({ ...p, productIds: p.productIds.includes(id) ? p.productIds.filter(x => x !== id) : [...p.productIds, id] }))
  }

  function discountedPrice(price) {
    if (!form.value) return price
    if (form.type === 'percent') return Math.round(price * (1 - parseFloat(form.value)/100))
    return Math.max(0, price - parseFloat(form.value))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Tên chương trình là bắt buộc'
    if (!form.value || parseFloat(form.value) <= 0) e.value = 'Giá trị giảm không hợp lệ'
    if (form.type === 'percent' && parseFloat(form.value) >= 100) e.value = 'Phần trăm giảm phải nhỏ hơn 100%'
    if (!form.startDate) e.startDate = 'Chọn ngày bắt đầu'
    if (!form.endDate) e.endDate = 'Chọn ngày kết thúc'
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) e.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    if (!form.productIds.length) e.products = 'Chọn ít nhất 1 sản phẩm'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setLoading(true)
    try {
      await api.post('/api/pm/promotions', form)
      showToast({ message: 'Đã tạo khuyến mãi thành công', type: 'success' })
      onSaved()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  const Err = ({ field }) => errors[field] ? <p className="mt-1 text-[11px] text-red-500 font-medium">{errors[field]}</p> : null
  const Label = ({ children }) => <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">{children}</label>
  const Input = ({ field, ...props }) => <input {...props} value={form[field]} onChange={set(field)}
    className={`w-full px-3.5 py-2.5 border rounded-xl text-[13px] focus:outline-none transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] focus:border-[#0f0f0f]'}`}/>

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose}/>
      <motion.div initial={{ opacity:0, scale:0.97, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.97, y:8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
            <p className="text-[14px] font-semibold">Tạo chương trình khuyến mãi</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên chương trình *</Label>
                <Input field="name" placeholder="Flash sale cuối tuần…"/>
                <Err field="name"/>
              </div>
              <div className="col-span-2">
                <Label>Mô tả</Label>
                <textarea value={form.description} onChange={set('description')} rows={2}
                  placeholder="Mô tả ngắn…" className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] focus:outline-none focus:border-[#0f0f0f] transition-colors resize-none"/>
              </div>
              <div>
                <Label>Loại giảm *</Label>
                <select value={form.type} onChange={set('type')} className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] focus:outline-none focus:border-[#0f0f0f] bg-white">
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (₫)</option>
                </select>
              </div>
              <div>
                <Label>Giá trị giảm *</Label>
                <div className="relative">
                  <Input field="value" type="number" min="0" placeholder={form.type==='percent'?'20':'50000'}/>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-[#a3a3a3] font-semibold">{form.type==='percent'?'%':'₫'}</span>
                </div>
                <Err field="value"/>
              </div>
              <div>
                <Label>Ngày bắt đầu *</Label>
                <Input field="startDate" type="datetime-local"/>
                <Err field="startDate"/>
              </div>
              <div>
                <Label>Ngày kết thúc *</Label>
                <Input field="endDate" type="datetime-local"/>
                <Err field="endDate"/>
              </div>

              <div className="col-span-2">
                <Label>Sản phẩm áp dụng ({form.productIds.length} đã chọn) *</Label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sách để chọn…"
                  className="w-full px-3.5 py-2 border border-[#e5e5e5] rounded-xl text-[12px] focus:outline-none focus:border-[#0f0f0f] mb-2 transition-colors"/>
                <div className="border border-[#e5e5e5] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {filteredP.slice(0,30).map(p => {
                    const selected = form.productIds.includes(p._id)
                    const discounted = form.value ? discountedPrice(p.price) : null
                    return (
                      <label key={p._id} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-[#fafafa]'}`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleProduct(p._id)} className="rounded"/>
                        {p.image && <img src={p.image} alt="" className="w-8 h-10 object-cover rounded-md shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#0f0f0f] truncate">{p.title}</p>
                          <p className="text-[10px] text-[#a3a3a3]">{p.author}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-bold text-[#0f0f0f]">{formatPrice(p.price)}</p>
                          {selected && discounted && discounted !== p.price && (
                            <p className="text-[10px] text-emerald-600 font-semibold">→ {formatPrice(discounted)}</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
                <Err field="products"/>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#f0f0f0] shrink-0 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
                {loading ? 'Đang tạo…' : 'Tạo khuyến mãi'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function PMPromotionsPage() {
  const showToast = useToastStore(s => s.show)
  const [promos,    setPromos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ending,    setEnding]    = useState(null)
  const [confirm,   setConfirm]   = useState(null)

  const fetchPromos = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/api/pm/promotions'); setPromos(r.data) }
    catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPromos() }, [fetchPromos])

  async function handleEnd(promo) {
    setEnding(promo._id)
    try {
      await api.post(`/api/pm/promotions/${promo._id}/end`)
      showToast({ message: `Đã kết thúc "${promo.name}"`, type: 'success' })
      fetchPromos()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setEnding(null); setConfirm(null) }
  }

  return (
    <PMLayout title="Khuyến mãi">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#737373]">{promos.length} chương trình</p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-xl hover:bg-[#333] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Tạo khuyến mãi
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({length:4}).map((_,i) => <div key={i} className="bg-white border border-[#ebebeb] rounded-xl p-5 animate-pulse h-24"/>)}
          </div>
        ) : promos.length === 0 ? (
          <div className="bg-white border border-[#ebebeb] rounded-xl py-16 text-center">
            <p className="text-[13px] font-semibold text-[#0f0f0f]">Chưa có chương trình khuyến mãi</p>
            <p className="text-[11px] text-[#a3a3a3] mt-1">Tạo chương trình đầu tiên để kích cầu mua sắm</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map(p => {
              const cfg = STATUS_CFG[p.status] || STATUS_CFG.ended
              return (
                <motion.div key={p._id} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                  className={`bg-white border border-[#ebebeb] rounded-xl p-5 ${p.status === 'ended' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <p className="text-[14px] font-semibold text-[#0f0f0f]">{p.name}</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>{cfg.label}</span>
                        {p.status === 'active' && <Countdown endDate={p.endDate}/>}
                      </div>
                      {p.description && <p className="text-[12px] text-[#737373] mb-2">{p.description}</p>}
                      <div className="flex items-center gap-4 text-[11px] text-[#a3a3a3] flex-wrap">
                        <span className="font-semibold text-[#0f0f0f]">
                          {p.type === 'percent' ? `-${p.value}%` : `-${formatPrice(p.value)}`}
                        </span>
                        <span>{p.products?.length || 0} sản phẩm</span>
                        <span>{new Date(p.startDate).toLocaleDateString('vi-VN')} → {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    {p.status !== 'ended' && (
                      <button onClick={() => setConfirm(p)}
                        disabled={ending === p._id}
                        className="shrink-0 px-3.5 py-2 border border-red-200 text-red-500 text-[11px] font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors">
                        {ending === p._id ? 'Đang kết thúc…' : 'Kết thúc KM'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <PromotionModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchPromos() }}/>}
        {confirm && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-50 bg-black/30" onClick={() => setConfirm(null)}/>
            <motion.div initial={{ opacity:0, scale:0.96, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.96, y:8 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto p-6 text-center">
                <p className="text-[15px] font-semibold mb-1">Kết thúc khuyến mãi?</p>
                <p className="text-[12px] text-[#737373] mb-4">"{confirm.name}" sẽ bị kết thúc và giá gốc sẽ được khôi phục.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold hover:border-[#a3a3a3] transition-colors">Hủy</button>
                  <button onClick={() => handleEnd(confirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-semibold hover:bg-red-600 transition-colors">Xác nhận</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PMLayout>
  )
}
