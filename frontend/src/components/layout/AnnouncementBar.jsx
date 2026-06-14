import { Link } from 'react-router-dom'

export function AnnouncementBar({ message = '', linkLabel = 'Xem ưu đãi →', linkHref = '/uu-dai' }) {
  return (
    <div className="bg-ink text-white text-center py-2.5 px-4 text-[11px] font-medium tracking-label uppercase">
      {message}
      {linkLabel && (
        <Link to={linkHref} className="text-yellow-200 underline ml-1.5 hover:text-yellow-100 transition-colors">{linkLabel}</Link>
      )}
    </div>
  )
}
