# Hiệu Sách Chin — CLAUDE.md

## Tổng quan dự án

Website bán sách trực tuyến tên **Hiệu Sách Chin**. Thiết kế theo phong cách tối giản, editorial, lấy cảm hứng từ "Cup of Couple" — màu trung tính (kem, trắng, xám nhạt), typography thanh lịch, layout dạng lưới, nhiều whitespace.

---

## Trạng thái hiện tại (cập nhật 2026-06-05)

### ✅ Hoàn thành

| Phần | Mô tả |
|---|---|
| `index.html` | Prototype tĩnh UI/UX đầy đủ — tham khảo design, **không chỉnh sửa** |
| React frontend (`src/`) | Trang chủ + toàn bộ luồng mua hàng, responsive |
| Express backend (`backend/`) | API đầy đủ: auth, products, cart, orders, users, reviews, analytics, settings, articles, notifications, payments — JWT + MongoDB |
| **Frontend ↔ Backend kết nối** | `useProducts()`, `authStore`, `api.js` wrapper — JWT tự động inject |
| **Trang `/books`** | Filter theo thể loại, sort, search, pagination **8 sách/trang**, empty state + gợi ý khi không có kết quả |
| **Trang `/books/:id`** | Chi tiết sách, qty picker, add to cart, wishlist, YouTube trailer, hiển thị danh sách review thật |
| **Trang `/cart`** | Hiển thị giỏ, sửa qty, xóa, tổng tiền, hiển thị "Đã hết hàng" khi stock=0, disable checkout |
| **Trang `/checkout`** | Form địa chỉ, **COD + PayOS/VietQR**, coupon, sync cart → order; nút disabled realtime |
| **Trang `/payment-result`** | Hiển thị kết quả sau khi PayOS redirect về — success/cancelled |
| **Trang `/account`** | Hub thống nhất: sidebar profile + stats + đơn hàng tabs + timeline tracking modal + review modal |
| **Trang `/account/orders`** | Lịch sử đơn, hủy đơn, nút "Mua lại" cho DELIVERED, "Viết đánh giá" per item |
| **Trang `/account/profile`** | Chỉnh sửa tên/SĐT + validation, đổi mật khẩu |
| **Trang `/account/wishlist`** | Danh sách yêu thích, xóa realtime, "Xóa tất cả" |
| **Trang `/account/addresses`** | CRUD địa chỉ giao hàng: thêm/sửa/xóa/đặt mặc định |
| **Trang `/notifications`** | Trung tâm thông báo: đánh dấu đã đọc, auto-trigger khi đơn đổi trạng thái |
| **Bell icon Navbar** | Badge số thông báo chưa đọc, fetch khi user đăng nhập; ẩn khi guest |
| **Trang `/blog`** | Danh sách bài viết từ DB, pagination |
| **Trang `/blog/:id`** | Chi tiết bài viết, render nội dung, tác giả, thời gian đọc |
| **Trang `/auth/login` + `/auth/register`** | Form + validation, redirect theo role, **nút "← Quay lại"** cho guest, redirect về đúng trang trước đó sau đăng nhập |
| **Footer links** | Tất cả link điều hướng được, React Router DOM |
| **Reviews/Ratings** | Model Review, API CRUD, form đánh giá per item (chỉ DELIVERED), hiển thị trên BookDetail |
| **Trang chủ — CustomerReviews** | Section feedback thật từ DB, chỉ hiển thị khi có review ≥ 4 sao có comment |
| **Trang chủ — Blog section** | Fetch từ `/api/articles/recent`, fallback static nếu API lỗi, link đến `/blog/:id`; **DB đã có 6 bài thật** |
| **Trang chủ — Bestsellers** | Lưới đều **4×2** (8 sách), bỏ layout "2 thẻ lớn featured + lưới nhỏ" |
| **Trang chủ — Danh mục sách** | Bấm tiêu đề/Xem tất cả → `/books`; bấm từng thể loại → `/books?category=<slug>` đã lọc sẵn |
| **Coupon / mã giảm giá** | Model + API validate + UI checkout: nhập mã, apply, remove, tự trừ vào tổng |
| **Guest auth guard** | `AuthPromptModal` toàn cục — chặn wishlist & thêm giỏ khi chưa đăng nhập, hiện modal với 2 lựa chọn Đăng nhập / Quay lại |
| **SearchModal** | Tìm kiếm thật từ DB (`useProducts` + debounce 300ms), không còn dùng `ALL_BOOKS` tĩnh |
| **Navbar** | Links: Trang chủ / Danh mục / Bài viết / Về chúng tôi; Heart icon guest → prompt đăng nhập (không vào trang wishlist trống) |
| **Điều hướng guest nhất quán** | Mọi trang yêu cầu auth redirect login với `replace:true` + `state.from`; login/register xong tự về đúng trang trước |
| **Admin — Layout** | Sidebar 5 nhóm nav (thêm Đánh giá + Bài viết), design đen/trắng tinh gọn |
| **Admin — Dashboard** `/admin/analytics` | Stat cards, line chart doanh thu SVG, top sách, trạng thái đơn, lọc 3 kỳ |
| **Admin — Quản lý sách** `/admin/products` | CRUD đầy đủ: thêm/sửa/xóa/ẩn, **upload ảnh bìa từ file hoặc URL**, search, filter |
| **Admin — Quản lý đơn** `/admin/orders` | Filter tab, expand detail, cập nhật trạng thái, hủy đơn |
| **Admin — Khách hàng** `/admin/users` | Table CRM, slide-in drawer hồ sơ, lịch sử đơn, khóa/mở khóa |
| **Admin — Tài khoản nội bộ** `/admin/accounts` | CRUD nhân viên (admin/product_manager/warehouse), khóa, xóa, confirm modal |
| **Admin — Cài đặt** `/admin/settings` | Phí ship, ngưỡng miễn phí, banner URL, social links, thông tin cửa hàng |
| **Admin — Đánh giá** `/admin/reviews` | Xem toàn bộ review, filter theo sao, xóa review không phù hợp |
| **Admin — Bài viết** `/admin/articles` | CMS đầy đủ: viết/sửa/xóa/đổi trạng thái (PUBLISHED/DRAFT/HIDDEN) |
| **Email notifications** | `emailService.js` dùng Resend: gửi xác nhận đơn + cập nhật trạng thái (cần `RESEND_API_KEY`) |
| **PayOS integration** | Backend controller + routes, checkout redirect QR, webhook handler (cần 3 env vars PayOS) |
| **Upload ảnh bìa** | Multer endpoint `POST /api/upload/cover`, serve static `/uploads/covers/` |
| **Deploy** | Frontend → Vercel, Backend → Render, DB → MongoDB Atlas |
| **57 sách seed** | Ảnh thật từ Open Library/Tiki CDN, YouTube trailers |
| **6 bài viết seed** | `backend/src/seedArticles.js` → `npm run seed:articles`; upsert theo title, không tạo trùng |
| **Navbar cố định (fixed)** | AnnouncementBar + Navbar bọc trong `fixed top-0 left-0 right-0 z-[100]`, spacer `h-[104px]` trong MainLayout — luôn hiện khi cuộn |
| **Navbar background trắng đục** | `bg-white` thay vì `bg-white/96 backdrop-blur-xl` — không trong suốt khi cuộn qua nội dung |
| **Navbar link "Bài viết"** | Đổi từ `/#blog` (anchor không hoạt động cross-page) sang `/blog` — điều hướng đến trang Góc đọc sách |
| **SupportModal** | `src/components/ui/SupportModal.jsx` — modal toàn cục: sidebar trái (6 mục) + panel nội dung phải. Mở từ footer links. Sidebar màu xám nhạt (`gray-100`). Mount trong `App.jsx` |
| **Footer hỗ trợ → modal** | 6 link Hỗ trợ trong footer dùng flag `modal: 'topic-id'` → gọi `openSupportModal()` từ `uiStore` thay vì navigate trang riêng |
| **Footer auth guard** | Link "Danh sách yêu thích" dùng flag `auth: true` → nếu guest thì redirect `/auth/login` thay vì vào trang wishlist trống |
| **Footer: bỏ "Địa chỉ giao hàng"** | Xóa khỏi cột Tài khoản — tránh expose trang địa chỉ với guest |
| **CustomerReviews: fix whitespace lớn** | Bỏ outer scroll reveal wrapper — khi có reviews trong DB, section render đầy đủ chiều cao nhưng content `opacity-0` tạo khoảng trắng ~600px. ReviewCard vẫn giữ scroll reveal riêng từng card |
| **Blog section: bỏ padding dưới** | `py-16 md:py-24` → `pt-16 md:pt-24 pb-4` — giảm khoảng trắng thừa trước Quote section tối |
| **BlogDetailPage: back navigation** | Thêm 3 link điều hướng: "Quay lại" (`navigate(-1)`), "Trang chủ" (`/`), "Góc đọc sách" (`/blog`) — giữ context đọc |
| **uiStore: supportModal state** | Thêm `supportModalTopic`, `openSupportModal(topic)`, `closeSupportModal()` |
| **BlogDetailPage: scroll về đúng section** | "Quay lại" + "Trang chủ" đều scroll về `#blog` section trên homepage. BlogCard pass `state.back`, Home.jsx đọc `location.state.scrollTo` rồi `scrollIntoView`. Blog section có `scroll-mt-[110px]` để tránh navbar che |
| **PayOS: kích hoạt thành công** | Credentials configured trên Render + `backend/.env`. Fix API v2: `{ PayOS }` named import, constructor object `{ clientId, apiKey, checksumKey }`, dùng `payos.paymentRequests.create()`. `returnUrl` trỏ về backend handler để dịch `code=00` → `status=success`. Trim tất cả credentials để loại newline khi paste |
| **Backend: trust proxy** | `app.set('trust proxy', 1)` — bắt buộc trên Render (reverse proxy) để `express-rate-limit` xác định IP đúng, tránh ValidationError liên tục |

### 🔲 Còn lại — bước tiếp theo

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| 🔴 | **Fix MongoDB Atlas whitelist** | Render free tier đổi IP mỗi khi restart → thêm `0.0.0.0/0` vào Atlas Network Access để backend không bị disconnect |
| 🔴 | **Kiểm tra spacer height sau deploy** | `h-[104px]` spacer dưới header fixed được estimate, có thể lệch trên các màn hình/font khác — kiểm tra sau khi lên production |
| 🟡 | **Activate Resend** | Đăng ký resend.com, verify domain, lấy API key → thêm vào `backend/.env` và Render env vars |
| 🟡 | **Test PayOS E2E đầy đủ** | Đặt đơn → chọn PayOS → quét QR → xác nhận thanh toán thành công → đơn chuyển CONFIRMED. Kiểm tra cả flow huỷ (cancelUrl) |
| 🟡 | **Test E2E đầy đủ 4 role** | Chạy qua toàn bộ flow Customer → Admin → PM → Warehouse sau khi deploy production |
| 🟡 | **SupportModal: nội dung trang `/support`** | Route `/support` vẫn tồn tại (SupportPage.jsx) nhưng không dùng. Cân nhắc xóa hoặc giữ làm SEO landing page |
| 🟢 | **Upload ảnh production** | Multer lưu local (`uploads/`) — trên Render free tier file bị mất khi redeploy. Migrate sang Cloudinary hoặc S3 |
| 🟢 | **NewArrivals section** | Chưa kiểm tra limit — nên đồng bộ về 8 sách như Bestsellers |
| ⬜ | **Migration sang Next.js** | Dài hạn, sau khi tính năng ổn định |

---

## Quyết định kiến trúc quan trọng

### 1. Dùng React+Vite thay vì nhảy thẳng lên Next.js
**Lý do:** Tập trung hoàn thiện UI/UX và business logic trước. Next.js thêm phức tạp (SSR, App Router, server actions) không cần thiết ở giai đoạn prototype → production MVP. Migrate sau khi tính năng ổn định.

### 2. MongoDB thay vì PostgreSQL cho giai đoạn hiện tại
**Lý do:** Setup đơn giản hơn, schema linh hoạt khi còn đang thay đổi data model. Migration sang PostgreSQL/Prisma (như kế hoạch dài hạn) sẽ làm khi chuyển Next.js.

### 3. JWT thay vì Supabase Auth
**Lý do:** Giai đoạn hiện tại không cần Supabase. JWT đơn giản, self-contained, không phụ thuộc dịch vụ bên ngoài. Supabase Auth sẽ thay thế khi migrate Next.js.

### 4. Zustand thay vì Context API
**Lý do:** Không cần Provider boilerplate, reactive selector theo từng field (không re-render toàn component), persist middleware sẵn có. 5 stores: `cartStore`, `wishlistStore`, `toastStore`, `uiStore`, `authStore`.

### 5. Data flow: chỉ `Home.jsx` import từ `data/`
**Lý do:** Sections nhận data qua props — tách biệt data source khỏi presentation. Khi chuyển sang API calls, chỉ cần sửa `Home.jsx`, không đụng vào các section component.

### 6. bulkWrite với điều kiện stock cho order creation
**Lý do:** Tránh race condition khi nhiều user mua cùng lúc. `bulkWrite` với `{ stock: { $gte: qty } }` là atomic — nếu bất kỳ item nào hết hàng giữa chừng, toàn bộ operation fail và không trừ stock nào.

### 7. Cart Zustand (local) tách biệt khỏi Cart API (backend)
**Lý do:** UI phản hồi ngay lập tức mà không cần chờ API. Cart Zustand là "optimistic local state", sync với server khi user đặt hàng (checkout tạo cart entry trên backend trước khi POST /api/orders).

### 8. Backend chạy port 3001 thay vì 5000
**Lý do:** macOS AirPlay Receiver chiếm port 5000. Cần tắt AirPlay trong System Settings hoặc dùng port 3001.

### 9. CORS cho phép `*.vercel.app` thay vì hardcode URL
**Lý do:** Vercel tạo domain mới mỗi lần project được tạo lại. Dùng `origin.endsWith('.vercel.app')` tránh phải update CORS mỗi lần đổi domain.

### 10. Admin panel dùng layout riêng hoàn toàn (không dùng MainLayout)
**Lý do:** Admin cần sidebar + topbar khác customer navbar/footer. `AdminLayout` wrap toàn bộ trang admin. `AdminRoute` guard kiểm tra `role === 'admin'`, redirect về `/admin/login` nếu không đủ quyền.

### 11. `book._id || book.id` cho mọi thao tác wishlist/cart
**Lý do:** Sách từ API có `_id` (MongoDB ObjectId string), sách từ static data có `id` (number). Dùng `book._id || book.id` đảm bảo hoạt động với cả hai nguồn. Nếu dùng `book.id` với API data → `undefined` → tất cả books share cùng key/id → bug wishlist fill all.

### 12. Vercel deploy: dùng `buildCommand` trực tiếp, không dùng `framework` preset
**Lý do:** React Router DOM v7 khiến Vercel auto-detect sai framework, không inject `VITE_API_URL` vào Vite build. Bỏ `framework` key trong `vercel.json` để Vercel chỉ chạy `npm run build` thuần.

### 13. `/account` là hub thống nhất thay vì nhiều trang con riêng lẻ
**Lý do:** UX Shopee-style — user mở một trang duy nhất, sidebar luôn hiển thị thông tin profile, phần chính là đơn hàng có filter tab. Trang cũ `/account/orders` và `/account/profile` vẫn giữ (backward compat) nhưng Navbar link về `/account`. Framer Motion slide-up modal thay vì điều hướng trang mới để giảm friction khi xem chi tiết đơn.

### 14. Order timeline dùng `statusHistory[]` từ Order model
**Lý do:** Order model đã lưu `statusHistory:[{status, changedAt, changedBy}]` mỗi lần đổi trạng thái. Dùng luôn dữ liệu này thay vì tạo bảng tracking riêng. Nếu không có history (đơn cũ), fallback dùng `createdAt` cho bước đầu.

### 15. Review chỉ cho phép sau khi đơn DELIVERED
**Lý do:** Tránh review spam trước khi nhận hàng. Backend kiểm tra `Order.find({ user, status:'DELIVERED', 'items.product': productId })` trước khi tạo review. Unique index `{user, product}` trên Review model ngăn đánh giá trùng.

### 16. `CustomerReviews` section dùng conditional render — không render khi chưa có data
**Lý do:** Homepage phải luôn clean. Không để khoảng trắng hoặc skeleton vô nghĩa khi DB chưa có review. Component chỉ `return null` cho đến khi fetch xong và `reviews.length > 0`.  Endpoint `/api/reviews/recent` chỉ trả về review có `rating >= 4` và có comment — đảm bảo chất lượng nội dung hiển thị.

### 17. Admin Settings dùng singleton document thay vì env vars
**Lý do:** Settings (phí ship, banner, social links) cần thay đổi được từ UI mà không cần redeploy. Dùng MongoDB document với `_id: 'singleton'` + `findOneAndUpdate` với `upsert: true`. Admin có thể cập nhật realtime qua `/admin/settings`.

### 18. Admin Analytics dùng MongoDB aggregation pipeline trực tiếp
**Lý do:** Không cần caching layer hay service riêng ở giai đoạn hiện tại. Aggregation `$group` + `$match` trên collection Orders đủ nhanh với volume nhỏ. Nếu data lớn sau này, thêm index `{createdAt: -1, status: 1}` hoặc pre-compute vào collection `DailyStats`.

### 19. Framer Motion dùng `spring` damping/stiffness thay vì `ease` duration
**Lý do:** Spring animation cảm giác tự nhiên hơn cho modal và slide-in drawer — không bị "cứng" như CSS ease. Dùng `damping: 28, stiffness: 300` cho slide-up modal, `damping: 28, stiffness: 300` cho customer detail drawer.

### 20. Admin nội bộ CRUD qua `/api/users/internal/*` tách riêng khỏi `/api/users`
**Lý do:** `/api/users` đang dùng cho customer management (query `role: 'customer'`). Thêm prefix `/internal/` để tránh collision và rõ ràng về mục đích. Cả hai đều require `authorize('admin')` nhưng có filter logic khác nhau.

### 21. Address CRUD nằm trong `/api/auth/addresses` thay vì route riêng
**Lý do:** Địa chỉ là dữ liệu cá nhân của user, gắn chặt với User document (subdocument array). Dùng `/api/auth/addresses` giữ logic auth tập trung tại một chỗ, không cần route file riêng. Dùng Mongoose `.id()` để tìm subdocument theo `_id`.

### 22. Notification tạo fire-and-forget — không await, không fail request chính
**Lý do:** Notification là side-effect, không phải core flow. Nếu tạo notification lỗi, đơn hàng vẫn phải cập nhật thành công. `createNotification()` catch lỗi bên trong, không propagate ra ngoài.

### 23. Email cũng fire-and-forget như Notification
**Lý do:** Cùng nguyên tắc với #22. Resend có thể fail (rate limit, domain chưa verify), không được để điều đó block response trả về user. `emailService` catch lỗi nội bộ và log, không throw.

### 24. PayOS webhook dùng `description` để tìm lại Order thay vì `orderCode`
**Lý do:** PayOS `orderCode` là số nguyên nhỏ hơn `MAX_SAFE_INTEGER`, phải encode từ ObjectId (có thể collision). Dùng `description` format `HSC-{6 ký tự cuối objectId}` làm secondary lookup — đủ unique cho volume nhỏ. Trong tương lai nên lưu `orderCode` vào Order document.

### 35. BlogDetailPage back dùng `state.back` thay vì `navigate(-1)`
**Lý do:** SPA không tự preserve scroll position khi navigate(-1) về homepage — user luôn bị về top page. Dùng `state.back = { path, scrollTo }` truyền từ BlogCard → BlogDetailPage đọc → navigate với state → Home.jsx scrollIntoView. Quy tắc: **mọi link từ homepage blog section phải pass `state.back`**.

### 36. Blog section scroll dùng CSS `scroll-mt` thay vì JS offset thủ công
**Lý do:** Tính offset bằng JS (`getBoundingClientRect + scrollY - px`) không ổn định — phụ thuộc thời điểm ảnh load xong, vị trí scroll hiện tại. CSS `scroll-mt-[110px]` trên `<section id="blog">` được browser tính tự động khi `scrollIntoView` được gọi, luôn chính xác.

### 37. PayOS `returnUrl` trỏ về backend handler, không phải frontend trực tiếp
**Lý do:** PayOS redirect về `returnUrl` kèm params `code=00` (success) hoặc `cancel=true`. Frontend check `status=success/cancelled` — nếu returnUrl trỏ thẳng vào frontend thì PayOS params không khớp format. Backend handler `/api/payments/payos/return` dịch `code=00` → redirect frontend với `?status=success`, `cancelUrl` trỏ thẳng frontend với `?status=cancelled`.

### 38. PayOS Node SDK v2: `paymentRequests.create()` thay vì `createPaymentLink()`
**Lý do:** `@payos/node` v2.x đổi hoàn toàn API — `{ PayOS }` named export (không phải default), constructor nhận object `{ clientId, apiKey, checksumKey }` (không phải 3 positional args), method là `payos.paymentRequests.create()`. Luôn kiểm tra `lib/client.js` của package trước khi gọi method.

### 39. Trim tất cả env vars credentials khi dùng
**Lý do:** Khi paste giá trị vào Render dashboard, rất dễ có newline `\n` hoặc space thừa ở cuối. Với `PAYOS_CHECKSUM_KEY`, một ký tự thừa làm sai toàn bộ HMAC signature → PayOS trả về `code: 201` "Mã kiểm tra không hợp lệ". Luôn `.trim()` mọi credentials khi đọc từ `process.env`.

### 25. Upload ảnh bìa lưu local (`uploads/covers/`) thay vì cloud
**Lý do:** Đơn giản cho giai đoạn dev/test. Tuy nhiên trên Render free tier, file system bị reset mỗi khi redeploy — file upload sẽ mất. **Cần migrate sang Cloudinary hoặc S3 trước khi production thực sự.**

### 26. Blog section trên Home.jsx fetch từ API, fallback về static BLOG_POSTS
**Lý do:** Giữ nguyên convention "Home.jsx là data coordinator" nhưng nâng cấp để ưu tiên API data. Nếu API lỗi (backend sleep), fallback về 3 bài tĩnh để trang chủ không bị trống. Pattern giống `useProducts()` nhưng implement trực tiếp trong Home.jsx vì Blog không cần filtering.

### 27. BlogCard hỗ trợ cả 2 format (static `{id, image, date}` và API `{_id, coverImage, createdAt}`)
**Lý do:** Data tĩnh dùng `id`/`image`/`date`, data từ API dùng `_id`/`coverImage`/`createdAt`. BlogCard resolve cả hai bằng fallback expressions. Chỉ render `<Link>` khi có `_id` (bài từ API) — static posts không có trang detail.

### 28. AuthPromptModal toàn cục thay vì xử lý inline mỗi component
**Lý do:** Wishlist và "Thêm giỏ hàng" xuất hiện ở nhiều chỗ (BookCard, FeaturedCard, QuickViewModal, BookDetailPage, SearchModal, Navbar). Nếu handle inline mỗi chỗ sẽ duplicate logic và UI không nhất quán. Giải pháp: thêm `authPrompt` state vào `uiStore`, mount `<AuthPromptModal>` một lần trong App.jsx, mọi component chỉ cần gọi `openAuthPrompt()`. Modal dùng `state.from` để sau đăng nhập quay về đúng trang.

### 29. Guest redirect dùng `replace: true` + `state.from` thay vì push thông thường
**Lý do:** Nếu dùng `navigate('/auth/login')` kiểu push, khi user bấm Back sẽ quay về trang account → lại bị redirect về login → vòng lặp vô tận. Dùng `replace: true` xóa trang account khỏi history stack, Back sẽ về đúng trang trước đó (vd trang chủ). `state.from` lưu đích đến để sau login quay về đúng chỗ. Quy tắc: **mọi điều hướng của guest phải có nút Quay lại**.

### 30. CategoryCard dùng React Router Link thay vì button + scroll
**Lý do:** Code cũ dùng `setCategory(slug)` + `scrollIntoView('#books')` — chỉ hoạt động khi đang ở trang chủ và section `#books` đang visible. Nếu user ở trang khác, scroll vô nghĩa. Đổi sang `<Link to="/books?category=slug">` đảm bảo hoạt động từ mọi trang, URL có thể bookmark/share, BooksPage đọc từ `searchParams` tự filter đúng.

### 31. NAV_CATEGORIES đổi từ string[] sang object[] `{slug, name}`
**Lý do:** String array chỉ có tên hiển thị, MobileMenu buộc phải dùng `href="#"` vì không có slug để tạo URL. Đổi sang object có cả `slug` và `name` cho phép MobileMenu render `<Link to="/books?category=slug">` đúng cách, đồng bộ với CategoryCard và FILTER_TABS.

### 32. FILTER_TABS phải đồng bộ với CATEGORIES và NAV_CATEGORIES
**Lý do:** Ba nguồn dữ liệu category phải nhất quán. FILTER_TABS thiếu "Kiến thức" (`kien-thuc`) khiến filter pills trên trang Bestsellers và `/books` không có tab Kiến thức dù sách trong DB có `categorySlug: 'kien-thuc'`. Luật: **khi thêm danh mục mới, phải cập nhật cả 3: `CATEGORIES`, `FILTER_TABS`, `NAV_CATEGORIES`**.

### 33. FeaturedBooks bỏ layout "2 thẻ featured lớn + lưới nhỏ"
**Lý do:** Layout cũ chia sách thành featured (2 thẻ FeaturedCard to) và non-featured (lưới BookCard nhỏ), tạo cảm giác không đều và phụ thuộc vào field `featured` trong DB. Với 8 sách bestseller, lưới đều 4×2 nhìn clean hơn, không cần quản lý field `featured` thêm. Bỏ import `FeaturedCard` khỏi FeaturedBooks.jsx.

### 34. SearchModal dùng `useProducts` API thay vì lọc ALL_BOOKS tĩnh
**Lý do:** ALL_BOOKS tĩnh là fallback data cũ, không phản ánh catalog thật trong DB (57 sách). SearchModal dùng `useProducts({ category, search, limit: 50 })` cùng nguồn với trang `/books` — kết quả luôn nhất quán với catalog production. Debounce 300ms tránh gọi API mỗi keystroke.

### 35. Header dùng `position: fixed` thay vì `sticky`
**Lý do:** `html { overflow-x: hidden }` trong `index.css` phá vỡ `position: sticky` — browser coi html là scroll container, sticky không còn bám theo viewport. Đổi sang `fixed top-0 left-0 right-0` đảm bảo header luôn cố định. Thêm spacer `h-[104px]` trong MainLayout để nội dung không bị che. AnnouncementBar và Navbar bọc chung trong một wrapper fixed duy nhất.

### 36. SupportModal mở từ footer links thay vì navigate trang riêng
**Lý do:** 6 link Hỗ trợ trong footer nếu mỗi link mở 1 trang riêng thì user mất context (phải back nhiều bước). Modal với sidebar trái (6 mục) + panel phải (nội dung) cho phép user xem và chuyển đổi giữa các mục mà không rời khỏi trang hiện tại. Dùng `uiStore.supportModalTopic` làm state — null = đóng, string = mục đang mở. Footer links dùng flag `modal: 'topic-id'` để phân biệt với links thông thường.

### 37. Footer link dùng flag `auth` thay vì guard ở trang đích
**Lý do:** Link "Danh sách yêu thích" trong footer khi guest click → hiện trang wishlist trống, không friendly. Thêm flag `auth: true` vào data link trong `site.js`, Footer đọc `token` từ `authStore` và redirect về `/auth/login` nếu guest — xử lý sớm tại điểm click, không để user vào trang trống.

### 38. `CustomerReviews` bỏ outer scroll reveal wrapper
**Lý do:** Khi DB có reviews, component render `<section>` đầy đủ chiều cao (~600-800px). Scroll reveal wrapper bên ngoài (`opacity-0`) khiến toàn bộ section vô hình nhưng vẫn chiếm không gian — tạo khoảng trắng lớn trên homepage trước khi user scroll đủ để trigger IntersectionObserver (cần 6% element visible). ReviewCard đã có scroll reveal riêng từng card — đủ để có hiệu ứng reveal mà không gây layout shift.

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
- **State:** Zustand v5 — 5 stores với `persist` middleware
- **Router:** React Router DOM v7 (BrowserRouter — client-side only, không dùng framework mode)
- **Build:** `npm run dev` → port 5173 (hoặc 5174 nếu bị chiếm)
- **Deploy:** Vercel — `vercel.json` chỉ có `buildCommand`, `outputDirectory`, `rewrites`

### Backend (`backend/`) — Express + MongoDB
- **Runtime:** Node.js + Express (CommonJS)
- **Database:** MongoDB Atlas (cloud) — cluster `hieu-sach-chin.wylfq2r.mongodb.net`
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator ở route level
- **Security:** helmet, cors (`*.vercel.app` + localhost), express-rate-limit (500 req/15min)
- **File upload:** multer — lưu local `uploads/covers/` (⚠️ mất khi Render redeploy — cần migrate CDN)
- **Email:** resend — `RESEND_API_KEY` trong `.env` (chưa active nếu chưa có key)
- **Payment:** @payos/node — `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` trong `.env`
- **Run:** `npm run dev` → **port 3001** (không phải 5000)
- **Deploy:** Render (free tier) — cold start ~30-50s sau khi idle. **⚠️ Phải whitelist `0.0.0.0/0` trong MongoDB Atlas Network Access**
- **Seed:** `npm run seed` trong `backend/` → 57 sách + admin `admin@hieusachcin.vn` / `admin123456`

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
  vercel.json             — buildCommand + outputDirectory + rewrites (SPA)
  .env.local              — VITE_API_URL=http://localhost:3001 (không commit)
  src/
    App.jsx               — BrowserRouter + Routes + MainLayout + AdminRoute
    main.jsx
    index.css             — toast animations, base styles
    pages/
      Home.jsx            — data coordinator (duy nhất import từ data/)
      BooksPage.jsx       — /books — filter, sort, search, pagination
      BookDetailPage.jsx  — /books/:id — chi tiết + trailer
      CartPage.jsx        — /cart
      CheckoutPage.jsx    — /checkout — COD + PayOS, coupon, sync cart → order
      OrdersPage.jsx      — /account/orders
      WishlistPage.jsx    — /account/wishlist — BookCard, xóa realtime
      LoginPage.jsx       — /auth/login — redirect theo role
      RegisterPage.jsx    — /auth/register
      PlaceholderPage.jsx — trang chưa build (nhận title + description)
      BlogPage.jsx        — /blog — danh sách bài viết từ API
      BlogDetailPage.jsx  — /blog/:id — chi tiết bài viết
      NotificationsPage.jsx — /notifications — trung tâm thông báo
      PaymentResultPage.jsx — /payment-result — kết quả PayOS redirect
      account/
        AccountPage.jsx     — /account — hub thống nhất: sidebar + đơn hàng + modals
        AccountProfilePage.jsx — /account/profile — chỉnh sửa hồ sơ + đổi MK
        AddressesPage.jsx   — /account/addresses — CRUD địa chỉ giao hàng
      admin/
        AdminLoginPage.jsx   — /admin/login (nền tối)
        AdminOrdersPage.jsx  — /admin/orders
        AdminUsersPage.jsx   — /admin/users — CRM khách hàng, slide-in drawer
        AdminProductsPage.jsx — /admin/products — CRUD sách + upload ảnh bìa
        AdminAccountsPage.jsx — /admin/accounts — quản lý tài khoản nội bộ
        AdminAnalyticsPage.jsx — /admin/analytics — dashboard thống kê
        AdminSettingsPage.jsx  — /admin/settings — cài đặt hệ thống
        AdminCouponsPage.jsx   — /admin/coupons — quản lý mã giảm giá
        AdminReviewsPage.jsx   — /admin/reviews — kiểm duyệt đánh giá
        AdminArticlesPage.jsx  — /admin/articles — CMS bài viết blog
      pm/
        PMLoginPage.jsx      — /pm/login
        PMDashboard.jsx      — /pm — tổng quan product manager
        PMCategoriesPage.jsx — /pm/categories — CRUD danh mục sách
        PMProductsPage.jsx   — /pm/products — quản lý sách
        PMVisibilityPage.jsx — /pm/visibility — ẩn/hiện sách
        PMPromotionsPage.jsx — /pm/promotions — khuyến mãi, badge
        PMActivityPage.jsx   — /pm/activity — nhật ký hoạt động
      warehouse/
        WarehouseLoginPage.jsx    — /warehouse/login
        WarehouseDashboard.jsx    — /warehouse — tổng quan kho
        WarehouseOrdersPage.jsx   — /warehouse/orders — xử lý đơn hàng
        WarehouseInventoryPage.jsx — /warehouse/inventory — tồn kho
        WarehouseAuditPage.jsx    — /warehouse/audit — kiểm kho
        WarehouseReturnsPage.jsx  — /warehouse/returns — hàng hoàn
        WarehouseActivityPage.jsx — /warehouse/activity — nhật ký kho
    components/
      warehouse/
        WarehouseLayout.jsx  — sidebar + topbar cho warehouse portal
        WarehouseRoute.jsx   — guard: kiểm tra role === 'warehouse'
      pm/
        PMLayout.jsx         — sidebar + topbar cho PM portal
        PMRoute.jsx          — guard: kiểm tra role === 'product_manager'
    components/
      layout/             — AnnouncementBar, Navbar, MobileMenu, Footer
      sections/           — Hero, TrustBar, FeaturedBooks, NewArrivals,
                            Categories, Blog, Quote, About, Newsletter, Bestsellers,
                            CustomerReviews (fetch /api/reviews/recent, conditional render)
      ui/                 — BookCard, FeaturedCard, CategoryCard, BlogCard,
                            Badge, Button, StarRating, SectionHeader, icons,
                            SearchModal, QuickViewModal, Toast, ToastContainer,
                            ReviewForm (form đánh giá), ReviewModal (trong AccountPage)
      admin/
        AdminLayout.jsx   — sidebar 4 nhóm nav + topbar (không dùng Navbar/Footer)
        AdminRoute.jsx    — guard: kiểm tra token + role === 'admin'
        ui/
          ConfirmModal.jsx — reusable confirm dialog dùng framer-motion
    data/
      books.js            — BESTSELLERS, NEW_ARRIVALS, FILTER_TABS, ALL_BOOKS (fallback)
      categories.js       — CATEGORIES
      blog.js             — BLOG_POSTS
      site.js             — NAV_LINKS, FOOTER_COLUMNS (có href), TRUST_ITEMS…
    services/
      api.js              — fetch wrapper, auto-inject JWT từ localStorage['chin-token']
    store/
      authStore.js        — user, token, login(), register(), logout() (persist)
      cartStore.js        — items[], addItem (dùng _id||id), updateQty, clear (persist)
      wishlistStore.js    — ids[], toggle, clearAll (persist)
      toastStore.js       — toasts[], show, dismiss
      uiStore.js          — quickViewBook, searchOpen, activeCategory
    hooks/
      useProducts.js      — fetch /api/products, fallback static nếu lỗi
      useScrollReveal.js  — IntersectionObserver, threshold 0.06
      useNavbar.js        — scroll shadow
    utils/
      format.js           — formatPrice(amount) → Intl VND
  backend/
    server.js             — entry point (port 3001)
    .env                  — MONGO_URI, JWT_SECRET, PORT, CLIENT_URL (không commit)
    src/
      app.js              — Express setup, CORS (*.vercel.app), rate-limit (500/15min)
      config/db.js        — Mongoose connect Atlas
      models/             — User, Product, Cart, Order, Review, Settings, Article, Notification
      middleware/
        auth.js           — protect (JWT), authorize(...roles)
        error.js          — centralized error handler
      controllers/        — auth, product, cart, order, user, review, analytics, settings,
                            article, notification, payment
      routes/             — auth, products, cart, orders, users, reviews, analytics, settings,
                            articles, notifications, payments, upload
      services/
        emailService.js   — Resend: sendOrderConfirmation(), sendStatusUpdate()
      uploads/covers/     — local file storage cho ảnh bìa upload (chưa dùng CDN)
      seed.js             — 57 sách (Open Library + Tiki CDN) + admin account
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

### Review
```js
{ user(ref), product(ref), order(ref), rating(1-5), comment(String, maxlength:1000), timestamps }
unique index: { user: 1, product: 1 } — mỗi user chỉ review 1 lần / sản phẩm
index: { product: 1, createdAt: -1 }
```
Sau khi tạo review: cập nhật `Product.rating` (average) và `Product.reviewCount` qua aggregation.

### Settings (singleton)
```js
{ _id: 'singleton', shippingFee, freeShippingThreshold,
  siteName, supportEmail, hotline,
  socialLinks: { facebook, instagram, tiktok },
  banners: [{ title, imageUrl, link, active, order }], timestamps }
```
Dùng `findOneAndUpdate` với `upsert: true` — luôn chỉ có 1 document duy nhất.

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

GET    /api/users            [admin]  ?search ?page ?limit — kèm orderCount, orderTotal
GET    /api/users/:id        [admin]  chi tiết + 20 đơn gần nhất + orderCount + orderTotal
PUT    /api/users/:id/status [admin]  toggle active true↔false (khóa/mở tài khoản)

GET    /api/users/internal/list [admin]  danh sách nhân viên (role != customer)
POST   /api/users/internal      [admin]  tạo tài khoản nội bộ
PUT    /api/users/internal/:id  [admin]  sửa tên/email/role/phone, đặt lại mật khẩu
DELETE /api/users/internal/:id  [admin]  xóa tài khoản (không xóa chính mình)

GET    /api/reviews/recent            public  lấy 6 review ≥4 sao có comment (homepage)
GET    /api/products/:id/reviews      public  reviews của 1 sản phẩm (paginated)
POST   /api/reviews          [auth]   tạo review (check order DELIVERED)
GET    /api/reviews/my-reviews [auth] list review của user (để check đã review chưa)
GET    /api/reviews/admin/all [admin] tất cả review, filter ?rating
DELETE /api/reviews/:id      [admin]  xóa review + recalc product rating

GET    /api/analytics        [admin]  ?period=today|7days|30days — doanh thu, top sản phẩm, stats

GET    /api/settings         [admin]  lấy cài đặt hệ thống (singleton document)
PUT    /api/settings         [admin]  cập nhật cài đặt

GET    /api/auth/addresses   [auth]   danh sách địa chỉ của user
POST   /api/auth/addresses   [auth]   thêm địa chỉ mới
PUT    /api/auth/addresses/:addrId  [auth]  sửa địa chỉ
DELETE /api/auth/addresses/:addrId  [auth]  xóa địa chỉ
PUT    /api/auth/addresses/:addrId/default [auth] đặt làm mặc định

GET    /api/articles/recent  public   3 bài mới nhất PUBLISHED (homepage)
GET    /api/articles         public   danh sách bài, ?status=all|PUBLISHED|DRAFT|HIDDEN
GET    /api/articles/:id     public   chi tiết bài viết
POST   /api/articles         [pm/admin] tạo bài viết
PUT    /api/articles/:id     [pm/admin] sửa bài viết
DELETE /api/articles/:id     [admin]  xóa bài viết

GET    /api/notifications    [auth]   danh sách thông báo + unreadCount
PUT    /api/notifications/read-all [auth] đánh dấu tất cả đã đọc
PUT    /api/notifications/:id/read [auth] đánh dấu 1 đã đọc

POST   /api/payments/payos/create  [auth]  tạo PayOS payment link từ orderId
GET    /api/payments/payos/return         redirect handler sau khi user thanh toán xong
POST   /api/payments/payos/webhook        webhook PayOS server-to-server

POST   /api/upload/cover     [pm/admin]  upload ảnh bìa, trả về { url }
```

Response format: `{ success: true, data: ... }` / `{ success: false, message: '...' }`

---

## Zustand stores

```js
// authStore — persist 'chin-auth', sync token vào localStorage['chin-token']
{ user, token, login(email, pw), register(name, email, pw), fetchMe(),
  updateProfile(data), changePassword(currentPw, newPw), logout() }
// QUAN TRỌNG: không dùng getter isAuthenticated — dùng s => !!s.token trong component

// cartStore — persist 'chin-cart'
{ items[], addItem(book), removeItem(id), updateQty(id, qty), clear() }
// addItem dùng book._id || book.id làm id
// addItem lưu thêm book.stock ?? 999 — dùng để cap qty và hiển thị "Đã hết hàng"
// updateQty tự động cap tại item.stock

// wishlistStore — persist 'chin-wishlist'
{ ids[], toggle(id), clearAll() }
// toggle dùng book._id || book.id

// toastStore — auto-dismiss 3.5s, max 4 toasts
{ toasts[], show({message, type, duration}), dismiss(id) }

// uiStore
{ quickViewBook, openQuickView(book), closeQuickView(),
  searchOpen, openSearch(), closeSearch(),
  activeCategory, setCategory(slug) }
```

## Môi trường

```env
# Frontend — .env.local (không commit)
VITE_API_URL=http://localhost:3001

# backend/.env (không commit)
PORT=3001
MONGO_URI=mongodb+srv://...@hieu-sach-chin.wylfq2r.mongodb.net/hieu-sach-chin?...
JWT_SECRET=hieusachchin_dev_secret_2026
JWT_EXPIRE=7d
CLIENT_URL=https://hieu-sach-truc-tuyen-dung-manh-hiep.vercel.app

# Tùy chọn — graceful degrade nếu không có
RESEND_API_KEY=re_...          # email xác nhận đơn + cập nhật trạng thái
PAYOS_CLIENT_ID=...            # PayOS online payment
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
```

## Deploy (Production)

| Service | URL | Ghi chú |
|---|---|---|
| Frontend | https://hieu-sach-truc-tuyen-dung-manh-hiep.vercel.app | Vercel, auto-deploy từ GitHub main |
| Backend | https://hieu-sach-api.onrender.com | Render free tier, cold start ~30-50s |
| Database | MongoDB Atlas M0 | Singapore (ap-southeast-1), free tier |

**Lưu ý Render free tier:** Sleep sau 15 phút idle. Request đầu tiên sau ngủ mất ~30-50s — đây là giới hạn bản miễn phí.

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

Seed data: `cd backend && npm run seed` → 57 sách + admin account (`admin@hieusachchin.vn` / `admin123456`)

---

## Data models dài hạn (PostgreSQL/Prisma — khi migrate Next.js)

Models: User, Book, Category, Order, OrderItem, Review, Coupon  
Enums: Role, OrderStatus, PaymentMethod, CouponType  
Auth: Supabase Auth (email/password + Google OAuth)  
Storage: Supabase Storage bucket `book-covers`  
Slug sách: title → kebab-case + uuid suffix  

Chi tiết schema Prisma giữ trong lịch sử git / tài liệu riêng khi cần.
