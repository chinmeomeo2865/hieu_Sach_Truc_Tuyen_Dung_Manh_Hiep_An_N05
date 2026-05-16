# Data Models

## Backend (MongoDB/Mongoose) — backend/src/models/

### User
```js
{ name, email, password (hashed, select:false), role, phone, addresses[], active, timestamps }
role: 'customer' | 'admin' | 'product_manager' | 'warehouse'
```

### Product
```js
{ title, author, price, originalPrice?, category, categorySlug, description, image, stock, visible, badge, rating, reviewCount, featured, timestamps }
badge: 'best' | 'new' | 'sale' | null
```
Index: `{ title, author, category }` text search; `{ categorySlug: 1 }`; `{ visible: 1, createdAt: -1 }`

### Cart
```js
{ user (ref User, unique), items: [{ product (ref), qty, price (snapshot) }], timestamps }
virtual: total, totalItems
```
Một user có đúng một cart document.

### Order
```js
{ user (ref), items: [{ product (ref), title, author, image, qty, price }],
  status, payment, address: {name, phone, street, city}, total, discount, couponCode, note,
  statusHistory: [{status, changedAt, changedBy}], timestamps }
status: PENDING | CONFIRMED | PACKING | SHIPPING | DELIVERED | CANCELLED | RETURNED
payment: ONLINE | COD
```

## Frontend data (src/data/) — JavaScript arrays

### Book object shape
```js
{
  id, title, author, category, categorySlug,
  price, originalPrice?,
  rating, reviewCount,
  badge: 'best' | 'new' | 'sale' | null,
  image, stock, description?, featured?
}
```

### Category object shape
```js
{ slug, name, count, image }
```

## Currency convention
- Lưu dạng integer VND: `85000` = 85.000₫
- Format hiển thị: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)`
- File helper: `src/utils/format.js` → `formatPrice(amount)`

## Kế hoạch (Prisma/PostgreSQL — Next.js migration)
Models: User, Book, Category, Order, OrderItem, Review, Coupon
Enums: Role, OrderStatus, PaymentMethod, CouponType
Chi tiết trong phần CLAUDE.md gốc.
