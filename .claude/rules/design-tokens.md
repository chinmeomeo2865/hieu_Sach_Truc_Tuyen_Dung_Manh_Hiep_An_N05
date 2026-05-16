# Design Tokens

Tất cả màu sắc, typography, spacing đều có trong `tailwind.config.js`. Dùng Tailwind classes, không hardcode hex.

## Màu sắc (Tailwind custom colors)
| Token | Hex | Dùng cho |
|---|---|---|
| `ink` | `#1a1714` | Text chính, nút primary, nền dark |
| `ink-80` | `#3d3835` | Hover state của ink |
| `ink-60` | `#57534e` | Text thứ cấp |
| `muted` | `#78716c` | Author, placeholder, nav links |
| `subtle` | `#a8a29e` | Meta text, date, count |
| `divider` | `#ccc7c1` | Border chính |
| `divider-lt` | `#e2ddd8` | Border nhẹ, separator |
| `surface-warm` | `#faf8f5` | Background ấm (hero, newsletter) |
| `surface-subtle` | `#f0ece7` | Background nhẹ (image placeholder) |
| `accent` | `#b45309` | Category label, badge New, eyebrow text |
| `star` | `#d97706` | Star rating |

## Typography
- `font-display` → Playfair Display (serif) — dùng cho heading, tên sách, quote
- `font-sans` → Inter (default) — dùng cho body, label, button

### Font size custom
- `text-2xs` = 0.625rem (10px) — label, eyebrow, badge

### Letter spacing custom
| Class | Value | Dùng cho |
|---|---|---|
| `tracking-label` | 0.12em | Button text, nav links |
| `tracking-label-md` | 0.14em | Uppercase labels |
| `tracking-label-lg` | 0.16em | Category chips, footer heading |
| `tracking-label-xl` | 0.18em | Mobile menu section labels |
| `tracking-label-2xl` | 0.20em | Hero eyebrow, section eyebrow |

## Shadows
| Class | Dùng cho |
|---|---|
| `shadow-card` | Card mặc định |
| `shadow-card-h` | Card hover state |
| `shadow-nav` | Navbar sau khi scroll |
| `shadow-md` | Button hover, modal |

## Aspect ratios
- `aspect-book` = 3/4 — book card image
- `aspect-card` = 4/3 — category card, blog image

## Dark background (bg-ink)
Khi nền là `bg-ink`, tất cả text phải là `text-white`. Không dùng `text-white/xx` opacity thấp (<50).
