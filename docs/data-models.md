# Data Models — Hiệu Sách Chin

13 models Mongoose trong `backend/src/models/`. Cập nhật lần cuối: 2026-06-12.

**Quy ước tiền tệ:** lưu integer VND (`85000` = 85.000₫). Format hiển thị: `formatPrice()` trong `frontend/src/utils/format.js` (Intl `vi-VN`/VND).

---

## User

```js
{ name, email (unique), password (bcrypt rounds=12, select: false), 
  role: 'customer' | 'admin' | 'product_manager' | 'warehouse',
  phone, addresses: [{ name, phone, street, city, isDefault }], active, timestamps }
```
- Hash trong pre-save hook; `toJSON()` xóa password; method `comparePassword(candidate)`.
- Địa chỉ là subdocument array — CRUD qua `/api/auth/addresses`, tìm bằng `.id()`.

## Product

```js
{ title, author, price, originalPrice?, category, categorySlug,
  description, image, stock (min: 0), visible (default: true),
  badge: 'best' | 'new' | 'sale' | null, rating, reviewCount, featured, timestamps }
```
Index: text `{title, author, category}`; `{categorySlug: 1}`; `{visible: 1, createdAt: -1}`.

## Cart

```js
{ user (ref User, unique), items: [{ product (ref), qty, price (snapshot) }], timestamps }
```
Virtual: `total`, `totalItems`. Một user = đúng một cart document.

## Order

```js
{ orderCode (unique, sparse — format 'DSC-YYMMDD-XXXX'),
  user (ref), items: [{ product (ref), title, author, image, qty, price }],  // _id: false
  status: 'PENDING'|'CONFIRMED'|'PACKING'|'SHIPPING'|'DELIVERED'|'CANCELLED'|'RETURNED',
  payment: 'ONLINE' | 'COD',
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' (default 'UNPAID'),
  address: { name, phone, street, city },
  total, discount (default 0), couponCode, note,
  statusHistory: [{ status, changedAt, changedBy (ref User) }],
  returnProcessed (default false), timestamps }
```
Index: `{user: 1, createdAt: -1}`, `{status: 1}`. Items snapshot title/price — không phụ thuộc Product sau này.

## Review

```js
{ user (ref), product (ref), order (ref), rating (1-5), comment (max 1000), timestamps }
```
Unique index `{user, product}` — mỗi user review 1 lần/sản phẩm. Index `{product, createdAt: -1}`. Sau tạo/xóa → recalc `Product.rating` + `reviewCount` bằng aggregation.

## Coupon

```js
{ code (unique, uppercase), description, type: 'percent' | 'fixed', value,
  minOrderAmount (default 0), maxDiscount?, maxUses (default 0 = unlimited), usedCount,
  startDate, endDate, active (default true), timestamps }
```

## Promotion

```js
{ name, description, type: 'percent' | 'fixed', value, startDate, endDate,
  products: [{ product (ref), originalPrice }],   // snapshot giá gốc để restore khi end
  status: 'upcoming' | 'active' | 'ended', createdBy (ref User), timestamps }
```
Index `{status, startDate, endDate}`. Quản lý bởi PM qua `/api/pm/promotions`.

## Category

```js
{ name (unique), slug (unique, lowercase), description, image, timestamps }
```
Quản lý bởi PM. Lưu ý: frontend còn 3 nguồn static phải đồng bộ (`CATEGORIES`, `FILTER_TABS`, `NAV_CATEGORIES`).

## InventoryTransaction

```js
{ product (ref), type: 'import' | 'export' | 'audit_adjust' | 'return',
  quantity, stockBefore, stockAfter, costPrice?, supplier?, reason?, notes?,
  referenceOrder (ref Order), performedBy (ref User), timestamps }
```
Index `{product, createdAt: -1}`, `{performedBy, createdAt: -1}`. Ghi bởi warehouse (nhập kho/kiểm kho/hoàn hàng).

## ActivityLog

```js
{ action, entity, entityId, description, performedBy (ref User), metadata (Mixed), timestamps }
```
Index `{performedBy, createdAt: -1}`, `{createdAt: -1}`. Nhật ký thao tác PM/warehouse.

## Article

```js
{ title, summary, content, coverImage, category (default 'Góc đọc sách'),
  readTime (default 3), status: 'PUBLISHED' | 'DRAFT' | 'HIDDEN' (default DRAFT),
  author (ref User), timestamps }
```
Index `{status, createdAt: -1}`. Seed: `npm run seed:articles` (upsert theo title).

## Notification

```js
{ user (ref), type: 'ORDER_STATUS' | 'SYSTEM', title, message, link, read (default false), timestamps }
```
Index `{user, createdAt: -1}`, `{user, read}`. Tạo fire-and-forget khi đơn đổi trạng thái.

## Settings (singleton)

```js
{ _id: 'singleton', shippingFee, freeShippingThreshold,
  siteName, supportEmail, hotline,
  socialLinks: { facebook, instagram, tiktok },
  banners: [{ title, imageUrl, link, active, order }], timestamps }
```
Luôn 1 document duy nhất — `findOneAndUpdate` + `upsert: true`.

---

## Frontend static data (`frontend/src/data/`)

Fallback khi API lỗi + nội dung site:
- `books.js` — `BESTSELLERS`, `NEW_ARRIVALS`, `FILTER_TABS`, `ALL_BOOKS`. Book shape: `{ id, title, author, category, categorySlug, price, originalPrice?, rating, reviewCount, badge, image, stock, description?, featured? }`
- `categories.js` — `CATEGORIES` `{ slug, name, count, image }`
- `blog.js` — `BLOG_POSTS`
- `site.js` — `NAV_LINKS`, `NAV_CATEGORIES` (object[] `{slug, name}`), `HERO_*`, `TRUST_ITEMS`, `FOOTER_COLUMNS` (hỗ trợ flag `auth`/`modal`), `ANNOUNCEMENT_MESSAGE`
