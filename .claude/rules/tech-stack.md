# Tech Stack

## Frontend (src/)
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS v3 — custom colors extend design tokens (ink, muted, subtle, divider, surface, accent, star)
- **Fonts:** Playfair Display (display/heading) + Inter (body) via Google Fonts
- **State:** Zustand — cartStore, wishlistStore, toastStore, uiStore
- **Language:** JavaScript (JSX), không dùng TypeScript ở giai đoạn hiện tại

## Backend (backend/)
- **Runtime:** Node.js + Express (CommonJS)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator
- **Security:** helmet, cors, express-rate-limit
- **Dev:** nodemon

## Kế hoạch tương lai (Next.js full-stack)
- Next.js 14 App Router + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Prisma ORM
- Payments: VNPay + COD
- Email: Resend

## Môi trường
```env
# Frontend chạy port 5173 (Vite)
# Backend chạy port 5000 (Express)

# backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hieu-sach-chin
JWT_SECRET=...
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## Quy tắc khi chọn công nghệ
- Không thêm dependency mới nếu giải quyết được bằng thứ đã có
- Zustand cho mọi shared state — không dùng Context cho state phức tạp
- Không dùng Redux
