import { useMemo }          from 'react'
import { useScrollReveal }  from '../../hooks/useScrollReveal'
import { useUIStore }       from '../../store/uiStore'
import { SectionHeader }    from '../ui/SectionHeader'
import { FeaturedCard }     from '../ui/FeaturedCard'
import { BookCard }         from '../ui/BookCard'

export function FeaturedBooks({
  books    = [],
  filters  = [],
  eyebrow  = '',
  title    = '',
  subtitle = '',
  linkText = 'Xem tất cả',
  linkHref = '#',
}) {
  const { ref, visible }  = useScrollReveal()
  const active            = useUIStore(s => s.activeCategory)
  const setCategory       = useUIStore(s => s.setCategory)

  const filtered = useMemo(
    () => active === 'all' ? books : books.filter(b => b.categorySlug === active),
    [books, active],
  )

  const featured = useMemo(() => filtered.filter(b => b.featured), [filtered])
  const grid     = useMemo(() => filtered.filter(b => !b.featured), [filtered])

  return (
    <section id="books" aria-label={title} className="border-t border-divider-lt py-16 md:py-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} linkText={linkText} linkHref={linkHref} />

          {/* Filter pills */}
          {filters.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-8" role="tablist" aria-label="Lọc theo danh mục">
              {filters.map(({ value, label }) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={active === value}
                  onClick={() => setCategory(value)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-2xs font-semibold tracking-label uppercase transition-all ${active === value ? 'bg-ink text-white border-ink' : 'border-divider-lt text-muted hover:border-ink hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Featured 2-up */}
          {featured.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5px] border border-divider-lt rounded-xl overflow-hidden bg-divider-lt mb-5">
              {featured.map(book => (
                <FeaturedCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {/* Grid */}
          {grid.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {grid.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : featured.length === 0 && (
            <p className="text-center text-sm text-muted py-16">
              Không có sách nào trong danh mục này.
            </p>
          )}

          <div className="text-center mt-8">
            <a
              href={linkHref}
              className="inline-flex items-center gap-2 border border-divider text-ink-60 text-[11px] font-semibold tracking-label uppercase px-6 py-3 rounded-sm hover:border-ink hover:text-ink hover:-translate-y-px transition-all"
            >
              {linkText}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
