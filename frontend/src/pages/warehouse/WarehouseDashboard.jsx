import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api } from '../../services/api'
import { formatPrice } from '../../utils/format'

const ACTION_ICON = {
  import_stock:        { icon: '📦', color: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  update_order_status: { icon: '🚚', color: 'bg-amber-50 text-amber-800 border-amber-100' },
  process_return:      { icon: '↩️', color: 'bg-sand-100 text-sand-900 border-sand-200' },
  submit_audit:        { icon: '📋', color: 'bg-blue-50 text-blue-800 border-blue-100' },
}

function StatCard({ label, value, sub, color, to, icon, delay }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-2xl border border-divider-lt p-6 shadow-card hover:shadow-card-h transition-all duration-300 group cursor-pointer flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-lg p-2.5 rounded-xl border ${color}`}>{icon}</span>
          {sub !== undefined && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{sub}</span>
          )}
        </div>
        <p className="text-[32px] font-bold text-ink leading-none tracking-tight tabular-nums">{value}</p>
      </div>
      <p className="text-[12.5px] font-semibold text-ink-80 mt-3 group-hover:text-accent transition-colors duration-200">{label}</p>
    </motion.div>
  )
  return to ? <Link to={to} className="h-full block">{inner}</Link> : inner
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

export default function WarehouseDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/warehouse/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <WarehouseLayout title="Dashboard">
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        
        {/* Header section centered with custom line indicator */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-tight">Tổng quan kho hàng</h1>
          <div className="h-0.5 w-10 bg-accent rounded-full" />
          <p className="text-[12.5px] text-muted font-semibold max-w-xl">Báo cáo tồn kho, trạng thái đơn hàng và nhật ký hoạt động ngày hôm nay.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-divider-lt p-6 animate-pulse min-h-[140px]">
              <div className="w-10 h-10 bg-surface-subtle rounded-xl mb-5" />
              <div className="h-8 bg-surface-subtle rounded w-16 mb-3" />
              <div className="h-3.5 bg-surface-subtle rounded w-24" />
            </div>
          )) : stats && (<>
            <StatCard icon="📋" color="bg-sand-50 text-sand-900 border-sand-200" label="Đơn chờ xử lý" value={stats.pendingPacking} to="/warehouse/orders?status=CONFIRMED" delay={0.05} />
            <StatCard icon="⚠️" color="bg-red-50/70 text-red-800 border-red-100"   label="Sản phẩm sắp hết" value={stats.lowStock} to="/warehouse/inventory?filter=low" delay={0.1} />
            <StatCard icon="↩️" color="bg-amber-50/70 text-amber-800 border-amber-100" label="Hoàn/hủy hôm nay" value={stats.returns} to="/warehouse/returns" delay={0.15} />
            <StatCard icon="📦" color="bg-emerald-50/70 text-emerald-800 border-emerald-100" label="Nhập kho hôm nay" value={stats.importedToday} to="/warehouse/inventory" delay={0.2} />
          </>)}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle text-center">Thao tác nhanh</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: '/warehouse/orders?status=CONFIRMED', label: 'Xử lý đơn chờ', icon: '🚚', desc: 'Nhặt & đóng gói đơn hàng' },
              { to: '/warehouse/inventory', label: 'Nhập kho', icon: '📦', desc: 'Cập nhật hàng mới về' },
              { to: '/warehouse/audit', label: 'Kiểm kê kho', icon: '📋', desc: 'Đối chiếu tồn kho thực tế' },
            ].map((a, idx) => (
              <motion.div
                key={a.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="h-full"
              >
                <Link to={a.to}
                  className="bg-white border border-divider-lt rounded-2xl p-5 flex items-center gap-4 hover:border-ink hover:shadow-card duration-300 transition-all group h-full">
                  <span className="text-2xl p-2 bg-surface-warm rounded-xl border border-divider-lt group-hover:bg-sand-100 group-hover:border-sand-200 transition-colors duration-300">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink group-hover:text-accent transition-colors duration-200">{a.label}</p>
                    <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed">{a.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-subtle group-hover:text-ink transition-colors duration-200 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle text-center">Hoạt động gần đây</p>
          <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
            {loading ? (
              <div className="p-6 space-y-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 bg-surface-subtle rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1.5">
                      <div className="h-3.5 bg-surface-subtle rounded w-3/4" />
                      <div className="h-3 bg-surface-subtle rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !stats?.recentActivity?.length ? (
              <div className="py-16 text-center">
                <p className="text-[13.5px] font-semibold text-ink">Chưa có hoạt động nào hôm nay</p>
                <p className="text-[11px] text-muted mt-1">Mọi cập nhật trạng thái đơn và nhập kho sẽ hiện ở đây.</p>
              </div>
            ) : (
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-divider-lt"
              >
                {stats.recentActivity.map((a, i) => {
                  const cfg = ACTION_ICON[a.action] || { icon: '🔧', color: 'bg-surface-subtle text-ink-80 border-divider-lt' }
                  return (
                    <motion.li variants={itemVariants} key={a._id || i} className="flex items-start gap-4 px-6 py-4 hover:bg-surface-warm/30 transition-colors duration-200">
                      <span className={`text-base p-2 rounded-xl shrink-0 border ${cfg.color}`}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink leading-snug truncate">{a.description}</p>
                        <p className="text-[11px] text-muted mt-1 font-medium">
                          {a.performedBy?.name} · {new Date(a.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
            <div className="px-6 py-4 border-t border-divider-lt bg-surface-warm/30">
              <Link to="/warehouse/activity" className="text-[11px] font-bold uppercase tracking-wider text-ink-80 hover:text-accent transition-colors duration-200">
                Xem toàn bộ nhật ký thao tác →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </WarehouseLayout>
  )
}
