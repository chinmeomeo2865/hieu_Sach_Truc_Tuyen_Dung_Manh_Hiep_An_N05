/* Tiện ích xử lý khoảng thời gian cho dashboard (preset + custom + so sánh kỳ trước) */

const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay   = d => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

function resolveRange({ period, qStart, qEnd }) {
  const now = new Date()
  if (qStart && qEnd) {
    return { startDate: startOfDay(new Date(qStart)), endDate: endOfDay(new Date(qEnd)), period: 'custom' }
  }
  const p = period || '30days'
  switch (p) {
    case 'today':
      return { startDate: startOfDay(now), endDate: now, period: p }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { startDate: startOfDay(y), endDate: endOfDay(y), period: p }
    }
    case '7days': {
      const s = new Date(now); s.setDate(s.getDate() - 6)
      return { startDate: startOfDay(s), endDate: now, period: p }
    }
    case 'this_month':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now, period: p }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
      return { startDate: s, endDate: e, period: p }
    }
    case '30days':
    default: {
      const s = new Date(now); s.setDate(s.getDate() - 29)
      return { startDate: startOfDay(s), endDate: now, period: '30days' }
    }
  }
}

/* Kỳ trước = cùng độ dài, ngay trước kỳ hiện tại */
function previousRange(startDate, endDate) {
  const durationMs = endDate - startDate
  const prevEnd   = new Date(startDate.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - durationMs)
  return { prevStart, prevEnd }
}

function pctChange(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0
  return Math.round(((cur - prev) / prev) * 100)
}

/* Lấp đầy chuỗi ngày (UTC, khớp $dateToString); seriesMaps = { key: { 'YYYY-MM-DD': value } } */
function buildDailyFromSeries(startDate, endDate, seriesMaps) {
  const out = []
  const cur  = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
  const last = new Date(Date.UTC(endDate.getUTCFullYear(),   endDate.getUTCMonth(),   endDate.getUTCDate()))
  let guard = 0
  while (cur <= last && guard < 400) {
    const key = cur.toISOString().slice(0, 10)
    const row = { _id: key }
    for (const m of Object.keys(seriesMaps)) row[m] = seriesMaps[m][key] || 0
    out.push(row)
    cur.setUTCDate(cur.getUTCDate() + 1)
    guard++
  }
  return out
}

module.exports = { startOfDay, endOfDay, resolveRange, previousRange, pctChange, buildDailyFromSeries }
