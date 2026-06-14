import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SectionHeader }   from '../ui/SectionHeader'
import { BookCard }        from '../ui/BookCard'

export function NewArrivals({
  books    = [],
  eyebrow  = 'Vừa về kho',
  title    = 'Mới về',
  subtitle = 'Những đầu sách mới nhất vừa được bổ sung',
  linkText = 'Xem tất cả',
  linkHref = '#',
}) {
  const { ref, visible } = useScrollReveal()

  return (
    <section aria-label={title} className="border-t border-divider-lt py-16 md:py-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} linkText={linkText} linkHref={linkHref} />

          <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 md:overflow-visible md:pb-0">
            {books.map((book) => (
              <div key={book.id || book._id} className="flex-shrink-0 w-[180px] md:w-auto snap-start flex flex-col h-full">
                <BookCard book={book} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
