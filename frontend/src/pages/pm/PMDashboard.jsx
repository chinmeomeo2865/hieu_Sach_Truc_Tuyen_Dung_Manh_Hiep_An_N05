import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'

function StatCard({ label, value, sub, icon, color, warn, to, delay = 0 }) {
  const card = (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all ${warn ? 'border-red-200' : 'border-[#ebebeb]'}`}>
      <div className="flex items-start justify-between mb-4">
        <span className={`text-xl p-2.5 rounded-xl ${color}`}>{icon}</span>
        {sub && <span className="text-[10px] text-[#a3a3a3] font-medium mt-1">{sub}</span>}
      </div>
      <p className={`text-[30px] font-bold leading-none ${warn ? 'text-red-500' : 'text-[#0f0f0f]'}`}>{value ?? '—'}</p>
      <p className="text-[11px] text-[#737373] mt-1.5 font-medium">{label}</p>
    </motion.div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export default function PMDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/pm/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const sk = <div className="bg-white border border-[#ebebeb] rounded-xl p-5 animate-pulse"><div className="w-10 h-10 bg-[#f0f0f0] rounded-xl mb-4"/><div className="h-8 bg-[#f0f0f0] rounded w-16 mb-2"/><div className="h-3 bg-[#f0f0f0] rounded w-24"/></div>

  return (
    <PMLayout title="Dashboard">
      <div className="max-w-5xl space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({length:6}).map((_,i) => <div key={i}>{sk}</div>) : stats && (<>
            <StatCard icon="📚" color="bg-blue-50"    label="Tổng số sách"         value={stats.total}       delay={0}    to="/pm/products" />
            <StatCard icon="👁"  color="bg-emerald-50" label="Đang hiển thị"        value={stats.visible}     delay={0.05} to="/pm/visibility" />
            <StatCard icon="🚫" color="bg-gray-50"    label="Đang ẩn"              value={stats.hidden}      delay={0.1}  to="/pm/visibility" />
            <StatCard icon="⚠️" color="bg-red-50"     label="Hết hàng (đang hiện)" value={stats.outOfStock}  delay={0.15} warn={stats.outOfStock > 0} to="/pm/visibility" />
            <StatCard icon="🏷" color="bg-violet-50"  label="KM đang chạy"         value={stats.activePromos} delay={0.2}  to="/pm/promotions" />
            <StatCard icon="📂" color="bg-amber-50"   label="Danh mục"             value={stats.totalCats}   delay={0.25} to="/pm/categories" />
          </>)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/pm/products?new=1', icon: '📖', label: 'Thêm sách mới' },
            { to: '/pm/promotions?new=1', icon: '🏷', label: 'Tạo khuyến mãi' },
            { to: '/pm/categories?new=1', icon: '📂', label: 'Thêm danh mục' },
            { to: '/pm/visibility?filter=out', icon: '⚠️', label: 'Sách hết hàng' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="bg-white border border-[#ebebeb] rounded-xl p-4 text-center hover:border-[#0f0f0f] hover:shadow-sm transition-all group">
              <span className="text-2xl block mb-2">{a.icon}</span>
              <p className="text-[11px] font-semibold text-[#0f0f0f] group-hover:text-[#0f0f0f]">{a.label}</p>
            </Link>
          ))}
        </div>

        <PMRecentActivity />
      </div>
    </PMLayout>
  )
}

function PMRecentActivity() {
  const [logs, setLogs] = useState([])
  useEffect(() => {
    api.get('/api/pm/activity?limit=6').then(r => setLogs(r.data)).catch(() => {})
  }, [])

  const ACTION_LABEL = {
    create_category: { icon: '📂', label: 'Thêm danh mục' },
    update_category: { icon: '✏️', label: 'Sửa danh mục' },
    delete_category: { icon: '🗑', label: 'Xóa danh mục' },
    create_promotion: { icon: '🏷', label: 'Tạo KM' },
    end_promotion: { icon: '🔚', label: 'Kết thúc KM' },
    toggle_visibility: { icon: '👁', label: 'Đổi hiển thị' },
    create_product: { icon: '📖', label: 'Thêm sách' },
    update_product: { icon: '✏️', label: 'Sửa sách' },
    delete_product: { icon: '🗑', label: 'Xóa sách' },
  }

  if (!logs.length) return null
  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#0f0f0f]">Hoạt động gần đây</p>
        <Link to="/pm/activity" className="text-[11px] text-[#737373] hover:text-[#0f0f0f] transition-colors">Xem tất cả →</Link>
      </div>
      <ul className="divide-y divide-[#f5f5f4]">
        {logs.map((l, i) => {
          const cfg = ACTION_LABEL[l.action] || { icon: '🔧', label: l.action }
          return (
            <li key={l._id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition-colors">
              <span className="text-base bg-[#f5f5f3] rounded-lg p-1.5 shrink-0">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[#0f0f0f] truncate">{l.description}</p>
                <p className="text-[10px] text-[#a3a3a3]">{l.performedBy?.name} · {new Date(l.createdAt).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}</p>
              </div>
              <span className="text-[9px] font-semibold text-[#a3a3a3] uppercase tracking-wider shrink-0">{cfg.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
