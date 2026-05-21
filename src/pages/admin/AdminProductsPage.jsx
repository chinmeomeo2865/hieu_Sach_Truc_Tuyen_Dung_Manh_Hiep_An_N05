import { useEffect, useState, useCallback } from 'react'
import { api }           from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'
import AdminLayout       from '../../components/admin/AdminLayout'

/* ─── Constants ─── */
const CATS = [
  { slug: 'van-hoc',   name: 'Văn học' },
  { slug: 'ky-nang',   name: 'Kỹ năng sống' },
  { slug: 'thieu-nhi', name: 'Thiếu nhi' },
  { slug: 'kien-thuc', name: 'Kiến thức' },
  { slug: 'triet-hoc', name: 'Triết học' },
  { slug: 'lich-su',   name: 'Lịch sử' },
]

const BADGE_OPTS = [
  { value: '',     label: 'Không có' },
  { value: 'new',  label: 'Mới' },
  { value: 'best', label: 'Bán chạy' },
  { value: 'sale', label: 'Giảm giá' },
]

const BADGE_UI = {
  new:  'bg-accent/10 text-accent border border-accent/20',
  best: 'bg-amber-50 text-amber-700 border border-amber-200',
  sale: 'bg-red-50 text-red-600 border border-red-200',
}

const INPUT_CLS = 'w-full border border-divider rounded-sm px-3 py-2 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors duration-200'

const LIMIT = 20

const EMPTY_FORM = {
  title: '', author: '', price: '', originalPrice: '',
  category: '', categorySlug: '', description: '',
  image: '', stock: 0, badge: '', featured: false, visible: true,
}

/* ─── StatCard ─── */
function StatCard({ label, value, warn }) {
  return (
    <div className={`bg-white border rounded-sm px-5 py-4 ${warn ? 'border-red-200' : 'border-divider-lt'}`}>
      <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-1">{label}</p>
      <p className={`font-display text-2xl font-semibold ${warn ? 'text-red-600' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

/* ─── Field wrapper ─── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-2xs font-semibold tracking-label-md uppercase text-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

/* ─── ProductModal ─── */
function ProductModal({ book, onClose, onSaved, showToast }) {
  const isEdit = !!book

  const [form, setForm] = useState(isEdit ? {
    title:         book.title         || '',
    author:        book.author        || '',
    price:         book.price         ?? '',
    originalPrice: book.originalPrice ?? '',
    category:      book.category      || '',
    categorySlug:  book.categorySlug  || '',
    description:   book.description   || '',
    image:         book.image         || '',
    stock:         book.stock         ?? 0,
    badge:         book.badge         || '',
    featured:      book.featured      || false,
    visible:       book.visible       ?? true,
  } : { ...EMPTY_FORM })

  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCat(e) {
    const cat = CATS.find(c => c.name === e.target.value)
    setForm(f => ({
      ...f,
      category:    e.target.value,
      categorySlug: cat?.slug ?? f.categorySlug,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        price:         Number(form.price),
        originalPrice: form.originalPrice !== '' ? Number(form.originalPrice) : undefined,
        stock:         Number(form.stock),
        badge:         form.badge || null,
      }
      if (isEdit) {
        await api.put(`/api/products/${book._id}`, body)
        showToast({ message: 'Đã cập nhật sách', type: 'success' })
      } else {
        await api.post('/api/products', body)
        showToast({ message: 'Đã thêm sách mới', type: 'success' })
      }
      onSaved()
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-sm overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt sticky top-0 bg-white z-10">
          <h2 className="font-display text-base font-semibold text-ink">
            {isEdit ? 'Sửa thông tin sách' : 'Thêm sách mới'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* title + author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tên sách *">
              <input required value={form.title}
                onChange={e => set('title', e.target.value)}
                className={INPUT_CLS} placeholder="Nhập tên sách" />
            </Field>
            <Field label="Tác giả *">
              <input required value={form.author}
                onChange={e => set('author', e.target.value)}
                className={INPUT_CLS} placeholder="Tên tác giả" />
            </Field>
          </div>

          {/* price + originalPrice */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Giá bán (₫) *">
              <input required type="number" min="0" value={form.price}
                onChange={e => set('price', e.target.value)}
                className={INPUT_CLS} placeholder="85000" />
            </Field>
            <Field label="Giá gốc (₫)">
              <input type="number" min="0" value={form.originalPrice}
                onChange={e => set('originalPrice', e.target.value)}
                className={INPUT_CLS} placeholder="Để trống nếu không giảm" />
            </Field>
          </div>

          {/* category + stock */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Thể loại *">
              <select required value={form.category} onChange={handleCat} className={INPUT_CLS}>
                <option value="">-- Chọn thể loại --</option>
                {CATS.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tồn kho">
              <input type="number" min="0" value={form.stock}
                onChange={e => set('stock', e.target.value)}
                className={INPUT_CLS} />
            </Field>
          </div>

          {/* categorySlug readonly derived */}
          <Field label="Slug thể loại">
            <input value={form.categorySlug}
              onChange={e => set('categorySlug', e.target.value)}
              className={`${INPUT_CLS} font-mono text-muted`}
              placeholder="van-hoc" />
          </Field>

          {/* Image URL + preview */}
          <Field label="URL ảnh bìa">
            <input value={form.image}
              onChange={e => set('image', e.target.value)}
              className={INPUT_CLS} placeholder="https://..." />
            {form.image && (
              <img src={form.image} alt="preview"
                className="mt-2 h-28 w-20 object-cover rounded-sm border border-divider-lt" />
            )}
          </Field>

          {/* Description */}
          <Field label="Mô tả">
            <textarea rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              className={`${INPUT_CLS} resize-none`}
              placeholder="Giới thiệu ngắn về sách…" />
          </Field>

          {/* badge + featured + visible */}
          <div className="flex flex-wrap gap-6 items-end">
            <div className="w-40">
              <Field label="Badge">
                <select value={form.badge} onChange={e => set('badge', e.target.value)} className={INPUT_CLS}>
                  {BADGE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none pb-0.5">
              <input type="checkbox" checked={form.featured}
                onChange={e => set('featured', e.target.checked)}
                className="w-4 h-4 rounded accent-ink" />
              <span className="text-xs font-medium text-ink">Nổi bật (Featured)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none pb-0.5">
              <input type="checkbox" checked={form.visible}
                onChange={e => set('visible', e.target.checked)}
                className="w-4 h-4 rounded accent-ink" />
              <span className="text-xs font-medium text-ink">Hiển thị</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-divider-lt">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-xs font-semibold border border-divider rounded-sm text-ink-60 hover:border-ink hover:text-ink transition-colors">
              Huỷ
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-ink text-white rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors">
              {saving ? 'Đang lưu…' : (isEdit ? 'Lưu thay đổi' : 'Thêm sách')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function AdminProductsPage() {
  const showToast = useToastStore(s => s.show)

  const [products, setProducts]         = useState([])
  const [stats, setStats]               = useState({ total: 0, visible: 0, hidden: 0, lowStock: 0 })
  const [loading, setLoading]           = useState(true)
  const [pagination, setPagination]     = useState(null)
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [filterVisible, setFilterVisible] = useState('')
  const [filterBadge, setFilterBadge]   = useState('')
  const [modal, setModal]               = useState(null) // null | { book?: {...} }
  const [togglingId, setTogglingId]     = useState(null)

  const fetchProducts = useCallback(async (pg, q, fv, fb) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: pg, limit: LIMIT })
      if (q)  qs.set('search', q)
      if (fv) qs.set('visible', fv)
      if (fb) qs.set('badge', fb)
      const res = await api.get(`/api/products/admin/all?${qs}`)
      setProducts(res.data)
      setPagination(res.pagination || null)
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    api.get('/api/products/admin/all?limit=1000')
      .then(res => {
        const all = res.data
        setStats({
          total:    all.length,
          visible:  all.filter(p => p.visible).length,
          hidden:   all.filter(p => !p.visible).length,
          lowStock: all.filter(p => p.stock < 5).length,
        })
      })
      .catch(() => {})
  }, [products])

  useEffect(() => {
    fetchProducts(page, search, filterVisible, filterBadge)
  }, [page, search, filterVisible, filterBadge, fetchProducts])

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function handleFilterChange(key, val) {
    if (key === 'visible') setFilterVisible(val)
    if (key === 'badge')   setFilterBadge(val)
    setPage(1)
  }

  async function handleToggleVisible(product) {
    setTogglingId(product._id)
    try {
      await api.put(`/api/products/${product._id}`, { visible: !product.visible })
      setProducts(prev => prev.map(p =>
        p._id === product._id ? { ...p, visible: !p.visible } : p
      ))
      showToast({ message: product.visible ? 'Đã ẩn sách' : 'Đã hiển thị sách', type: 'info' })
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setTogglingId(null)
    }
  }

  function handleModalSaved() {
    setModal(null)
    fetchProducts(page, search, filterVisible, filterBadge)
  }

  return (
    <AdminLayout title="Quản lý sách">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng sách"          value={stats.total} />
        <StatCard label="Đang hiển thị"      value={stats.visible} />
        <StatCard label="Đã ẩn"              value={stats.hidden} />
        <StatCard label="Sắp hết hàng (< 5)" value={stats.lowStock} warn={stats.lowStock > 0} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-52">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên, tác giả…"
            className="flex-1 border border-divider rounded-sm px-3 py-1.5 text-xs text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors"
          />
          <button type="submit"
            className="px-3.5 py-1.5 bg-ink text-white text-xs font-semibold rounded-sm hover:bg-ink-80 transition-colors shrink-0">
            Tìm
          </button>
          {search && (
            <button type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-3 py-1.5 border border-divider-lt text-xs text-muted rounded-sm hover:text-ink transition-colors shrink-0">
              Xóa
            </button>
          )}
        </form>

        {/* Visible filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[['', 'Tất cả'], ['true', 'Hiển thị'], ['false', 'Đã ẩn']].map(([val, label]) => (
            <button key={val}
              onClick={() => handleFilterChange('visible', val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-label transition-colors ${
                filterVisible === val
                  ? 'bg-ink text-white'
                  : 'bg-white border border-divider-lt text-ink-60 hover:border-divider hover:text-ink'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Badge filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[['', 'Mọi badge'], ['new', 'Mới'], ['best', 'Bán chạy'], ['sale', 'Giảm giá']].map(([val, label]) => (
            <button key={val}
              onClick={() => handleFilterChange('badge', val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-label transition-colors ${
                filterBadge === val
                  ? 'bg-ink text-white'
                  : 'bg-white border border-divider-lt text-ink-60 hover:border-divider hover:text-ink'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={() => setModal({ book: null })}
          className="ml-auto px-4 py-2 bg-ink text-white text-xs font-semibold rounded-sm hover:bg-ink-80 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Thêm sách
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-16 bg-white border border-divider-lt rounded-sm animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-divider-lt rounded-sm py-20 text-center">
          <p className="text-muted text-sm">Không có sách nào</p>
        </div>
      ) : (
        <div className="bg-white border border-divider-lt rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-divider-lt bg-surface-warm">
                  <th className="text-left px-4 py-3 text-2xs font-semibold tracking-label-lg uppercase text-muted">Sách</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold tracking-label-lg uppercase text-muted hidden md:table-cell">Thể loại</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold tracking-label-lg uppercase text-muted">Giá</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold tracking-label-lg uppercase text-muted">Stock</th>
                  <th className="text-center px-4 py-3 text-2xs font-semibold tracking-label-lg uppercase text-muted hidden sm:table-cell">Badge</th>
                  <th className="text-center px-4 py-3 text-2xs font-semibold tracking-label-lg uppercase text-muted">Hiển thị</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider-lt">
                {products.map(product => (
                  <tr
                    key={product._id}
                    className={`hover:bg-surface-warm transition-colors ${!product.visible ? 'opacity-50' : ''}`}
                  >
                    {/* Book info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image ? (
                          <img src={product.image} alt={product.title}
                            className="w-8 h-11 object-cover rounded-sm shrink-0 border border-divider-lt" />
                        ) : (
                          <div className="w-8 h-11 bg-surface-subtle rounded-sm shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ink leading-tight line-clamp-1 max-w-[200px]">{product.title}</p>
                          <p className="text-muted text-[11px] mt-0.5">{product.author}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-muted hidden md:table-cell whitespace-nowrap">{product.category}</td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-medium text-ink">{formatPrice(product.price)}</span>
                      {product.originalPrice > 0 && (
                        <span className="block text-[11px] text-subtle line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${product.stock < 5 ? 'text-red-600' : 'text-ink'}`}>
                      {product.stock}
                    </td>

                    {/* Badge */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {product.badge ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE_UI[product.badge] || ''}`}>
                          {BADGE_OPTS.find(b => b.value === product.badge)?.label || product.badge}
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>

                    {/* Toggle visible */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleVisible(product)}
                        disabled={togglingId === product._id}
                        title={product.visible ? 'Đang hiển thị — click để ẩn' : 'Đang ẩn — click để hiện'}
                        className="relative inline-flex items-center cursor-pointer disabled:opacity-40"
                      >
                        <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${product.visible ? 'bg-ink' : 'bg-divider'}`} />
                        <div className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 top-0.5 ${product.visible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal({ book: product })}
                        className="p-1.5 text-muted hover:text-ink hover:bg-surface-subtle rounded-sm transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-muted">
            Trang {pagination.page}/{pagination.totalPages} · {pagination.total} sách
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-xs font-semibold border border-divider-lt rounded-sm text-ink-60 hover:border-divider hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-xs font-semibold border border-divider-lt rounded-sm text-ink-60 hover:border-divider hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ProductModal
          book={modal.book || null}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
          showToast={showToast}
        />
      )}
    </AdminLayout>
  )
}
