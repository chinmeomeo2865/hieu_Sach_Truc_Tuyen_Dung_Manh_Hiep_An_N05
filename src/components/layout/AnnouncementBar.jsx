export function AnnouncementBar({ message = '', linkLabel = 'Xem ưu đãi →', linkHref = '#' }) {
  return (
    <div className="bg-ink text-white text-center py-2.5 px-4 text-[11px] font-medium tracking-label uppercase">
      {message}
      {linkLabel && (
        <a href={linkHref} className="text-yellow-200 underline ml-1.5">{linkLabel}</a>
      )}
    </div>
  )
}
