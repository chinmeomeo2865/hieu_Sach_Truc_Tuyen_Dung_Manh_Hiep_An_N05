# Aesthetic Guidelines

Phong cách: **tối giản editorial** — giống tạp chí cao cấp, không phải app thương mại rẻ.

## Nguyên tắc cốt lõi
- Nhiều whitespace — `py-16`, `gap-8` là mức tối thiểu cho section
- Typography làm chủ — Playfair Display cho heading, tên sách, quote
- Ảnh đặt trước text trong card
- Không dùng màu đậm, gradient rườm rà, shadow nặng

## Typography
- Heading / tên sách / quote: `font-display` (Playfair Display)
- Body / label / button: `font-sans` (Inter, default)
- Eyebrow text: `text-2xs font-semibold tracking-label-2xl uppercase text-accent`
- Section title: `font-display font-semibold text-2xl md:text-3xl text-ink`

## Buttons
- Ưu tiên `btn-outline` (border) hơn `btn-primary` (filled)
- `btn-primary` chỉ dùng cho CTA chính duy nhất trong view
- Không dùng border-radius lớn — dùng `rounded-sm` (4px) cho button

## Cards
- Card mặc định không có shadow — chỉ có `border border-divider-lt`
- Hover: `hover:-translate-y-1 hover:shadow-card-h hover:border-divider`
- Image hover: `scale(1.04–1.05)` + `opacity(.9)`, không thêm gì khác
- Quick-add bar slide từ dưới lên: `translate-y-full` → `translate-y-0` on hover

## Animations
- Fade-up scroll reveal: `opacity-0 translate-y-5` → `opacity-100 translate-y-0`, `duration-700`
- Không loop lại sau khi đã visible
- Transition thông thường: `duration-300` hoặc `duration-200`
- Không dùng bounce, spin, pulse cho UI chính

## Dark sections (bg-ink)
- Tất cả text là `text-white` — không dùng opacity thấp
- Hover link: `hover:opacity-70` thay vì dùng màu khác
- Social icon border: `border-white/30`, icon: `text-white`

## Spacing system
- Section padding: `py-16 md:py-24`
- Container: `max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10`
- Card gap: `gap-4 md:gap-5`
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

## Không làm
- Không dùng shadow đậm mặc định
- Không dùng border-radius > 12px (trừ pill = 9999px)
- Không dùng màu primary (blue/green/purple) của Tailwind
- Không dùng alert dialog — dùng toast
- Không thêm animation khi user không hover/scroll
