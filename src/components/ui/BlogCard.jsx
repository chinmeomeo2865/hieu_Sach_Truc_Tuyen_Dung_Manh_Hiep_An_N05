import { Link } from 'react-router-dom'

export function BlogCard({ post, delay = 0 }) {
  const title    = post.title
  const category = post.category
  const image    = post.coverImage || post.image
  const readTime = post.readTime ? `${post.readTime} phút đọc` : post.readTime
  const date     = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : post.date
  const href     = post._id ? `/blog/${post._id}` : null
  const delayClass = delay === 100 ? 'delay-100' : delay === 200 ? 'delay-200' : ''

  const inner = (
    <>
      <div className="aspect-card rounded-lg overflow-hidden bg-surface-subtle mb-4">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-460 group-hover:scale-[1.05] group-hover:opacity-88"
          />
        ) : (
          <div className="w-full h-full bg-surface-subtle"/>
        )}
      </div>
      <p className="text-[9px] font-semibold tracking-label-lg uppercase text-accent mb-2">{category}</p>
      <h3 className="font-display font-semibold text-base leading-snug text-ink mb-2 transition-colors group-hover:text-muted line-clamp-2">
        {title}
      </h3>
      <p className="text-[10px] text-subtle tracking-wide">
        {date}{readTime && ` · ${readTime}`}
      </p>
    </>
  )

  return href ? (
    <Link to={href} className={`group block cursor-pointer transition-all duration-700 ${delayClass}`}>
      {inner}
    </Link>
  ) : (
    <article className={`group cursor-pointer transition-all duration-700 ${delayClass}`}>
      {inner}
    </article>
  )
}
