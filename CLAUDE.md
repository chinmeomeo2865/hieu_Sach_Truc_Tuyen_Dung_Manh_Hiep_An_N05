# Hiệu Sách Chin — CLAUDE.md

Website bán sách trực tuyến, thiết kế tối giản editorial (cảm hứng "Cup of Couple") — màu trung tính, typography thanh lịch, nhiều whitespace. Monorepo: `frontend/` (React + Vite) + `backend/` (Express + MongoDB).

**Tài liệu chi tiết — đọc khi cần, không nhét vào đây:**
- [docs/architecture-decisions.md](docs/architecture-decisions.md) — toàn bộ quyết định kiến trúc & lý do
- [docs/api-reference.md](docs/api-reference.md) — bảng API endpoints đầy đủ
- [docs/data-models.md](docs/data-models.md) — schemas 13 models Mongoose
- `.claude/rules/` — design tokens, aesthetic, coding conventions (tự động load)
- `plan/` — các bản kế hoạch thiết kế cũ (tham khảo lịch sử; prototype tĩnh gốc đã bị xóa khi tái cấu trúc monorepo)

---

## Lệnh thường dùng

```bash
npm run dev              # chạy cả frontend (5173) + backend (3001) bằng concurrently — từ root
npm run dev:frontend     # chỉ frontend
npm run dev:backend      # chỉ backend
npm run build            # build frontend (vite build)

cd backend
npm run seed             # 57 sách + admin admin@hieusachchin.vn / admin123456
npm run seed:articles    # 6 bài viết (upsert theo title, không tạo trùng)
npm run migrate          # migrate production
```

- **Backend chạy port 3001** (set trong `backend/.env`; macOS AirPlay chiếm port 5000).
- Frontend đọc `VITE_API_URL` từ `frontend/.env.local`.

## Cấu trúc thư mục (mức thư mục)

```
hiệu sách/
  package.json            — monorepo scripts (concurrently)
  vercel.json             — installCommand/buildCommand --prefix frontend, outputDirectory frontend/dist
  frontend/
    src/
      App.jsx             — BrowserRouter + toàn bộ routes + MainLayout + global modals
      pages/              — Home, BooksPage, BookDetailPage, CartPage, CheckoutPage, BlogPage,
                            BlogDetailPage, NotificationsPage, PaymentResultPage, LoginPage, RegisterPage…
        account/          — AccountPage (hub), ProfilePage, AddressesPage, OrdersPage, WishlistPage
        admin/            — 8 trang: Analytics, Orders, Products, Users, Accounts, Settings, Reviews, Articles
        pm/               — 6 trang: Dashboard, Categories, Products, Visibility, Promotions, Activity
        warehouse/        — 6 trang: Dashboard, Orders, Inventory, Audit, Returns, Activity
      components/
        layout/           — AnnouncementBar, Navbar, MobileMenu, Footer, AccountLayout
        sections/         — Hero, FeaturedBooks, Bestsellers, Categories, Blog, CustomerReviews…
        ui/               — BookCard, SearchModal, QuickViewModal, AuthPromptModal, SupportModal, Toast…
        admin|pm|warehouse/ — Layout + Route guard cho từng portal
      data/               — books.js, categories.js, blog.js, site.js (fallback/static data)
      store/              — 5 Zustand stores: auth, cart, wishlist, toast, ui
      services/api.js     — fetch wrapper, auto-inject JWT từ localStorage['chin-token']
      hooks/              — useProducts, useScrollReveal, useNavbar
  backend/
    server.js             — entry: connectDB → startAutoCancelJob (cron) → listen
    src/
      app.js              — Express setup, CORS (*.vercel.app + localhost), rate-limit 500/15min, trust proxy
      models/             — 13 models: User, Product, Cart, Order, Review, Settings, Article, Notification,
                            Coupon, Promotion, Category, InventoryTransaction, ActivityLog
      controllers/        — auth, product, cart, order, user, review, analytics, settings, article,
                            notification, payment, coupon, pm, warehouse
      routes/             — mount tại /api/* (xem docs/api-reference.md)
      middleware/auth.js  — protect (JWT), authorize(...roles)
      services/           — emailService (Resend), cronService (auto-cancel đơn online quá hạn)
      uploads/covers/     — ảnh bìa upload local (⚠️ mất khi Render redeploy)
```

## Tech stack

| | |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS v3 (tokens trong `frontend/tailwind.config.js`), Zustand v5, React Router DOM v7, framer-motion, recharts. JSX, chưa dùng TypeScript |
| Backend | Node.js ≥20 + Express (CommonJS), Mongoose 8, JWT + bcryptjs, express-validator, helmet, multer, @payos/node v2, resend |
| Fonts | Playfair Display (`font-display` — heading/tên sách/quote) + Inter (`font-sans` — body) |
| DB | MongoDB Atlas — cluster `hieu-sach-chin.wylfq2r.mongodb.net` |

## Roles & phân quyền

| Role | Quyền chính | Portal |
|---|---|---|
| `customer` | Mua hàng, đơn cá nhân, review (chỉ sau DELIVERED), wishlist, địa chỉ | `/account` |
| `admin` | Toàn quyền: analytics, users, tài khoản nội bộ, settings, reviews, articles | `/admin/*` |
| `product_manager` | CRUD sách, danh mục, khuyến mãi, ẩn/hiện sách | `/pm/*` |
| `warehouse` | Tồn kho, nhập kho, kiểm kho, xử lý đơn, hàng hoàn | `/warehouse/*` |

- **Đăng nhập hợp nhất tại `/auth/login`** — không còn trang login riêng cho từng portal. Sau login redirect theo role: warehouse → `/warehouse`, PM → `/pm`, admin → `/admin/analytics`, customer → trang trước đó (`state.from`).
- Route guards: `AdminRoute`, `PMRoute`, `WarehouseRoute` kiểm tra token + role.

## Luồng trạng thái đơn hàng

```
PENDING → CONFIRMED → PACKING → SHIPPING → DELIVERED | CANCELLED | RETURNED
```

- **Admin chỉ được set `CONFIRMED` / `CANCELLED`** (xác nhận hoặc hủy từ PENDING).
- **Warehouse xử lý `PACKING` → `SHIPPING` → `DELIVERED` / `CANCELLED` / `RETURNED`** — logic trong `orderController.updateStatus`.
- `payment: ONLINE | COD`, `paymentStatus: UNPAID | PAID | REFUNDED`.
- **Cron auto-cancel** (`cronService.js`, chạy mỗi 5 phút): đơn `ONLINE + PENDING + UNPAID` quá 20 phút → CANCELLED + hoàn stock + notification + email.
- `orderCode` format `DSC-YYMMDD-XXXX` (4 ký tự random, bỏ ký tự dễ nhầm) — đơn cũ không có thì UI fallback 8 ký tự cuối `_id`.
- Hủy/hoàn đơn luôn hoàn stock; mỗi lần đổi trạng thái push vào `statusHistory[]` (dùng làm timeline tracking).

## Quy ước bắt buộc

**API response:** `{ success: true, data }` / `{ success: false, message }` / pagination `{ page, limit, total, totalPages }`. HTTP codes đúng chuẩn (400 validation, 401 auth, 403 permission, 404).

**Zustand:** đọc bằng reactive selector (`useStore(s => s.field)`), không subscribe toàn store, không dùng getter `isAuthenticated` — dùng `s => !!s.token`.

**`book._id || book.id`** cho mọi thao tác cart/wishlist — sách từ API có `_id`, sách static có `id`. Dùng sai → bug tất cả books share cùng key.

**Stock safety:** `createOrder` dùng `Product.bulkWrite` với filter `{ stock: { $gte: qty } }` — atomic, tránh race condition.

**Fire-and-forget:** notification + email là side-effect — catch lỗi bên trong, không bao giờ làm fail request chính.

**Trim mọi credentials đọc từ `process.env`** — newline thừa khi paste vào Render làm sai HMAC PayOS.

**Guest redirect:** điều hướng guest về login luôn dùng `replace: true` + `state.from`; mọi trang auth-required phải có đường quay lại. Wishlist/giỏ hàng khi guest → `openAuthPrompt()` (modal toàn cục), không navigate thẳng.

**Danh mục 3 nguồn đồng bộ:** khi thêm category mới phải cập nhật cả `CATEGORIES`, `FILTER_TABS`, `NAV_CATEGORIES` trong `frontend/src/data/`.

**Data flow:** sections không tự import từ `data/` — chỉ `Home.jsx` import rồi pass props.

Chi tiết và lý do từng quyết định: [docs/architecture-decisions.md](docs/architecture-decisions.md).

## Môi trường

```env
# frontend/.env.local (không commit)
VITE_API_URL=http://localhost:3001

# backend/.env (không commit — xem backend/.env.example)
PORT=3001
MONGO_URI=mongodb+srv://...@hieu-sach-chin.wylfq2r.mongodb.net/hieu-sach-chin?...
JWT_SECRET=...
JWT_EXPIRE=7d
CLIENT_URL=https://hieu-sach-truc-tuyen-dung-manh-hiep.vercel.app

# Tùy chọn — graceful degrade nếu thiếu
RESEND_API_KEY=re_...          # email xác nhận + cập nhật trạng thái đơn
PAYOS_CLIENT_ID=...            # PayOS online payment (đã active)
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
```

## Deploy & lưu ý production

| Service | URL | Ghi chú |
|---|---|---|
| Frontend | https://hieu-sach-truc-tuyen-dung-manh-hiep.vercel.app | Vercel, auto-deploy từ main |
| Backend | https://hieu-sach-api.onrender.com | Render free tier — sleep sau 15 phút idle, cold start ~30-50s |
| DB | MongoDB Atlas M0 | Singapore |

- **Atlas Network Access phải whitelist `0.0.0.0/0`** — Render free tier đổi IP mỗi lần restart.
- `app.set('trust proxy', 1)` bắt buộc trên Render để express-rate-limit hoạt động.
- Upload ảnh lưu local `uploads/covers/` — **mất khi Render redeploy**, cần migrate Cloudinary/S3 trước production thực sự.
- `vercel.json` không dùng `framework` preset (React Router v7 làm Vercel detect sai, không inject `VITE_API_URL`).

## Cập nhật ngày 14/06/2026

### Backend
- **Product Model mở rộng** — thêm `isbn`, `publisher`, `pages`, `coverType`, `images[]`, `status` (draft/active/archived), `inStock` (auto-sync qua pre-save hook), `weight` (trọng số hiển thị, mặc định 0). Tối ưu index `{ inStock: -1, status: 1 }`, `{ visible: 1, createdAt: -1 }`.
- **API sắp xếp thông minh** — Sắp xếp mặc định: `inStock → weight → createdAt`. Khi khách hàng chọn bộ lọc (giá, đánh giá…) thì bỏ qua weight, sắp xếp thuần theo tiêu chí đã chọn.
- **Banner trang chủ động** — `settingsController.getPublicSettings` trả về `banners[]` active. Cấp quyền PM truy cập Settings route.
- **Sửa lỗi double-replenishment** — Gỡ bỏ logic tự động cộng lại tồn kho khi customer hủy đơn tại `orderController.cancelOrder`. Thủ kho quyết định hoàn/xuất kho. Cron auto-cancel đơn quá hạn gán `returnProcessed = true` để không xuất hiện trong hàng đợi xử lý hoàn trả.
- **Bộ lọc ngày Nhật ký hoạt động (Date Filter)** — Nhận thêm query parameters `startDate` và `endDate`, tối ưu hóa truy vấn `$gte` / `$lte` theo trường `createdAt` (sử dụng index có sẵn).

### Frontend
- **Tồn kho thông minh trên UI** — Nhãn 3 trạng thái (Còn hàng / Chỉ còn X cuốn / Hết hàng) trên BookCard, FeaturedCard, SearchModal, QuickViewModal, BookDetailPage, Bestsellers. Khóa nút mua khi hết hàng.
- **Giỏ hàng nâng cấp toàn diện** — Thanh freeship động, gợi ý sách (lọc trùng giỏ hàng), mua một phần giỏ hàng (checkbox từng sản phẩm + chọn tất cả), chọn nhanh mã giảm giá (CouponBox).
- **ConfirmModal thiết kế riêng** — Thay thế toàn bộ `window.confirm` xấu bằng modal vintage premium (framer-motion, loading state) ở OrdersPage, WishlistPage, AddressesPage, AccountPage.
- **PM Settings (Banner)** — Trang mới cho PM quản lý banner trang chủ (thêm/bật/tắt/xóa).
- **Trang Khuyến mãi Vintage** — Redesign OffersPage với thẻ voucher đục lỗ, icon SVG riêng từng loại.
- **Yêu thích auto-cleanup** — Tự động loại bỏ sách đã bị xóa khỏi DB ra khỏi wishlist store.
- **Fix Navbar overlay z-index** — Hạ z-index header wrapper từ `z-[100]` → `z-30` để các modal chi tiết đơn hàng (z-50) không bị che khuất.
- **Trọng số hiển thị (Display Weight)** — Thêm ô nhập `weight` trên form PM + Admin Products, cho phép đẩy sách lên đầu trang.
- **Bộ lọc ngày thao tác Thủ kho** — Thêm Dropdown bộ lọc nhanh kết hợp với ô chọn ngày tùy biến (với hiệu ứng `animate-fadeIn` mượt mà), giúp thủ kho dễ dàng đối soát ca trực và sai lệch tồn kho.

## Việc còn lại

| Ưu tiên | Việc |
|---|---|
| 🟡 | Activate Resend (verify domain, lấy API key) |
| 🟡 | Test PayOS E2E đầy đủ (cả flow hủy) + test 4 role trên production |
| 🟡 | Quyết định số phận trang `/support` (SupportModal đã thay thế) |
| 🟢 | Migrate upload ảnh sang Cloudinary/S3 |
| ⬜ | Dài hạn: migrate Next.js + PostgreSQL/Prisma + Supabase (sau khi tính năng ổn định) |

## Thông tin cửa hàng

Đường Nguyễn Trác, P. Yên Nghĩa, Q. Hà Đông, Hà Nội · 0383 687 670 · 23011987@st.phenikaa-uni.edu.vn · T2–T6 08:00–21:00, T7–CN 09:00–22:00. (Nội dung hiển thị nằm trong `frontend/src/data/site.js`.)
