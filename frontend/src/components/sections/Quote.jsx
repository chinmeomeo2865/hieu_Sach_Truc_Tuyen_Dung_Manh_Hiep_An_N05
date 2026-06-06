export function Quote() {
  return (
    <div className="bg-ink py-20 md:py-28 px-5 text-center" aria-hidden="true">
      <p className="text-2xs font-semibold tracking-label-2xl uppercase text-white mb-5">
        Hiệu Sách Chin
      </p>
      <blockquote
        className="font-display font-medium italic leading-snug max-w-[560px] mx-auto mb-4 text-white text-balance"
        style={{ fontSize: 'clamp(1.35rem, 2.6vw, 2.2rem)' }}
      >
        "Một cuốn sách hay là người bạn suốt đời"
      </blockquote>
      <p className="text-[11px] font-medium tracking-label-md uppercase text-white">
        Hà Đông · Hà Nội · Est. 2024
      </p>
    </div>
  )
}
