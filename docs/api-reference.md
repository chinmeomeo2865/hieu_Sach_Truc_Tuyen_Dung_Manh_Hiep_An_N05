# API Reference — Hiệu Sách Chin

Base: `/api`. Tất cả routes mount trong `backend/src/app.js`. Cập nhật lần cuối: 2026-06-12.

**Auth:** header `Authorization: Bearer <token>`. Middleware: `protect` (verify JWT → `req.user`), `authorize(...roles)`.

**Response format:**
```json
{ "success": true, "data": ... }
{ "success": true, "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }
{ "success": false, "message": "Mô tả lỗi" }
```

**Rate limit:** 500 req / 15 phút trên toàn bộ `/api/`. Health check: `GET /api/health`.

---

## Auth — `/api/auth`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| POST | `/register` | — | Đăng ký (validation rules ở route level) |
| POST | `/login` | — | Đăng nhập → JWT (expire `JWT_EXPIRE`, mặc định 7d) |
| GET | `/me` | auth | Thông tin cá nhân |
| PUT | `/me` | auth | Cập nhật tên/SĐT |
| PUT | `/password` | auth | Đổi mật khẩu |
| GET | `/addresses` | auth | Danh sách địa chỉ |
| POST | `/addresses` | auth | Thêm địa chỉ |
| PUT | `/addresses/:addrId` | auth | Sửa địa chỉ |
| DELETE | `/addresses/:addrId` | auth | Xóa địa chỉ |
| PUT | `/addresses/:addrId/default` | auth | Đặt mặc định |

## Products — `/api/products`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| GET | `/` | — | Danh sách: `?search ?category ?sort ?page ?limit` |
| GET | `/admin/all` | pm/admin | Danh sách cho quản trị (cả sách ẩn) |
| GET | `/:id` | — | Chi tiết |
| GET | `/:id/reviews` | — | Reviews của sản phẩm (paginated) |
| POST | `/` | pm/admin | Thêm sách |
| PUT | `/:id` | pm/admin | Sửa sách |
| DELETE | `/:id` | pm/admin | Soft delete (`visible: false`) |
| PUT | `/:id/stock` | warehouse/admin | Cập nhật tồn kho |

## Cart — `/api/cart` (tất cả cần auth)

| Method | Route | Mô tả |
|---|---|---|
| GET | `/` | Xem giỏ (populated) |
| POST | `/items` | Thêm: `{ productId, qty }` |
| PUT | `/items/:productId` | Đổi qty; qty=0 → xóa |
| DELETE | `/items/:productId` | Xóa item |
| DELETE | `/` | Xóa toàn bộ giỏ |

## Orders — `/api/orders`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| GET | `/` | auth | Đơn của tôi |
| POST | `/` | auth | Tạo đơn từ giỏ → trừ stock (bulkWrite atomic), sinh `orderCode` |
| GET | `/:id` | auth | Chi tiết đơn |
| PUT | `/:id/cancel` | auth | Hủy đơn → hoàn stock |
| PUT | `/:id/status` | warehouse/admin | Admin: chỉ CONFIRMED/CANCELLED. Warehouse: PACKING/SHIPPING/DELIVERED/CANCELLED/RETURNED |
| GET | `/admin/all` | admin | Tất cả đơn (search theo orderCode/user) |

## Users — `/api/users` (tất cả admin)

| Method | Route | Mô tả |
|---|---|---|
| GET | `/` | Khách hàng: `?search ?page ?limit` — kèm orderCount, orderTotal |
| GET | `/:id` | Chi tiết + 20 đơn gần nhất |
| PUT | `/:id/status` | Khóa/mở tài khoản (toggle `active`) |
| GET | `/internal/list` | Danh sách nhân viên (role != customer) |
| POST | `/internal` | Tạo tài khoản nội bộ |
| PUT | `/internal/:id` | Sửa tên/email/role/phone, reset mật khẩu |
| DELETE | `/internal/:id` | Xóa tài khoản (không xóa chính mình) |

## Reviews — `/api/reviews`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| GET | `/recent` | — | 6 review ≥4 sao có comment (homepage) |
| POST | `/` | auth | Tạo review (check đơn DELIVERED, unique user+product) |
| GET | `/my-reviews` | auth | Review của user (check đã review chưa) |
| GET | `/admin/all` | admin | Tất cả review, filter `?rating` |
| DELETE | `/:id` | admin | Xóa review + recalc product rating |

## PM — `/api/pm` (tất cả product_manager/admin)

| Method | Route | Mô tả |
|---|---|---|
| GET | `/stats` | Thống kê dashboard PM |
| GET / POST | `/categories` | Danh sách / tạo danh mục |
| PUT / DELETE | `/categories/:id` | Sửa / xóa danh mục |
| GET / POST | `/promotions` | Danh sách / tạo khuyến mãi |
| POST | `/promotions/:id/end` | Kết thúc khuyến mãi sớm |
| DELETE | `/promotions/:id` | Xóa khuyến mãi |
| POST | `/visibility` | Ẩn/hiện sách |
| GET | `/activity` | Nhật ký hoạt động PM (ActivityLog) |

## Warehouse — `/api/warehouse` (tất cả warehouse/admin)

| Method | Route | Mô tả |
|---|---|---|
| GET | `/stats` | Thống kê dashboard kho |
| GET | `/orders` | Đơn cần xử lý |
| PUT | `/orders/:id/status` | Cập nhật trạng thái đơn |
| GET | `/inventory` | Tồn kho |
| POST | `/inventory/import` | Nhập kho (tạo InventoryTransaction) |
| POST | `/inventory/audit` | Kiểm kho (audit_adjust) |
| GET | `/inventory/transactions` | Lịch sử giao dịch kho |
| GET | `/returns` | Hàng hoàn |
| POST | `/returns/:id/process` | Xử lý hàng hoàn |
| GET | `/activity` | Nhật ký thao tác kho |
| GET | `/low-stock` | Sách sắp hết hàng |

## Coupons — `/api/coupons`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| POST | `/validate` | auth | Validate mã khi checkout |
| GET / POST | `/` | admin | Danh sách / tạo coupon |
| PUT / DELETE | `/:id` | admin | Sửa / xóa coupon |

Lưu ý: trang admin quản lý coupon đã bị gỡ khỏi UI (commit `6ca8715`) — API vẫn tồn tại.

## Articles — `/api/articles`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| GET | `/recent` | — | 3 bài PUBLISHED mới nhất (homepage) |
| GET | `/` | — | Danh sách, `?status=all\|PUBLISHED\|DRAFT\|HIDDEN` |
| GET | `/:id` | — | Chi tiết |
| POST / PUT `/:id` | | pm/admin | Tạo / sửa bài |
| DELETE | `/:id` | admin | Xóa bài |

## Notifications — `/api/notifications` (tất cả auth)

| Method | Route | Mô tả |
|---|---|---|
| GET | `/` | Danh sách + unreadCount |
| PUT | `/read-all` | Đánh dấu tất cả đã đọc |
| PUT | `/:id/read` | Đánh dấu 1 đã đọc |

## Payments — `/api/payments`

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| POST | `/payos/create` | auth | Tạo PayOS payment link từ orderId |
| GET | `/payos/return` | — | Redirect handler: dịch `code=00` → frontend `?status=success` |
| POST | `/payos/webhook` | — | Webhook PayOS server-to-server (lookup order qua description `HSC xxxxxx`) |

## Khác

| Method | Route | Quyền | Mô tả |
|---|---|---|---|
| GET / PUT | `/api/settings` | admin | Cài đặt hệ thống (singleton document) |
| GET | `/api/analytics` | admin | `?period=today\|7days\|30days` — doanh thu, top sản phẩm |
| POST | `/api/upload/cover` | pm/admin | Upload ảnh bìa (multer) → `{ url }`; serve tại `/uploads/covers/` |
