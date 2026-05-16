# Coding Conventions

## React / Frontend
- **Không dùng inline style** — ngoại lệ duy nhất: giá trị dynamic runtime (ví dụ: `style={{ width: pct }}` trong StarRating)
- **Không hardcode data trong component** — mọi text/data đến từ `data/` hoặc props
- **Named export** cho components và hooks; default export cho pages và App
- Components không tự import từ `data/` — data được pass qua props từ page
- Dùng `useMemo` khi filter/sort arrays trong render

## File naming
- Components: PascalCase (`BookCard.jsx`)
- Hooks: camelCase với prefix `use` (`useScrollReveal.js`)
- Data files: camelCase (`books.js`, `site.js`)
- Store files: camelCase với suffix `Store` (`cartStore.js`)

## Zustand store pattern
```js
// Đọc reactive selector — đúng
const wishlisted = useWishlistStore(s => s.ids.includes(book.id))

// Lấy action — đúng
const toggle = useWishlistStore(s => s.toggle)

// Không subscribe toàn bộ store
const store = useWishlistStore() // ❌
```

## Backend (Express/Node.js)
- CommonJS (`require/module.exports`), không dùng ESM
- Mọi async route handler phải có `try/catch` và `next(err)`
- Validation bằng `express-validator` ở route level, không ở controller
- Centralized error handler là middleware cuối trong `app.js`
- Không trả về password trong response — dùng `select: false` trong schema

## API conventions
- Success: `{ success: true, data: ... }`
- Error: `{ success: false, message: '...' }`
- Pagination: `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`
- HTTP status codes đúng: 200 GET, 201 POST, 400 validation, 401 auth, 403 permission, 404 not found

## Environment
- Không commit `.env` — chỉ commit `.env.example`
- Frontend `.env`: prefix `VITE_` cho biến public
- Backend `.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLIENT_URL`

## Git / file
- Không commit `node_modules/`
- Seed script: `npm run seed` trong `backend/`
