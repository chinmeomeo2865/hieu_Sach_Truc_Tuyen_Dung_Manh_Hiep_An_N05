# Hiệu Sách Chin — CLAUDE.md

## Tổng quan dự án

Website bán sách trực tuyến tên **Hiệu Sách Chin**. Thiết kế theo phong cách tối giản, editorial, lấy cảm hứng từ "Cup of Couple" — màu trung tính (kem, trắng, xám nhạt), typography thanh lịch, layout dạng lưới, nhiều whitespace.

---

## Trạng thái hiện tại (cập nhật 2026-05-16)

### ✅ Hoàn thành

| Phần | Mô tả |
|---|---|
| `index.html` | Prototype tĩnh UI/UX đầy đủ — dùng làm tài liệu thiết kế tham khảo, **không chỉnh sửa** |
| React frontend (`src/`) | Trang chủ hoàn chỉnh: 11 sections, 6 tính năng ecommerce, responsive |
| Express backend (`backend/`) | API đầy đủ: auth, products, cart, orders — JWT + MongoDB |
| `.claude/rules/` | 8 file rules tách từ CLAUDE.md theo Claude Code spec |

### 🔲 Chưa làm (bước tiếp theo)

1. **Kết nối frontend ↔ backend** — thay static data trong `src/data/` bằng API calls
   - `useProducts()` hook gọi `GET /api/products`
   - Cart sync với `POST /api/cart/items` (hiện chỉ Zustand local)
   - Auth flow: login form → `POST /api/auth/login` → lưu JWT
2. **Trang `/cart`** — hiển thị giỏ, sửa qty, xóa item
3. **Trang `/checkout`** — địa chỉ, áp coupon, chọn thanh toán (COD trước, VNPay sau)
4. **Trang `/auth/login` + `/auth/register`** — form + validation
5. **Trang `/account/orders`** — lịch sử đơn của khách
6. **Trang `/books`** — danh sách đầy đủ với filter/sort/search, pagination
7. **Trang `/books/:id`** — chi tiết sách + reviews
8. **Admin panel** — `/admin/dashboard`, quản lý products, orders
9. **Migration sang Next.js** — dài hạn, sau khi tất cả tính năng ổn định

---

## Quyết định kiến trúc quan trọng

### 1. Dùng React+Vite thay vì nhảy thẳng lên Next.js
**Lý do:** Tập trung hoàn thiện UI/UX và business logic trước. Next.js thêm phức tạp (SSR, App Router, server actions) không cần thiết ở giai đoạn prototype → production MVP. Migrate sau khi tính năng ổn định.

### 2. MongoDB thay vì PostgreSQL cho giai đoạn hiện tại
**Lý do:** Setup đơn giản hơn, schema linh hoạt khi còn đang thay đổi data model. Migration sang PostgreSQL/Prisma (như kế hoạch dài hạn) sẽ làm khi chuyển Next.js.

### 3. JWT thay vì Supabase Auth
**Lý do:** Giai đoạn hiện tại không cần Supabase. JWT đơn giản, self-contained, không phụ thuộc dịch vụ bên ngoài. Supabase Auth sẽ thay thế khi migrate Next.js.

### 4. Zustand thay vì Context API
**Lý do:** Không cần Provider boilerplate, reactive selector theo từng field (không re-render toàn component), persist middleware sẵn có. 4 stores: `cartStore`, `wishlistStore`, `toastStore`, `uiStore`.

### 5. Data flow: chỉ `Home.jsx` import từ `data/`
**Lý do:** Sections nhận data qua props — tách biệt data source khỏi presentation. Khi chuyển sang API calls, chỉ cần sửa `Home.jsx`, không đụng vào các section component.

### 6. bulkWrite với điều kiện stock cho order creation
**Lý do:** Tránh race condition khi nhiều user mua cùng lúc. `bulkWrite` với `{ stock: { $gte: qty } }` là atomic — nếu bất kỳ item nào hết hàng giữa chừng, toàn bộ operation fail và không trừ stock nào.

### 7. Cart Zustand (local) tách biệt khỏi Cart API (backend)
**Lý do:** UI phản hồi ngay lập tức mà không cần chờ API. Khi kết nối backend, cart Zustand sẽ là "optimistic local state", sync với server khi user đăng nhập.

---

## Thông tin liên hệ

| | |
|---|---|
| **Tên** | Hiệu Sách Chin |
| **Địa chỉ** | Đường Nguyễn Trác, Phường Yên Nghĩa, Quận Hà Đông, Hà Nội |
| **Điện thoại** | 0383 687 670 |
| **Email** | 23011987@st.phenikaa-uni.edu.vn |
| **Giờ mở cửa** | T2–T6: 08:00–21:00 · T7–CN: 09:00–22:00 |
| **Mạng xã hội** | Facebook · Instagram · TikTok |

---

## Tech stack hiện tại

### Frontend (`src/`) — React + Vite
- **Framework:** React 18 + Vite (ESM, JSX — chưa dùng TypeScript)
- **Styling:** Tailwind CSS v3, custom design tokens trong `tailwind.config.js`
- **Fonts:** Playfair Display + Inter (Google Fonts)
- **State:** Zustand v5 — 4 stores với `persist` middleware
- **Build:** `npm run dev` → port 5173

### Backend (`backend/`) — Express + MongoDB
- **Runtime:** Node.js + Express (CommonJS)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator ở route level
- **Security:** helmet, cors, express-rate-limit (100 req/15min)
- **Run:** `npm run dev` → port 5000

### Kế hoạch dài hạn (Next.js full-stack)
- Next.js 14 App Router + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Prisma ORM, Payments: VNPay + COD, Email: Resend

---

## Cấu trúc thư mục hiện tại

```
hiệu sách/
  index.html              — prototype tĩnh (tham khảo design, không sửa)
  tailwind.config.js      — design tokens: ink, muted, divider, accent, star…
  src/
    App.jsx               — global layout + 3 overlay mount points
    main.jsx
    index.css             — toast animations, base styles
    pages/
      Home.jsx            — data coordinator (duy nhất import từ data/)
    components/
      layout/             — AnnouncementBar, Navbar, MobileMenu, Footer
      sections/           — Hero, TrustBar, FeaturedBooks, NewArrivals,
                            Categories, Blog, Quote, About, Newsletter, Bestsellers
      ui/                 — BookCard, FeaturedCard, CategoryCard, BlogCard,
                            Badge, Button, StarRating, SectionHeader, icons,
                            SearchModal, QuickViewModal, Toast, ToastContainer
    data/
      books.js            — BESTSELLERS, NEW_ARRIVALS, FILTER_TABS, ALL_BOOKS
      categories.js       — CATEGORIES
      blog.js             — BLOG_POSTS
      site.js             — NAV_LINKS, NAV_CATEGORIES, HERO_STATS, HERO_IMAGES,
                            TRUST_ITEMS, ABOUT_HOURS, FOOTER_COLUMNS, ANNOUNCEMENT_MESSAGE
    store/
      cartStore.js        — items[], addItem, removeItem, clear (persist)
      wishlistStore.js    — ids[], toggle (persist)
      toastStore.js       — toasts[], show, dismiss
      uiStore.js          — quickViewBook, searchOpen, activeCategory
    hooks/
      useScrollReveal.js  — IntersectionObserver, threshold 0.06
      useNavbar.js        — scroll shadow
    utils/
      format.js           — formatPrice(amount) → Intl VND
  backend/
    server.js             — entry point
    src/
      app.js              — Express setup, middleware, routes
      config/db.js        — Mongoose connect
      models/             — User, Product, Cart, Order
      middleware/
        auth.js           — protect (JWT), authorize(...roles)
        error.js          — centralized error handler
      controllers/        — auth, product, cart, order
      routes/             — auth, products, cart, orders
      seed.js             — 12 sách + admin account
  .claude/rules/          — 8 file rules (xem từng file)
```

---

## Authentication system

### Middleware
```js
// protect: verify JWT → attach req.user
const protect = async (req, res, next) => { ... }

// authorize: kiểm tra role
const authorize = (...roles) => (req, res, next) => { ... }
```

### User schema
```js
{ name, email, password (hashed, select:false), role, phone, addresses[], active, timestamps }
role: 'customer' | 'admin' | 'product_manager' | 'warehouse'
```

- Password: bcrypt hash (rounds=12) trong pre-save hook
- `select: false` trên field password — không bao giờ trả về trong query
- `toJSON()` override: xóa password trước khi serialize
- `comparePassword(candidate)` method trên schema

### Token
```
Header: Authorization: Bearer <token>
Payload: { id: user._id }
Expire: JWT_EXPIRE (mặc định 7d)
```

---

## Database schemas (MongoDB/Mongoose)

### Product
```js
{ title, author, price, originalPrice?, category, categorySlug,
  description, image, stock (min:0), visible (default:true),
  badge ('best'|'new'|'sale'|null), rating, reviewCount, featured, timestamps }
```
Index: text search `{title,author,category}`, `{categorySlug:1}`, `{visible:1, createdAt:-1}`

### Cart
```js
{ user (ref, unique), items:[{product(ref), qty, price(snapshot)}], timestamps }
virtual: total, totalItems
```
Một user = đúng một cart document.

### Order
```js
{ user(ref), items:[{product(ref), title, author, image, qty, price}],
  status, payment, address:{name,phone,street,city},
  total, discount, couponCode, note,
  statusHistory:[{status,changedAt,changedBy}], timestamps }
status: PENDING→CONFIRMED→PACKING→SHIPPING→DELIVERED | CANCELLED | RETURNED
payment: ONLINE | COD
```

### Stock safety (createOrder)
```js
const bulkOps = items.map(item => ({
  updateOne: {
    filter: { _id: item.product._id, stock: { $gte: item.qty } },
    update: { $inc: { stock: -item.qty } }
  }
}))
const result = await Product.bulkWrite(bulkOps)
if (result.modifiedCount !== items.length) // rollback hoặc báo lỗi
```

---

## API Endpoints tóm tắt

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me          [auth]
PUT    /api/auth/me          [auth]
PUT    /api/auth/password    [auth]

GET    /api/products         ?search ?category ?sort ?page ?limit
GET    /api/products/:id
POST   /api/products         [pm/admin]
PUT    /api/products/:id     [pm/admin]
DELETE /api/products/:id     [admin]   soft delete (visible:false)
PUT    /api/products/:id/stock [warehouse]

GET    /api/cart             [auth]
POST   /api/cart/items       [auth]   {productId, qty}
PUT    /api/cart/items/:pid  [auth]   qty=0 → xóa
DELETE /api/cart/items/:pid  [auth]
DELETE /api/cart             [auth]

GET    /api/orders           [auth]
POST   /api/orders           [auth]
GET    /api/orders/:id       [auth]
PUT    /api/orders/:id/cancel [auth]
PUT    /api/orders/:id/status [warehouse/admin]
GET    /api/orders/admin/all  [admin]
```

Response format: `{ success: true, data: ... }` / `{ success: false, message: '...' }`

---

## Zustand stores

```js
// cartStore — persist localStorage key 'chin-cart'
{ items[], addItem(book), removeItem(id), clear() }

// wishlistStore — persist localStorage key 'chin-wishlist'
{ ids[], toggle(id) }

// toastStore — auto-dismiss 3.5s, max 4 toasts
{ toasts[], show({message, type, duration}), dismiss(id) }

// uiStore
{ quickViewBook, openQuickView(book), closeQuickView(),
  searchOpen, openSearch(), closeSearch(),
  activeCategory, setCategory(slug) }
```

---

## Design System

Chi tiết đầy đủ trong `.claude/rules/design-tokens.md` và `.claude/rules/aesthetic-guidelines.md`.

### Màu chính
| Token | Hex | Dùng cho |
|---|---|---|
| `ink` | `#1a1714` | Text chính, nút primary, nền dark |
| `muted` | `#78716c` | Author, placeholder |
| `subtle` | `#a8a29e` | Meta text |
| `divider-lt` | `#e2ddd8` | Border card |
| `surface-warm` | `#faf8f5` | Background ấm |
| `accent` | `#b45309` | Category label, badge New |
| `star` | `#d97706` | Star rating |

### Typography
- `font-display` — Playfair Display: heading, tên sách, quote
- `font-sans` — Inter: body, label, button

---

## Actors & Roles

| Role | Quyền chính |
|---|---|
| `customer` | Mua hàng, quản lý đơn cá nhân, review |
| `admin` | Toàn quyền, báo cáo, quản lý tài khoản |
| `product_manager` | CRUD sách, danh mục, khuyến mãi |
| `warehouse` | Tồn kho, xử lý đơn, cập nhật vận chuyển |

---

## Môi trường

```env
# Frontend — Vite, port 5173
# (chưa cần .env vì chưa kết nối API)

# backend/.env (không commit)
PORT=5000
MONGO_URI=mongodb://localhost:27017/hieu-sach-chin
JWT_SECRET=...  # đổi trong production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Seed data: `cd backend && npm run seed` → 12 sách + admin account (`admin@hieuSach.com` / `Admin123!`)

---

## Data models dài hạn (PostgreSQL/Prisma — khi migrate Next.js)

Models: User, Book, Category, Order, OrderItem, Review, Coupon  
Enums: Role, OrderStatus, PaymentMethod, CouponType  
Auth: Supabase Auth (email/password + Google OAuth)  
Storage: Supabase Storage bucket `book-covers`  
Slug sách: title → kebab-case + uuid suffix  

Chi tiết schema Prisma giữ trong lịch sử git / tài liệu riêng khi cần.
