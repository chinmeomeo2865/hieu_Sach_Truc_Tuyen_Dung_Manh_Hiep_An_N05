import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SectionHeader }   from '../ui/SectionHeader'
import { BlogCard }        from '../ui/BlogCard'

export function Blog({
  posts    = [],
  eyebrow  = 'Góc đọc sách',
  title    = 'Bài viết nổi bật',
  subtitle = 'Cảm nhận, gợi ý và câu chuyện từ đội ngũ Chin',
  linkText = 'Xem tất cả',
  linkHref = '#',
}) {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="blog" aria-label={title} className="border-t border-divider-lt pt-16 md:pt-24 pb-4">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} linkText={linkText} linkHref={linkHref} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <BlogCard key={post.id} post={post} delay={i * 100} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
