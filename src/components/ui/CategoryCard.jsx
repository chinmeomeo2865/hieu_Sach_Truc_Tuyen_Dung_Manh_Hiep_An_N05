import { useUIStore } from '../../store/uiStore'

export function CategoryCard({ category }) {
  const { name, count, image, slug } = category
  const setCategory = useUIStore(s => s.setCategory)

  const handleClick = () => {
    setCategory(slug)
    // Scroll to books section after state update
    setTimeout(() => {
      document.getElementById('books')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`Xem danh mục ${name}`}
      className="relative block w-full aspect-card rounded-lg overflow-hidden bg-surface-subtle cursor-pointer group text-left"
    >
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover transition-all duration-460 group-hover:scale-[1.07] group-hover:opacity-85"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent flex flex-col justify-end p-5">
        <p className="text-[9px] font-semibold tracking-label-lg uppercase text-white/60 mb-1">
          {count} đầu sách
        </p>
        <p className="font-display font-semibold text-[1.05rem] text-white leading-tight">{name}</p>
      </div>
    </button>
  )
}
