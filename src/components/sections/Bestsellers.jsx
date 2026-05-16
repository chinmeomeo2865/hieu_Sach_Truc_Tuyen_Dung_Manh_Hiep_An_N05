import { useState }       from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SectionHeader }   from '../ui/SectionHeader'
import { FeaturedCard }    from '../ui/FeaturedCard'
import { BookCard }        from '../ui/BookCard'
import { BESTSELLERS, FILTER_TABS } from '../../data/books'

export function Bestsellers() {
  const { ref, visible } = useScrollReveal()
  const [active, setActive] = useState('all')

  const featured = BESTSELLERS.filter((b) => b.featured)
  const grid     = BESTSELLERS.filter((b) => !b.featured)

  return (
    <section
      id="books"
      aria-label="Sách bán chạy"
      className="border-t border-divider-lt py-16 md:py-24"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader
            eyebrow="Bán chạy nhất"
            title="Bestsellers"
            subtitle="Những cuốn sách được hàng nghìn độc giả tin yêu"
            linkText="Xem tất cả"
          />

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-8">
            {FILTER_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActive(value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-2xs font-semibold tracking-label uppercase transition-all ${
                  active === value
                    ? 'bg-ink text-white border-ink'
                    : 'border-divider-lt text-muted hover:border-ink hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Featured 2-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5px] border border-divider-lt rounded-xl overflow-hidden bg-divider-lt mb-5">
            {featured.map((book) => (
              <FeaturedCard key={book.id} book={book} />
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {grid.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-divider text-ink-60 text-[11px] font-semibold tracking-label uppercase px-6 py-3 rounded-sm hover:border-ink hover:text-ink hover:-translate-y-px transition-all"
            >
              Xem tất cả bestsellers
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
