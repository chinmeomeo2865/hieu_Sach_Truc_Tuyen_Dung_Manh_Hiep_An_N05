import { Link } from 'react-router-dom'
import { FacebookIcon, InstagramIcon, TiktokIcon } from '../ui/icons'
import { useUIStore } from '../../store/uiStore'

const SOCIAL = [
  { label: 'Facebook',  Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'TikTok',    Icon: TiktokIcon },
]

const LEGAL = ['Chính sách bảo mật', 'Điều khoản dịch vụ', 'Cookie']

function SocialBtn({ href = '#', label, Icon }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-[34px] h-[34px] rounded-lg border border-white/30 flex items-center justify-center text-white hover:bg-white/15 transition-all duration-300"
    >
      <Icon />
    </a>
  )
}

export function Footer({
  columns    = [],
  social     = SOCIAL,
  legalLinks = LEGAL,
  copyright  = '© 2026 Hiệu Sách Chin. Bảo lưu mọi quyền.',
}) {
  const openSupportModal = useUIStore(s => s.openSupportModal)

  return (
    <footer className="bg-ink" role="contentinfo">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-xl font-semibold text-white mb-3">
              Hiệu Sách <em className="italic font-medium">Chin</em>
            </p>
            <p className="text-xs text-white leading-relaxed max-w-[200px] mb-5">
              Tuyển chọn những cuốn sách chạm đến trái tim — nơi tri thức gặp gỡ tâm hồn.
            </p>
            <div className="flex gap-2">
              {social.map(({ label, Icon, href }) => (
                <SocialBtn key={label} label={label} Icon={Icon} href={href} />
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map(({ label, links }) => (
            <div key={label}>
              <p className="text-2xs font-semibold tracking-label-lg uppercase text-white mb-4">
                {label}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label: text, href, modal }) => (
                  <li key={text}>
                    {modal ? (
                      <button
                        onClick={() => openSupportModal(modal)}
                        className="text-xs text-white/70 hover:text-white transition-colors duration-200 inline-block text-left"
                      >
                        {text}
                      </button>
                    ) : (
                      <Link
                        to={href}
                        className="text-xs text-white/70 hover:text-white transition-colors duration-200 inline-block"
                      >
                        {text}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-white">{copyright}</p>
          <div className="flex gap-5">
            {legalLinks.map((text) => (
              <a
                key={text}
                href="#"
                className="text-[11px] text-white hover:opacity-70 transition-opacity duration-200"
              >
                {text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
