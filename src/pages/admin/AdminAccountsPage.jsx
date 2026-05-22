import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence }           from 'framer-motion'
import AdminLayout    from '../../components/admin/AdminLayout'
import ConfirmModal   from '../../components/admin/ui/ConfirmModal'
import { api }        from '../../services/api'
import { useToastStore } from '../../store/toastStore'

/* ─── Constants ─────────────────────────────────────────── */

const ROLES = [
  { value: 'admin',           label: 'Super Admin',      color: 'bg-purple-100 text-purple-700' },
  { value: 'product_manager', label: 'Content Manager',  color: 'bg-blue-100 text-blue-700'     },
  { value: 'warehouse',       label: 'Order Manager',    color: 'bg-amber-100 text-amber-700'   },
]
const roleInfo = v => ROLES.find(r => r.value === v) || { label: v, color: 'bg-gray-100 text-gray-600' }

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-t border-[#f0f0f0] animate-pulse">
      {[40, 140, 180, 80, 60, 80, 72].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 bg-[#f0f0f0] rounded-full`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

/* ─── Account Modal (Create / Edit) ─────────────────────── */
function AccountModal({ mode, data, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm] = useState({
    name: data?.name || '', email: data?.email || '',
    phone: data?.phone || '', role: data?.role || 'warehouse', password: '', confirm: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim())  errs.name  = 'Nhập họ tên'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ'
    if (mode === 'create') {
      if (!form.password || form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
      if (form.password !== form.confirm)             errs.confirm  = 'Mật khẩu không khớp'
    }
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone }
      if (mode === 'create') payload.password = form.password
      else if (form.password) { payload.password = form.password }

      if (mode === 'create') await api.post('/api/users/internal', payload)
      else                   await api.put(`/api/users/internal/${data._id}`, payload)

      showToast({ message: mode === 'create' ? 'Tạo tài khoản thành công' : 'Cập nhật thành công', type: 'success' })
      onSaved()
    } catch (err) {
      if (err.message?.includes('409') || err.message?.toLowerCase().includes('email'))
        setErrors(p => ({ ...p, email: 'Email đã tồn tại' }))
      else showToast({ message: err.message || 'Thao tác thất bại', type: 'error' })
    } finally { setLoading(false) }
  }

  const Input = ({ field, label, type = 'text', placeholder }) => (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#737373]">{label}</label>
      <input
        type={type} value={form[field]} onChange={set(field)} placeholder={placeholder}
        className={`w-full border rounded-lg px-3.5 py-2.5 text-[13px] text-[#0f0f0f] placeholder:text-[#c4c4c4] focus:outline-none transition-colors
          ${errors[field] ? 'border-red-400 bg-red-50/30 focus:border-red-400' : 'border-[#e5e5e5] focus:border-[#0f0f0f]'}`}
      />
      {errors[field] && <p className="text-[11px] text-red-500">{errors[field]}</p>}
    </div>
  )

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <p className="text-[14px] font-semibold text-[#0f0f0f]">
            {mode === 'create' ? 'Tạo tài khoản mới' : 'Chỉnh sửa tài khoản'}
          </p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input field="name"  label="Họ và tên"       placeholder="Nguyễn Văn A" />
            <Input field="phone" label="Số điện thoại"   placeholder="09x..." />
          </div>
          <Input field="email" label="Email" type="email" placeholder="email@example.com" />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Vai trò</label>
            <select value={form.role} onChange={set('role')}
              className="w-full border border-[#e5e5e5] rounded-lg px-3.5 py-2.5 text-[13px] text-[#0f0f0f] focus:outline-none focus:border-[#0f0f0f] transition-colors bg-white"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="pt-1 border-t border-[#f5f5f4]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-3">
              {mode === 'create' ? 'Mật khẩu' : 'Đặt mật khẩu mới (để trống = giữ nguyên)'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input field="password" label="Mật khẩu"     type="password" placeholder="••••••••" />
              <Input field="confirm"  label="Xác nhận"      type="password" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-[#e5e5e5] rounded-lg text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-[#0f0f0f] text-white text-[13px] font-semibold rounded-lg hover:bg-[#292929] disabled:opacity-50 transition-colors">
              {loading ? 'Đang lưu…' : mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminAccountsPage() {
  const showToast = useToastStore(s => s.show)
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage]         = useState(1)
  const [pagination, setPagination] = useState({})
  const [modal, setModal]       = useState(null) // { type:'create'|'edit'|'delete'|'toggle', data? }
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (search)     params.set('search', search)
      if (roleFilter) params.set('role',   roleFilter)
      const res = await api.get(`/api/users/internal/list?${params}`)
      setUsers(res.data)
      setPagination(res.pagination || {})
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleToggle() {
    setActionLoading(true)
    try {
      await api.put(`/api/users/${modal.data._id}/status`)
      showToast({ message: modal.data.active ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', type: 'info' })
      setModal(null); fetchUsers()
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setActionLoading(false) }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      await api.del(`/api/users/internal/${modal.data._id}`)
      showToast({ message: 'Đã xóa tài khoản', type: 'success' })
      setModal(null); fetchUsers()
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setActionLoading(false) }
  }

  const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <AdminLayout title="Quản lý tài khoản nội bộ">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0f0f0f] tracking-tight">Tài khoản nội bộ</h2>
          <p className="text-[12px] text-[#a3a3a3] mt-0.5">{pagination.total || 0} tài khoản</p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Tạo tài khoản
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm tên, email…"
            className="w-full pl-9 pr-4 py-2.5 border border-[#e5e5e5] rounded-lg text-[13px] placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#0f0f0f] transition-colors"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="border border-[#e5e5e5] rounded-lg px-3.5 py-2.5 text-[13px] text-[#525252] focus:outline-none focus:border-[#0f0f0f] transition-colors bg-white"
        >
          <option value="">Tất cả vai trò</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fafafa]">
              {['Tài khoản', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo', ''].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#a3a3a3] border-b border-[#f0f0f0] ${i === 5 ? 'w-20' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center">
                <p className="text-[14px] font-semibold text-[#0f0f0f]">Không có tài khoản nào</p>
                <p className="text-[12px] text-[#a3a3a3] mt-1">Tạo tài khoản đầu tiên để bắt đầu</p>
              </td></tr>
            ) : users.map(u => {
              const role = roleInfo(u.role)
              return (
                <tr key={u._id} className="border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f0f0f] leading-tight">{u.name}</p>
                        {u.phone && <p className="text-[11px] text-[#a3a3a3]">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-[#525252]">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${role.color}`}>{role.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${u.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.active !== false ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-[#a3a3a3]">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ type: 'edit', data: u })}
                        className="p-1.5 rounded-md hover:bg-[#f5f5f4] text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors" title="Chỉnh sửa">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setModal({ type: 'toggle', data: u })}
                        className="p-1.5 rounded-md hover:bg-[#f5f5f4] text-[#a3a3a3] hover:text-amber-600 transition-colors" title={u.active !== false ? 'Khóa' : 'Mở khóa'}>
                        {u.active !== false
                          ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                        }
                      </button>
                      <button onClick={() => setModal({ type: 'delete', data: u })}
                        className="p-1.5 rounded-md hover:bg-red-50 text-[#a3a3a3] hover:text-red-500 transition-colors" title="Xóa">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
            <p className="text-[12px] text-[#a3a3a3]">
              Trang {pagination.page} / {pagination.totalPages} · {pagination.total} tài khoản
            </p>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-[12px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">
                ← Trước
              </button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-[12px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(modal?.type === 'create' || modal?.type === 'edit') && (
          <AccountModal
            key="form"
            mode={modal.type}
            data={modal.data}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); fetchUsers() }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={modal?.type === 'toggle'}
        title={modal?.data?.active !== false ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
        message={modal?.data?.active !== false
          ? `Tài khoản của ${modal?.data?.name} sẽ bị khóa và không thể đăng nhập.`
          : `Tài khoản của ${modal?.data?.name} sẽ được mở khóa trở lại.`}
        confirmLabel={modal?.data?.active !== false ? 'Khóa' : 'Mở khóa'}
        confirmClass={modal?.data?.active !== false ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
        loading={actionLoading}
        onConfirm={handleToggle}
        onCancel={() => setModal(null)}
      />

      <ConfirmModal
        open={modal?.type === 'delete'}
        title="Xóa tài khoản?"
        message={`Hành động này không thể hoàn tác. Tài khoản ${modal?.data?.name} sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa vĩnh viễn"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setModal(null)}
      />
    </AdminLayout>
  )
}
