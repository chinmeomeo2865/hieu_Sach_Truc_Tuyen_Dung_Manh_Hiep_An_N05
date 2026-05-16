import { ArrowRightIcon } from './icons'

export function SectionHeader({ eyebrow, title, subtitle, linkText, linkHref = '#' }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
      <div>
        {eyebrow && (
          <span className="block text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-2">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display font-semibold text-2xl md:text-3xl leading-tight text-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        )}
      </div>

      {linkText && (
        <a
          href={linkHref}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-label uppercase text-ink border-b border-divider pb-0.5 transition-colors hover:text-muted hover:border-muted group"
        >
          {linkText}
          <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </div>
  )
}
