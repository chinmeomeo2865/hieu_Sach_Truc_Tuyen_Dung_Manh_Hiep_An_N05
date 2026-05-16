import { TruckIcon, RefreshIcon, ShieldIcon, ZapIcon } from '../ui/icons'

const ICON_MAP = {
  truck:   TruckIcon,
  refresh: RefreshIcon,
  shield:  ShieldIcon,
  zap:     ZapIcon,
}

export function TrustBar({ items = [] }) {
  return (
    <div className="border-b border-divider-lt">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {items.map(({ id, title, sub, icon }, i) => {
            const Icon = ICON_MAP[icon] ?? TruckIcon
            const isLast = i === items.length - 1
            return (
              <div
                key={id}
                className={`flex items-center gap-3.5 py-4 px-3 md:px-5 ${!isLast ? 'border-b md:border-b-0 md:border-r border-divider-lt' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-semibold text-ink">{title}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
