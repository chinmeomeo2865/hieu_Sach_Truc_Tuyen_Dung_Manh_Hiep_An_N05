export function StarRating({ rating, reviewCount, className = '' }) {
  const pct = `${Math.round((rating / 5) * 100)}%`

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="relative inline-flex text-xs tracking-wider leading-none" aria-label={`${rating} sao`}>
        <span className="text-divider-lt">★★★★★</span>
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <span className="absolute inset-0 overflow-hidden text-star whitespace-nowrap" style={{ width: pct }}>
          ★★★★★
        </span>
      </div>
      <span className="text-[10px] font-semibold text-ink-60">{rating}</span>
      {reviewCount && (
        <span className="text-[10px] text-subtle">({reviewCount})</span>
      )}
    </div>
  )
}
