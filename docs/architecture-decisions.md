# Quyết định kiến trúc — Hiệu Sách Chin

Tài liệu ghi lại các quyết định kiến trúc quan trọng và **lý do**, để tránh lặp lại sai lầm cũ hoặc revert nhầm. Gom theo chủ đề. Cập nhật lần cuối: 2026-06-12.

---

## Nền tảng & cấu trúc

### Monorepo `frontend/` + `backend/` thay vì src/ ở root
Tái cấu trúc (commit `75410c7`) để tách rõ 2 ứng dụng. Root `package.json` chạy cả hai bằng `concurrently`. `vercel.json` ở root dùng `--prefix frontend` cho install/build, `outputDirectory: frontend/dist`.

### React + Vite thay vì nhảy thẳng lên Next.js
Tập trung hoàn thiện UI/UX và business logic trước. Next.js thêm phức tạp (SSR, App Router) không cần thiết ở giai đoạn MVP. Migrate sau khi tính năng ổn định — kế hoạch dài hạn: Next.js 14 + TypeScript + Supabase (PostgreSQL/Auth/Storage) + Prisma.

### MongoDB thay vì PostgreSQL
Setup đơn giản, schema linh hoạt khi data model còn thay đổi. Migration sang PostgreSQL/Prisma làm cùng lúc với Next.js.

### JWT thay vì Supabase Auth
JWT đơn giản, self-contained, không phụ thuộc dịch vụ ngoài. Supabase Auth sẽ thay khi migrate Next.js.

### Zustand thay vì Context API / Redux
Không cần Provider boilerplate, reactive selector theo field (không re-render toàn component), persist middleware sẵn. 5 stores: `authStore`, `cartStore`, `wishlistStore`, `toastStore`, `uiStore`.

### Backend port 3001 thay vì 5000
macOS AirPlay Receiver chiếm port 5000. `server.js` default 5000 nhưng `backend/.env` set `PORT=3001`.

### Vercel deploy: `buildCommand` trực tiếp, không dùng `framework` preset
React Router DOM v7 khiến Vercel auto-detect sai framework, không inject `VITE_API_URL` vào Vite build.

### CORS cho phép `*.vercel.app` thay vì hardcode URL
Vercel tạo domain mới mỗi lần project được tạo lại. Dùng `origin.endsWith('.vercel.app')` tránh update CORS mỗi lần đổi domain.

### `app.set('trust proxy', 1)`
Bắt buộc trên Render (reverse proxy) để `express-rate-limit` xác định IP đúng, tránh ValidationError liên tục.

---

## Data & backend

### Cart Zustand (local) tách biệt khỏi Cart API (backend)
UI phản hồi ngay không chờ API — cart Zustand là "optimistic local state", sync với server khi checkout (tạo cart entry backend trước khi POST /api/orders). `addItem` lưu thêm `book.stock ?? 999` để cap qty và hiển thị "Đã hết hàng"; `updateQty` tự cap tại `item.stock`.

### bulkWrite với điều kiện stock cho createOrder
Tránh race condition khi nhiều user mua cùng lúc. `bulkWrite` với filter `{ stock: { $gte: qty } }` là atomic — nếu bất kỳ item nào hết hàng giữa chừng, operation fail, không trừ stock nào.

```js
const bulkOps = items.map(item => ({
  updateOne: {
    filter: { _id: item.product._id, stock: { $gte: item.qty } },
    update: { $inc: { stock: -item.qty } }
  }
}))
const result = await Product.bulkWrite(bulkOps)
if (result.modifiedCount !== items.length) // rollback / báo lỗi
```

### Order timeline dùng `statusHistory[]` từ Order model
Order lưu `statusHistory:[{status, changedAt, changedBy}]` mỗi lần đổi trạng thái — dùng luôn làm timeline tracking, không tạo bảng riêng. Đơn cũ không có history → fallback `createdAt` cho bước đầu.

### `orderCode` thân thiện `DSC-YYMMDD-XXXX`
Thay mã băm `_id` MongoDB bằng mã chứa ngày đặt + 4 ký tự random (charset bỏ `0/O/1/I/L` dễ nhầm), retry tối đa 5 lần nếu trùng. Đơn cũ không có `orderCode` → UI fallback 8 ký tự cuối `_id`. Field `unique: true, sparse: true`.

### Phân quyền cập nhật trạng thái đơn theo role
Admin chỉ được `CONFIRMED`/`CANCELLED`; warehouse xử lý `PACKING`/`SHIPPING`/`DELIVERED`/`CANCELLED`/`RETURNED`. Check trong `orderController.updateStatus`, trả 403 kèm message rõ ràng. Route vẫn `authorize('warehouse', 'admin')`.

### Cron auto-cancel đơn online chưa thanh toán
`cronService.startAutoCancelJob()` — `setInterval` 5 phút, tìm đơn `ONLINE + PENDING + paymentStatus UNPAID` tạo quá 20 phút → CANCELLED, hoàn stock, push statusHistory, notification + email. Khởi động trong `server.js` sau khi connect DB.

### Review chỉ cho phép sau khi đơn DELIVERED
Tránh review spam. Backend kiểm tra `Order.find({ user, status:'DELIVERED', 'items.product': productId })` trước khi tạo. Unique index `{user, product}` ngăn đánh giá trùng. Sau khi tạo/xóa review → recalc `Product.rating` + `reviewCount` bằng aggregation.

### Notification & Email fire-and-forget
Là side-effect, không phải core flow — nếu lỗi (Resend rate limit, domain chưa verify…), đơn hàng vẫn phải xử lý thành công. `createNotification()` và `emailService` catch lỗi bên trong, không propagate.

### Admin Settings dùng singleton document thay vì env vars
Settings (phí ship, banner, social links) thay đổi được từ UI không cần redeploy. Document `_id: 'singleton'` + `findOneAndUpdate` với `upsert: true`.

### Admin Analytics dùng MongoDB aggregation pipeline trực tiếp
Không cần caching layer ở volume hiện tại. Nếu data lớn: thêm index `{createdAt: -1, status: 1}` hoặc pre-compute `DailyStats`.

### `/api/users/internal/*` tách riêng khỏi `/api/users`
`/api/users` dùng cho customer management (query `role: 'customer'`). Prefix `/internal/` tránh collision và rõ mục đích. Cả hai đều `authorize('admin')`.

### Address CRUD nằm trong `/api/auth/addresses`
Địa chỉ là subdocument array trong User document — giữ logic auth tập trung, không cần route file riêng. Dùng Mongoose `.id()` tìm subdocument.

### Upload ảnh bìa lưu local `uploads/covers/`
Multer endpoint `POST /api/upload/cover`, serve static `/uploads/covers/`. Đơn giản cho dev/test, nhưng **Render free tier reset file system mỗi lần redeploy — phải migrate Cloudinary/S3 trước production thực sự**.

---

## Thanh toán PayOS

### `returnUrl` trỏ về backend handler, không phải frontend
PayOS redirect kèm `code=00` (success) hoặc `cancel=true` — không khớp format frontend check (`status=success/cancelled`). Backend handler `/api/payments/payos/return` dịch `code=00` → redirect frontend với `?status=success`. `cancelUrl` trỏ thẳng frontend với `?status=cancelled`.

### Webhook dùng `description` để tìm lại Order
PayOS `orderCode` (số nguyên) phải encode từ ObjectId — có thể collision. Dùng `description` format `HSC {6 ký tự cuối objectId}` làm secondary lookup — đủ unique cho volume nhỏ. (Order giờ đã có field `orderCode` riêng dạng `DSC-...` — đừng nhầm với PayOS orderCode số nguyên.)

### PayOS Node SDK v2: API khác hẳn v1
`@payos/node` v2.x: `{ PayOS }` named export (không phải default), constructor nhận object `{ clientId, apiKey, checksumKey }` (không phải 3 positional args), method là `payos.paymentRequests.create()` (không phải `createPaymentLink()`). Luôn kiểm tra `lib/client.js` của package trước khi gọi.

### Trim tất cả env vars credentials
Paste vào Render dashboard dễ dính newline/space thừa. Với `PAYOS_CHECKSUM_KEY`, một ký tự thừa làm sai toàn bộ HMAC → PayOS trả `code: 201` "Mã kiểm tra không hợp lệ". Luôn `.trim()` credentials khi đọc từ `process.env`.

---

## Frontend — data flow & state

### Chỉ `Home.jsx` import từ `data/`
Sections nhận data qua props — tách data source khỏi presentation. Khi chuyển sang API calls chỉ sửa `Home.jsx`. Blog section trên Home fetch từ `/api/articles/recent`, fallback 3 bài tĩnh nếu API lỗi (backend sleep) để trang chủ không trống.

### `book._id || book.id` cho mọi thao tác wishlist/cart
Sách từ API có `_id` (ObjectId string), sách static có `id` (number). Dùng `book.id` với API data → `undefined` → tất cả books share cùng key → bug wishlist fill all.

### BlogCard hỗ trợ cả 2 format data
Static `{id, image, date}` vs API `{_id, coverImage, createdAt}` — resolve bằng fallback expressions. Chỉ render `<Link>` khi có `_id` (bài từ API).

### SearchModal dùng `useProducts` API thay vì lọc ALL_BOOKS tĩnh
`useProducts({ category, search, limit: 50 })` — cùng nguồn với `/books`, kết quả nhất quán với catalog thật. Debounce 300ms.

### FILTER_TABS / CATEGORIES / NAV_CATEGORIES phải đồng bộ
Ba nguồn category phải nhất quán — thiếu một slug ở FILTER_TABS từng làm mất tab filter dù DB có sách. **Luật: thêm danh mục mới = cập nhật cả 3.** NAV_CATEGORIES là object[] `{slug, name}` (không phải string[]) để MobileMenu render được `<Link to="/books?category=slug">`.

### CategoryCard dùng React Router Link thay vì button + scroll
`<Link to="/books?category=slug">` hoạt động từ mọi trang, URL bookmark/share được, BooksPage đọc `searchParams` tự filter. (Cách cũ `setCategory + scrollIntoView` chỉ hoạt động khi đang ở trang chủ.)

### FeaturedBooks/Bestsellers dùng lưới đều 4×2
Bỏ layout "2 thẻ featured lớn + lưới nhỏ" — không đều và phụ thuộc field `featured` trong DB.

---

## Frontend — auth & điều hướng

### Đăng nhập hợp nhất `/auth/login` cho cả 4 role
(commit `46595ec`) Bỏ AdminLoginPage/PMLoginPage/WarehouseLoginPage. LoginPage redirect theo role sau login. Đơn giản hóa maintenance, một form duy nhất.

### AuthPromptModal toàn cục thay vì xử lý inline
Wishlist/"Thêm giỏ" xuất hiện ở nhiều chỗ (BookCard, QuickViewModal, BookDetailPage, SearchModal, Navbar) — handle inline sẽ duplicate. `authPrompt` state trong `uiStore`, mount `<AuthPromptModal>` một lần trong App.jsx, component chỉ gọi `openAuthPrompt()`.

### Guest redirect dùng `replace: true` + `state.from`
Push thông thường tạo vòng lặp Back → account → redirect login → Back… `replace: true` xóa trang account khỏi history; `state.from` để sau login quay về đúng chỗ. **Quy tắc: mọi điều hướng của guest phải có nút Quay lại.**

### Footer link dùng flag `auth` / `modal` trong data
Flag `auth: true` → guest click bị redirect `/auth/login` sớm tại điểm click (không vào trang wishlist trống). Flag `modal: 'topic-id'` → gọi `openSupportModal()` thay vì navigate — 6 mục Hỗ trợ mở SupportModal (sidebar trái + panel phải) giữ context trang hiện tại.

### `/account` là hub thống nhất (AccountLayout + nested routes)
UX Shopee-style: sidebar profile luôn hiển thị, phần chính là đơn hàng có filter tab. Nested routes: index/orders → AccountPage, profile, addresses, wishlist. Modal slide-up (framer-motion) xem chi tiết đơn thay vì navigate trang mới.

### BlogDetailPage back dùng `state.back` thay vì `navigate(-1)`
SPA không preserve scroll khi navigate(-1) — user luôn về top page. `state.back = { path, scrollTo }` truyền từ BlogCard → BlogDetailPage → Home.jsx `scrollIntoView`. **Quy tắc: mọi link từ homepage blog section phải pass `state.back`.**

### Blog section scroll dùng CSS `scroll-mt-[110px]` thay vì JS offset
Tính offset bằng JS không ổn định (phụ thuộc ảnh load, vị trí scroll). CSS `scroll-mt` được browser tính tự động khi `scrollIntoView`.

---

## Frontend — layout & hiển thị

### Header dùng `position: fixed` thay vì `sticky`
`html { overflow-x: hidden }` trong `index.css` phá vỡ sticky (browser coi html là scroll container). AnnouncementBar + Navbar bọc chung một wrapper `fixed top-0 z-[100]`, spacer `h-[104px]` trong MainLayout. Navbar nền `bg-white` đặc (không dùng `bg-white/96 backdrop-blur`) để không trong suốt khi cuộn.

### `CustomerReviews` conditional render — không render khi chưa có data
Homepage phải luôn clean: component `return null` cho đến khi fetch xong và `reviews.length > 0`. Endpoint `/api/reviews/recent` chỉ trả review ≥4 sao có comment. **Không bọc outer scroll-reveal wrapper** — từng gây khoảng trắng ~600px (section render đầy chiều cao nhưng `opacity-0`); ReviewCard giữ scroll reveal riêng từng card là đủ.

### Admin/PM/Warehouse dùng layout riêng hoàn toàn
Không dùng MainLayout (navbar/footer customer). Mỗi portal có `*Layout` (sidebar + topbar) và `*Route` guard kiểm tra token + role.

### Framer Motion dùng `spring` thay vì `ease` duration
Spring tự nhiên hơn cho modal/drawer — `damping: 28, stiffness: 300`.
