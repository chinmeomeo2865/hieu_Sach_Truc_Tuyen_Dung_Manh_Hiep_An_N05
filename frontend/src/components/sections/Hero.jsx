import { ArrowRightIcon } from '../ui/icons'

const DEFAULT_CTA = {
  primary:   { label: 'Khám phá sách', href: '#books' },
  secondary: { label: 'Xem danh mục', href: '#cat' },
}

export function Hero({
  eyebrow         = 'Hà Đông · Hà Nội · Est. 2024',
  titleLine1      = 'Nơi mỗi cuốn sách',
  titleLine2      = 'tìm thấy người đọc',
  quote           = '"Tuyển chọn kỹ lưỡng — từng cuốn sách là một lời mời gọi đến những chân trời mới."',
  categoriesLabel = 'Văn học · Kiến thức · Thiếu nhi · Triết học · Kỹ năng',
  cta             = DEFAULT_CTA,
  stats           = [],
  images          = [],
}) {
  return (
    <section className="bg-surface-warm border-b border-divider overflow-hidden" aria-label="Hero">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] min-h-[82vh] items-stretch">

          {/* Text */}
          <div className="flex flex-col justify-center py-16 lg:pr-14 lg:border-r border-divider">
            <span className="inline-flex items-center gap-2.5 text-2xs font-semibold tracking-label-2xl uppercase text-muted mb-5 before:content-[''] before:w-6 before:h-[1.5px] before:bg-divider">
              {eyebrow}
            </span>

            <h1
              className="font-display font-semibold leading-[1.06] tracking-[-0.01em] text-ink mb-4"
              style={{ fontSize: 'clamp(2.6rem, 5vw, 4.2rem)' }}
            >
              {titleLine1}<br />
              <em className="italic font-medium text-muted">{titleLine2}</em>
            </h1>

            <p
              className="font-display italic text-ink-60 leading-[1.75] max-w-[400px] mb-2"
              style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)' }}
            >
              {quote}
            </p>

            <p className="text-2xs font-medium tracking-label-lg uppercase text-subtle mb-9">
              {categoriesLabel}
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <a
                href={cta.primary.href}
                className="inline-flex items-center gap-2 bg-ink text-white text-[11px] font-semibold tracking-label uppercase px-6 py-3 rounded-sm hover:bg-ink-80 hover:-translate-y-px hover:shadow-md transition-all active:translate-y-0"
              >
                {cta.primary.label}
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href={cta.secondary.href}
                className="inline-flex items-center gap-2 border border-divider text-ink-60 text-[11px] font-semibold tracking-label uppercase px-6 py-3 rounded-sm hover:border-ink hover:text-ink hover:-translate-y-px transition-all"
              >
                {cta.secondary.label}
              </a>
            </div>

            {stats.length > 0 && (
              <div className="flex gap-7 mt-10 pt-7 border-t border-divider-lt flex-wrap">
                {stats.map(({ num, label }) => (
                  <div key={label}>
                    <span className="block font-display text-2xl font-semibold text-ink leading-none mb-1">{num}</span>
                    <span className="text-2xs font-medium tracking-label uppercase text-muted">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visuals */}
          {images.length > 0 && (
            <div
              className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2.5 py-9 pl-8 overflow-hidden min-h-0"
              aria-hidden="true"
            >
              {images.map(({ src, tall }, i) => (
                <div
                  key={src}
                  className={`overflow-hidden rounded-lg bg-surface-subtle group ${tall ? 'row-span-2' : ''}`}
                >
                  <img
                    src={src}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover transition-transform duration-460 group-hover:scale-[1.04]"
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
