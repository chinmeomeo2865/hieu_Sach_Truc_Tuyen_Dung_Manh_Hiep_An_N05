const VARIANTS = {
  best: 'bg-ink text-white',
  new:  'bg-accent text-white',
  sale: 'bg-red-600 text-white',
}

const LABELS = {
  best: 'Bestseller',
  new:  'Mới về',
  sale: null, // caller supplies label (e.g. "-15%")
}

export function Badge({ type, label }) {
  if (!type) return null
  const classes = VARIANTS[type] ?? VARIANTS.best
  const text    = label ?? LABELS[type] ?? type

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-label uppercase leading-none ${classes}`}>
      {text}
    </span>
  )
}
