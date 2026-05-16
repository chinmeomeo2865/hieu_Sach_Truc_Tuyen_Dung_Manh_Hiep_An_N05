import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SectionHeader }   from '../ui/SectionHeader'
import { CategoryCard }    from '../ui/CategoryCard'

export function Categories({
  categories = [],
  eyebrow    = 'Khám phá',
  title      = 'Danh mục sách',
  subtitle   = 'Tìm cuốn sách phù hợp với bạn',
}) {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="cat" aria-label={title} className="border-t border-divider-lt py-16 md:py-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.slug} category={cat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
