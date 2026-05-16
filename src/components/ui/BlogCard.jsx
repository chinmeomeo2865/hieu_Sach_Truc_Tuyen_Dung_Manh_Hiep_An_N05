export function BlogCard({ post, delay = 0 }) {
  const { title, category, date, readTime, image } = post
  const delayClass = delay === 100 ? 'delay-100' : delay === 200 ? 'delay-200' : ''

  return (
    <article className={`group cursor-pointer transition-all duration-700 ${delayClass}`}>
      <div className="aspect-card rounded-lg overflow-hidden bg-surface-subtle mb-4">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-460 group-hover:scale-[1.05] group-hover:opacity-88"
        />
      </div>
      <p className="text-[9px] font-semibold tracking-label-lg uppercase text-accent mb-2">{category}</p>
      <h3 className="font-display font-semibold text-base leading-snug text-ink mb-2 transition-colors group-hover:text-muted">
        {title}
      </h3>
      <p className="text-[10px] text-subtle tracking-wide">
        {date} &nbsp;·&nbsp; {readTime} đọc
      </p>
    </article>
  )
}
