# UI Components

## Cấu trúc thư mục components
```
src/components/
  ui/        — primitive reusable: Badge, Button, BookCard, StarRating, icons…
  layout/    — Navbar, MobileMenu, Footer, AnnouncementBar
  sections/  — Hero, TrustBar, FeaturedBooks, NewArrivals, Categories, Blog, Quote, About, Newsletter
src/pages/
  Home.jsx   — data coordinator: import từ data/, pass props xuống sections
```

## Data flow — quan trọng
- **Sections không tự import data.** Data được import ở `Home.jsx` rồi pass xuống qua props.
- **`data/books.js`** — BESTSELLERS, NEW_ARRIVALS, FILTER_TABS, ALL_BOOKS
- **`data/categories.js`** — CATEGORIES
- **`data/blog.js`** — BLOG_POSTS
- **`data/site.js`** — NAV_LINKS, NAV_CATEGORIES, HERO_STATS, HERO_IMAGES, TRUST_ITEMS, ABOUT_HOURS, FOOTER_COLUMNS, ANNOUNCEMENT_MESSAGE

## BookCard
- Click card (ngoài button) → `openQuickView(book)` từ uiStore
- Click `+` hoặc quick-add bar → `addItem(book)` + toast success
- Click ❤ → `toggle(book.id)` + toast
- Dùng `e.stopPropagation()` trên mọi button bên trong card

## Zustand stores
| Store | Import từ |
|---|---|
| `useCartStore` | `store/cartStore` |
| `useWishlistStore` | `store/wishlistStore` |
| `useToastStore` | `store/toastStore` |
| `useUIStore` | `store/uiStore` |

### uiStore selectors hay dùng
```js
const openQuickView  = useUIStore(s => s.openQuickView)
const openSearch     = useUIStore(s => s.openSearch)
const setCategory    = useUIStore(s => s.setCategory)
const activeCategory = useUIStore(s => s.activeCategory)
```

## Global overlays — mount một lần duy nhất trong App.jsx
- `<SearchModal />`
- `<QuickViewModal />`
- `<ToastContainer />`

## Toast
```js
const showToast = useToastStore(s => s.show)
showToast({ message: '...', type: 'success' | 'error' | 'info' })
```
- Auto-dismiss sau 3.5s
- Exit animation `.toast-out` defined in `index.css`

## SectionHeader — dùng cho mọi section
```jsx
<SectionHeader
  eyebrow="Bán chạy nhất"
  title="Bestsellers"
  subtitle="..."
  linkText="Xem tất cả"
  linkHref="#"
/>
```

## Scroll reveal
```js
const { ref, visible } = useScrollReveal()
<div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
```
Không loop lại sau khi đã vào viewport.

## Category filter
`uiStore.activeCategory` — shared state giữa FeaturedBooks và CategoryCard. Click category card → `setCategory(slug)` + scroll to `#books`.
