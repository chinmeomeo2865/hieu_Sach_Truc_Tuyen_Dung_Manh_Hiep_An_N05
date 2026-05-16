const BASE = 'inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-label uppercase transition-all duration-180 cursor-pointer rounded-sm select-none'

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink-80 hover:-translate-y-px hover:shadow-md active:translate-y-0',
  outline: 'border border-divider text-ink-60 hover:border-ink hover:text-ink hover:-translate-y-px',
  ghost:   'text-muted border-b border-divider rounded-none pb-0.5 hover:text-ink hover:border-ink',
}

const SIZES = {
  sm: 'text-[10px] px-4 py-2',
  md: 'text-[11px] px-6 py-3',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
