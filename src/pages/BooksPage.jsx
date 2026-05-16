import { useState, useMemo } from 'react'
import { useSearchParams }   from 'react-router-dom'
import { BookCard }          from '../components/ui/BookCard'
import { SectionHeader }     from '../components/ui/SectionHeader'
import { useProducts }       from '../hooks/useProducts'
import { FILTER_TABS }       from '../data/books'

const SORT_OPTIONS = [
  { value: 'rating',     label: 'Đánh giá cao nhất' },
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'price_asc',  label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
]

const LIMIT = 12

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const category = searchParams.get('category') || 'all'
  const sort     = searchParams.get('sort')     || 'rating'
  const page     = parseInt(searchParams.get('page') || '1', 10)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [inputVal, setInputVal] = useState(search)

  function setParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'all' && value !== '1') next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(inputVal)
    setParam('search', inputVal)
  }

  const { products, loading, pagination } = useProducts({ sort, category, search, page, limit: LIMIT })

  const totalPages = pagination?.totalPages || 1

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      <SectionHeader
        eyebrow="Tất cả sách"
        title="Kho sách Chin"
        subtitle="Hơn 500 đầu sách được tuyển chọn kỹ lưỡng"
      />

      {/* Search + Sort */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Tìm tên sách, tác giả…"
            className="flex-1 border border-divider rounded-sm px-3 py-2 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-ink text-white text-xs font-semibold tracking-label rounded-sm hover:bg-ink-80 transition-colors"
          >
            Tìm
          </button>
        </form>

        <select
          value={sort}
          onChange={e => setParam('sort', e.target.value)}
          className="border border-divider rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink transition-colors bg-white"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setParam('category', tab.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-label transition-colors ${
              category === tab.value
                ? 'bg-ink text-white'
                : 'bg-surface-subtle text-ink-60 hover:bg-divider-lt'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="aspect-book bg-surface-subtle rounded-sm animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted text-sm">Không tìm thấy sách phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map(book => (
              <BookCard key={book._id || book.id} book={{ ...book, id: book._id || book.id }} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
            className="px-4 py-2 border border-divider rounded-sm text-sm text-ink disabled:opacity-40 hover:border-ink transition-colors"
          >
            ← Trước
          </button>
          <span className="text-sm text-muted px-3">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setParam('page', String(page + 1))}
            className="px-4 py-2 border border-divider rounded-sm text-sm text-ink disabled:opacity-40 hover:border-ink transition-colors"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  )
}
