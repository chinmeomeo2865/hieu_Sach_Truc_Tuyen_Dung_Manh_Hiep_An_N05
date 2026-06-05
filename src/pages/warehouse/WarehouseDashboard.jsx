import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api } from '../../services/api'
import { formatPrice } from '../../utils/format'

const ACTION_ICON = {
  import_stock:        { icon: '📦', color: 'bg-emerald-50 text-emerald-700' },
  update_order_status: { icon: '🚚', color: 'bg-blue-50 text-blue-700' },
  process_return:      { icon: '↩️', color: 'bg-orange-50 text-orange-700' },
  submit_audit:        { icon: '📋', color: 'bg-violet-50 text-violet-700' },
}

function StatCard({ label, value, sub, color, to, icon }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#e8e8e6] p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xl p-2 rounded-lg ${color}`}>{icon}</span>
        {sub !== undefined && (
          <span className="text-[11px] text-[#a3a3a3] mt-0.5">{sub}</span>
        )}
      </div>
      <p className="text-[28px] font-bold text-[#1c1c1a] leading-none">{value}</p>
      <p className="text-[12px] text-[#737373] mt-1.5">{label}</p>
    </motion.div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
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
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e8e8e6] p-5 animate-pulse">
              <div className="w-10 h-10 bg-[#f0f0f0] rounded-lg mb-4" />
              <div className="h-7 bg-[#f0f0f0] rounded w-16 mb-2" />
              <div className="h-3 bg-[#f0f0f0] rounded w-24" />
            </div>
          )) : stats && (<>
            <StatCard icon="📋" color="bg-amber-50" label="Đơn chờ xử lý" value={stats.pendingPacking} to="/warehouse/orders?status=CONFIRMED" />
            <StatCard icon="⚠️" color="bg-red-50"   label="Sản phẩm sắp hết" value={stats.lowStock} to="/warehouse/inventory?filter=low" />
            <StatCard icon="↩️" color="bg-orange-50" label="Hoàn/hủy hôm nay" value={stats.returns} to="/warehouse/returns" />
            <StatCard icon="📦" color="bg-emerald-50" label="Nhập kho hôm nay" value={stats.importedToday} to="/warehouse/inventory" />
          </>)}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/warehouse/orders?status=CONFIRMED', label: 'Xử lý đơn chờ', icon: '🚚', desc: 'Nhặt & đóng gói đơn hàng' },
            { to: '/warehouse/inventory', label: 'Nhập kho', icon: '📦', desc: 'Cập nhật hàng mới về' },
            { to: '/warehouse/audit', label: 'Kiểm kê kho', icon: '📋', desc: 'Đối chiếu tồn kho thực tế' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="bg-white border border-[#e8e8e6] rounded-xl p-4 flex items-center gap-3 hover:border-[#1c1c1a] hover:shadow-sm transition-all group">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="text-[13px] font-semibold text-[#1c1c1a] group-hover:text-[#0f0f0f]">{a.label}</p>
                <p className="text-[11px] text-[#a3a3a3]">{a.desc}</p>
              </div>
              <svg className="w-4 h-4 text-[#d4d4d4] ml-auto group-hover:text-[#1c1c1a] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0f0f0]">
            <p className="text-[13px] font-semibold text-[#1c1c1a]">Hoạt động gần đây</p>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-[#f0f0f0] rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 bg-[#f0f0f0] rounded w-3/4" />
                    <div className="h-2.5 bg-[#f0f0f0] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity?.length ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-[#a3a3a3]">Chưa có hoạt động nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f5f5f4]">
              {stats.recentActivity.map((a, i) => {
                const cfg = ACTION_ICON[a.action] || { icon: '🔧', color: 'bg-gray-50 text-gray-600' }
                return (
                  <li key={a._id || i} className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`text-base p-1.5 rounded-lg shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] text-[#1c1c1a] leading-snug truncate">{a.description}</p>
                      <p className="text-[11px] text-[#a3a3a3] mt-0.5">
                        {a.performedBy?.name} · {new Date(a.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-[#f0f0f0]">
            <Link to="/warehouse/activity" className="text-[11px] text-[#737373] hover:text-[#1c1c1a] transition-colors">
              Xem toàn bộ nhật ký →
            </Link>
          </div>
        </div>
      </div>
    </WarehouseLayout>
  )
}
