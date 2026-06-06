export function Newsletter({
  eyebrow  = 'Bản tin',
  title    = 'Nhận gợi ý sách mỗi tuần',
  subtitle = 'Ưu đãi độc quyền, sách mới về, và góc đọc sách từ đội ngũ Chin — thẳng vào hộp thư của bạn.',
  onSubmit,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <div className="bg-surface-warm border-t border-divider-lt py-16 md:py-24 px-5 text-center">
      <span className="block text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-3">
        {eyebrow}
      </span>
      <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink mb-3">{title}</h2>
      <p className="text-sm text-muted mb-6 max-w-md mx-auto">{subtitle}</p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto"
        aria-label="Form đăng ký bản tin"
      >
        <label htmlFor="nl-email" className="sr-only">Email</label>
        <input
          id="nl-email"
          type="email"
          placeholder="Nhập email của bạn"
          autoComplete="email"
          required
          className="flex-1 border border-divider rounded-sm px-4 py-3 text-sm font-sans text-ink placeholder-subtle outline-none focus:border-ink transition-colors bg-white"
        />
        <button
          type="submit"
          className="bg-ink text-white text-[11px] font-semibold tracking-label uppercase px-5 py-3 rounded-sm hover:bg-ink-80 transition-colors"
        >
          Đăng ký
        </button>
      </form>
      <p className="mt-3 text-[11px] text-subtle">Không spam. Hủy đăng ký bất cứ lúc nào.</p>
    </div>
  )
}
