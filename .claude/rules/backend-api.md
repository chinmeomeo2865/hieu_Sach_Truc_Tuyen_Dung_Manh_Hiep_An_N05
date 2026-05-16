# Backend API

Server: Express + MongoDB, chạy `backend/`, port 5000.

## Cấu trúc
```
backend/
  server.js
  src/
    app.js            — Express setup, middleware, routes mount
    config/db.js      — Mongoose connect
    models/           — User, Product, Cart, Order
    middleware/
      auth.js         — protect (JWT verify), authorize(...roles)
      error.js        — centralized error handler
    controllers/      — business logic
    routes/           — route definitions
    seed.js           — seed 12 sách + admin account
```

## Auth middleware
```js
const { protect, authorize } = require('../middleware/auth')

// Yêu cầu đăng nhập
router.get('/profile', protect, getProfile)

// Yêu cầu role cụ thể
router.post('/products', protect, authorize('product_manager', 'admin'), createProduct)
```
Token gửi qua header: `Authorization: Bearer <token>`

## API Endpoints

### Auth — `/api/auth`
| Method | Route | Auth | Mô tả |
|---|---|---|---|
| POST | `/register` | — | Đăng ký |
| POST | `/login` | — | Đăng nhập → JWT |
| GET | `/me` | ✅ | Thông tin cá nhân |
| PUT | `/me` | ✅ | Cập nhật profile |
| PUT | `/password` | ✅ | Đổi mật khẩu |

### Products — `/api/products`
| Method | Route | Auth | Mô tả |
|---|---|---|---|
| GET | `/` | — | Danh sách (`?search`, `?category`, `?sort`, `?page`, `?limit`) |
| GET | `/:id` | — | Chi tiết |
| POST | `/` | pm/admin | Thêm sách |
| PUT | `/:id` | pm/admin | Sửa sách |
| DELETE | `/:id` | admin | Ẩn sách (soft delete) |
| PUT | `/:id/stock` | warehouse | Cập nhật kho |

### Cart — `/api/cart` (tất cả cần auth)
| Method | Route | Mô tả |
|---|---|---|
| GET | `/` | Xem giỏ (populated) |
| POST | `/items` | Thêm: `{ productId, qty }` |
| PUT | `/items/:productId` | Đổi qty; qty=0 → xóa |
| DELETE | `/items/:productId` | Xóa item |
| DELETE | `/` | Xóa toàn bộ giỏ |

### Orders — `/api/orders`
| Method | Route | Auth | Mô tả |
|---|---|---|---|
| GET | `/` | ✅ | Đơn của tôi |
| POST | `/` | ✅ | Tạo đơn từ giỏ → giảm stock |
| GET | `/:id` | ✅ | Chi tiết đơn |
| PUT | `/:id/cancel` | ✅ | Hủy đơn → hoàn stock |
| PUT | `/:id/status` | warehouse/admin | Cập nhật trạng thái |
| GET | `/admin/all` | admin | Tất cả đơn |

## Error response format
```json
{ "success": false, "message": "Mô tả lỗi" }
```

## Success response format
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }
```

## Stock safety
`createOrder` dùng Mongoose `bulkWrite` với điều kiện `{ stock: { $gte: qty } }` — tránh race condition khi nhiều user mua cùng lúc.
