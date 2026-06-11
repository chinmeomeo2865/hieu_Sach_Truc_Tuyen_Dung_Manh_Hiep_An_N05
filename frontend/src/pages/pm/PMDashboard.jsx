import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'

/* ─── Icons ──────────────────────────────────────────────── */
const ICON_PATHS = {
  book: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  alert: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  tag: <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  folder: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  eye: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </>
  ),
  pencil: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  stop: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M5.636 5.636l12.728 12.728" />
    </>
  ),
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
}

function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {ICON_PATHS[name]}
    </svg>
  )
}

/* ─── Skeletons ──────────────────────────────────────────── */
function SkeletonStat() {
  return (
    <div className="bg-[#F2EFEA] border border-[#EAE6DF] rounded-xl p-4 h-[148px] animate-pulse">
      <div className="h-3 bg-[#E6E1DA] rounded w-1/2 mb-4" />
      <div className="h-7 bg-[#E6E1DA] rounded w-2/3 mb-4" />
      <div className="border-t border-[#E6E1DA] pt-3 mt-3 space-y-2">
        <div className="h-3 bg-[#E6E1DA] rounded w-full" />
        <div className="h-3 bg-[#E6E1DA] rounded w-5/6" />
      </div>
    </div>
  )
}

/* ─── Analytics-style stat card ─────────────────────────────
   Mirrors AdminAnalyticsPage's summary cards: bordered icon box,
   font-display headline, and a footer breakdown split by a divider. */
function StatCard({ icon, label, value, valueColor = 'text-[#1A1A1A]', rows, to }) {
  const card = (
    <div className={`bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm h-full ${to ? 'hover:shadow-md hover:border-[#D8D2CA] transition-all' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">{label}</span>
        <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]">
          <Icon name={icon} />
        </div>
      </div>
      <p className={`font-display text-[22px] font-bold mt-2 mb-2 ${valueColor}`}>{value}</p>
      <div className="border-t border-[#EAE6DF] pt-2 mt-2 space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between text-[11px]">
            <span className="text-[#615C56]">{r.label}</span>
            <span className={`font-bold ${r.color || 'text-[#1A1A1A]'}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{card}</Link> : card
}

const QUICK_ACTIONS = [
  { to: '/pm/products?new=1', label: 'Thêm sách mới', icon: 'book' },
  { to: '/pm/promotions?new=1', label: 'Tạo khuyến mãi', icon: 'tag' },
  { to: '/pm/categories?new=1', label: 'Thêm danh mục', icon: 'folder' },
  { to: '/pm/visibility?filter=out', label: 'Xử lý sách hết hàng', icon: 'alert' },
]

const ACTION_CFG = {
  create_category: { icon: 'folder', label: 'Thêm danh mục', badge: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  update_category: { icon: 'pencil', label: 'Sửa danh mục', badge: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  delete_category: { icon: 'trash', label: 'Xóa danh mục', badge: 'bg-red-50 text-red-600 border border-red-200/50' },
  create_promotion: { icon: 'tag', label: 'Tạo KM', badge: 'bg-violet-50 text-violet-700 border border-violet-200/50' },
  end_promotion: { icon: 'stop', label: 'Kết thúc KM', badge: 'bg-orange-50 text-orange-700 border border-orange-200/50' },
  toggle_visibility: { icon: 'eye', label: 'Đổi hiển thị', badge: 'bg-amber-50 text-amber-700 border border-amber-200/50' },
  create_product: { icon: 'book', label: 'Thêm sách', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  update_product: { icon: 'pencil', label: 'Sửa sách', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  delete_product: { icon: 'trash', label: 'Xóa sách', badge: 'bg-red-50 text-red-600 border border-red-200/50' },
}

export default function PMDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/pm/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const total = stats?.total || 0
  const totalCats = stats?.totalCats || 0
  const avgPerCat = totalCats > 0 ? Math.round(total / totalCats) : 0
  const outOfStockPct = total > 0 ? Math.round(((stats?.outOfStock || 0) / total) * 100) : 0
  const maxCatCount = Math.max(1, ...((stats?.topCategories || []).map(c => c.count)))

  return (
    <PMLayout title="Dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Tổng quan quản lý sản phẩm</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Tình trạng kho sách, danh mục và chiến dịch khuyến mãi</p>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {loading ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (
          <>
            <StatCard
              icon="book" label="Tổng số đầu sách" value={`${total} đầu sách`} to="/pm/products"
              rows={[
                { label: 'Đang hiển thị', value: stats.visible, color: 'text-emerald-600' },
                { label: 'Đang ẩn', value: stats.hidden },
              ]}
            />
            <StatCard
              icon="alert" label="Tình trạng tồn kho" value={`${stats.outOfStock} sách hết hàng`} to="/pm/visibility?filter=out"
              valueColor={stats.outOfStock > 0 ? 'text-red-600' : 'text-[#1A1A1A]'}
              rows={[
                { label: 'Tồn kho ≤ 10 cuốn', value: stats.lowStockCount, color: stats.lowStockCount > 0 ? 'text-amber-600' : '' },
                { label: 'Tỷ lệ trên tổng kho', value: `${outOfStockPct}%`, color: stats.outOfStock > 0 ? 'text-red-600' : '' },
              ]}
            />
            <StatCard
              icon="layers" label="Danh mục & khuyến mãi" value={`${totalCats} danh mục`} to="/pm/categories"
              rows={[
                { label: 'Khuyến mãi đang chạy', value: stats.activePromos, color: stats.activePromos > 0 ? 'text-emerald-600' : '' },
                { label: 'Trung bình sách / danh mục', value: avgPerCat },
              ]}
            />
          </>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.to} to={a.to}
            className="bg-white border border-[#EAE6DF] rounded-lg p-4 flex items-center gap-3 hover:border-[#1A1A1A] hover:shadow-sm transition-all group">
            <div className="border border-[#EAE6DF] group-hover:border-[#1A1A1A] p-2 bg-[#FAF8F5] rounded-lg text-[#615C56] group-hover:text-[#1A1A1A] transition-colors shrink-0">
              <Icon name={a.icon} className="w-4 h-4" />
            </div>
            <p className="font-display text-[12px] font-semibold text-[#1A1A1A]">{a.label}</p>
          </Link>
        ))}
      </motion.div>

      {/* Low stock + Top categories */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Sách sắp hết hàng */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5 flex items-center justify-between">
            <span>Sách sắp hết hàng</span>
            {!loading && stats?.lowStockCount > 0 && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                {stats.lowStockCount} đầu sách
              </span>
            )}
          </p>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : !stats?.lowStockProducts?.length ? (
            <p className="text-[12px] text-emerald-600 text-center py-8 font-semibold">Tất cả sản phẩm đều đủ lượng tồn kho</p>
          ) : (
            <div className="space-y-3.5">
              {stats.lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-7 h-10 object-cover rounded-md shadow-sm shrink-0" />
                    ) : (
                      <div className="w-7 h-10 bg-[#FAF8F5] rounded-md border border-[#EAE6DF] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                      <p className="text-[10px] text-[#9B9389]">{p.author}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${p.stock === 0 ? 'bg-red-50 text-red-600 border border-red-200/50' : 'bg-amber-50 text-amber-700 border border-amber-200/50'}`}>
                    {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danh mục nổi bật */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5">
            Danh mục nổi bật
          </p>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : !stats?.topCategories?.length ? (
            <p className="text-[12px] text-[#9B9389] text-center py-8">Chưa có dữ liệu</p>
          ) : (
            stats.topCategories.map(c => (
              <div key={c._id} className="mb-4 last:mb-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-display text-[12.5px] font-semibold text-[#1A1A1A]">{c.category}</span>
                  <span className="font-display text-[12.5px] font-bold text-[#1A1A1A]">{c.count} đầu sách</span>
                </div>
                <div className="h-3 bg-[#F2EFEA] rounded-sm overflow-hidden">
                  <div className="h-full bg-[#2E4A3F] rounded-sm" style={{ width: `${(c.count / maxCatCount) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <PMRecentActivity />
      </motion.div>
    </PMLayout>
  )
}

function PMRecentActivity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/pm/activity?limit=6').then(r => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EAE6DF] flex items-center justify-between">
        <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">Hoạt động gần đây</p>
        <Link to="/pm/activity" className="text-[11px] text-[#9B9389] hover:text-[#1A1A1A] transition-colors font-medium">Xem tất cả →</Link>
      </div>
      {loading ? (
        <div className="divide-y divide-[#FAF8F5]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="w-8 h-8 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-3 bg-[#FAF8F5] rounded w-2/3" /><div className="h-2.5 bg-[#FAF8F5] rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      ) : !logs.length ? (
        <p className="text-[12px] text-[#9B9389] text-center py-8">Chưa có hoạt động nào</p>
      ) : (
        <ul className="divide-y divide-[#FAF8F5]">
          {logs.map((l, i) => {
            const cfg = ACTION_CFG[l.action] || { icon: 'pencil', label: l.action, badge: 'bg-gray-50 text-gray-500 border border-gray-200/50' }
            return (
              <li key={l._id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF8F5]/50 transition-colors">
                <span className="border border-[#EAE6DF] p-1.5 bg-[#FAF8F5] rounded-lg text-[#615C56] shrink-0">
                  <Icon name={cfg.icon} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#1A1A1A] truncate">{l.description}</p>
                  <p className="text-[10px] text-[#9B9389] mt-0.5">{l.performedBy?.name} · {new Date(l.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${cfg.badge}`}>{cfg.label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
