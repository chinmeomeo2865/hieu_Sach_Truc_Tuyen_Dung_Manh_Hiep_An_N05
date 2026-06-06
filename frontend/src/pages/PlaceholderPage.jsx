import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent">Sắp ra mắt</p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">{title}</h1>
      <p className="text-sm text-muted max-w-xs">
        {description ?? 'Trang này đang được xây dựng. Vui lòng quay lại sau.'}
      </p>
      <Link
        to="/"
        className="mt-2 text-xs font-semibold tracking-label uppercase text-ink underline underline-offset-4 hover:opacity-60 transition-opacity"
      >
        ← Về trang chủ
      </Link>
    </div>
  )
}
