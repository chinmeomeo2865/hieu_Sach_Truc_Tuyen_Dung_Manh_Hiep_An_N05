require('dotenv').config({ path: '../.env' })
require('dotenv').config()
const mongoose = require('mongoose')
const Product  = require('./models/Product')
const Category = require('./models/Category')
const User     = require('./models/User')
const Settings = require('./models/Settings')

const OL  = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
const YT  = (id)   => `https://www.youtube.com/watch?v=${id}`

const CATEGORIES = [
  { name: 'Kỹ năng sống', slug: 'ky-nang', description: 'Sách rèn luyện phát triển bản thân, tư duy và thói quen sống tích cực.' },
  { name: 'Văn học', slug: 'van-hoc', description: 'Các tác phẩm văn học kinh điển của Việt Nam và thế giới.' },
  { name: 'Triết học', slug: 'triet-hoc', description: 'Các tác phẩm nghiên cứu tư tưởng triết học Stoicism, Đạo giáo và lối sống.' },
  { name: 'Lịch sử & Khoa học', slug: 'lich-su', description: 'Khám phá tri thức lịch sử loài người và vật lý vũ trụ.' },
  { name: 'Thiếu nhi', slug: 'thieu-nhi', description: 'Sách và truyện ý nghĩa nuôi dưỡng tâm hồn trẻ thơ.' }
]

const PRODUCTS = [
  // ── KỸ NĂNG SỐNG (3 quyển) ──────────────────────────────────────────────────
  {
    title: 'Đắc Nhân Tâm', author: 'Dale Carnegie',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 89000, stock: 48, badge: 'best', rating: 4.8, reviewCount: 124, featured: true,
    description: 'Kiệt tác bất hủ về nghệ thuật giao tiếp và tạo dựng mối quan hệ tốt đẹp giữa con người với con người.',
    image: OL('9780671723651'), trailer: YT('jXc7XF6ApAw'),
    isbn: '9786045880753', publisher: 'NXB Tổng hợp TP.HCM', pages: 320, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ', author: 'James Clear',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 98000, stock: 55, badge: 'best', rating: 4.9, reviewCount: 89, featured: true,
    description: 'Bí quyết xây dựng thói quen tốt và loại bỏ thói quen xấu bằng cách thực hiện những thay đổi 1% mỗi ngày.',
    image: OL('9780735211292'), trailer: YT('9kWQvF-Whik'),
    isbn: '9780735211292', publisher: 'NXB Thế Giới', pages: 350, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: '7 Thói Quen Của Người Thành Đạt', author: 'Stephen R. Covey',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 105000, stock: 28, badge: null, rating: 4.7, reviewCount: 45, featured: false,
    description: 'Chương trình rèn luyện bản thân mang tính cách mạng nhằm cải thiện hiệu suất công việc và nâng cao tinh thần lãnh đạo.',
    image: OL('9780743269513'), trailer: YT('ktlTxC4YBwE'),
    isbn: '9786043653137', publisher: 'NXB Tổng hợp TP.HCM', pages: 496, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'],
    inStock: true, status: 'active'
  },

  // ── VĂN HỌC (3 quyển) ──────────────────────────────────────────────────────
  {
    title: 'Nhà Giả Kim', author: 'Paulo Coelho',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 79000, stock: 45, badge: 'best', rating: 4.9, reviewCount: 230, featured: true,
    description: 'Hành trình đầy chất thơ của chàng chăn cừu Santiago đi tìm kho báu và lẽ sống của cuộc đời mình.',
    image: OL('9780061122415'), trailer: YT('He4moNnEnIg'),
    isbn: '9786045626245', publisher: 'NXB Hội Nhà Văn', pages: 228, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Ông Già Và Biển Cả', author: 'Ernest Hemingway',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 85000, stock: 30, badge: null, rating: 4.5, reviewCount: 52, featured: false,
    description: 'Bản hùng ca bất hủ ca ngợi ý chí kiên cường và phẩm giá của con người trước nghịch cảnh số phận.',
    image: OL('9780684801223'), trailer: YT('n23E3eN4b2g'),
    isbn: '9786046985440', publisher: 'NXB Văn Học', pages: 160, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Hoàng Tử Bé', author: 'Antoine de Saint-Exupéry',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 55000, stock: 70, badge: 'best', rating: 4.8, reviewCount: 110, featured: true,
    description: 'Triết lý sống sâu sắc được nhân hóa qua lăng kính của cậu bé tóc vàng đến từ hành tinh B612.',
    image: OL('9780156012195'), trailer: YT('bqB_1E4lajI'),
    isbn: '9786042183245', publisher: 'NXB Kim Đồng', pages: 102, coverType: 'Bìa cứng',
    images: ['https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400'],
    inStock: true, status: 'active'
  },

  // ── TRIẾT HỌC (3 quyển) ────────────────────────────────────────────────────
  {
    title: 'Dám Bị Ghét', author: 'Ichiro Kishimi & Fumitake Koga',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 88000, stock: 40, badge: 'best', rating: 4.8, reviewCount: 78, featured: true,
    description: 'Lối tư duy tự do theo triết học Adler giúp bạn giải phóng bản thân khỏi các xiềng xích định kiến xã hội.',
    image: `https://salt.tikicdn.com/cache/280x280/ts/product/78/b3/13/de903c0ebaa38ba594634a009072ce7d.jpeg`, trailer: YT('5z7UjnFiZpc'),
    isbn: '9786045645543', publisher: 'NXB Lao Động', pages: 336, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Sức Mạnh Của Hiện Tại', author: 'Eckhart Tolle',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 88000, stock: 30, badge: null, rating: 4.7, reviewCount: 38, featured: false,
    description: 'Cuốn sách hướng dẫn thiền định và giải phóng tâm trí, đưa con người trở về trọn vẹn trong khoảnh khắc hiện tại.',
    image: OL('9781577314806'), trailer: YT('8ShTlFKhMXc'),
    isbn: '9786045885239', publisher: 'NXB Tổng hợp TP.HCM', pages: 304, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Suy Tưởng — Meditations', author: 'Marcus Aurelius',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 180000, stock: 22, badge: null, rating: 4.9, reviewCount: 42, featured: false,
    description: 'Những ghi chép suy tư triết lý Stoicism về nghệ thuật sống bình thản và trí tuệ của vị Hoàng đế La Mã cổ đại.',
    image: OL('9780812968255'), trailer: YT('Auuk1y4DRgk'),
    isbn: '9786043564551', publisher: 'NXB Thế Giới', pages: 412, coverType: 'Bìa cứng',
    images: ['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400'],
    inStock: true, status: 'active'
  },

  // ── LỊCH SỬ & KHOA HỌC (3 quyển) ───────────────────────────────────────────
  {
    title: 'Sapiens: Lược Sử Loài Người', author: 'Yuval Noah Harari',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 120000, stock: 30, badge: 'best', rating: 4.9, reviewCount: 154, featured: true,
    description: 'Tác phẩm nghiên cứu lịch sử đột phá, tái hiện tiến trình tiến hóa của loài người từ tiền sử đến hiện đại.',
    image: OL('9780062316097'), trailer: YT('hfbI14Mr3wQ'),
    isbn: '9786045638514', publisher: 'NXB Thế Giới', pages: 560, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Lược Sử Thời Gian', author: 'Stephen Hawking',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 95000, stock: 20, badge: null, rating: 4.8, reviewCount: 96, featured: false,
    description: 'Cuốn sách khám phá nguồn gốc và số phận của vũ trụ, giải thích các khái niệm hố đen và Big Bang một cách đơn giản.',
    image: OL('9780553380163'), trailer: YT('WenHLfTF7u4'),
    isbn: '9786049832247', publisher: 'NXB Trẻ', pages: 296, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Súng, Vi Trùng Và Thép', author: 'Jared Diamond',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 135000, stock: 18, badge: 'best', rating: 4.7, reviewCount: 63, featured: false,
    description: 'Một nghiên cứu đồ sộ giải thích các nguyên nhân khách quan địa lý định hình thế giới hiện tại.',
    image: OL('9780393354324'), trailer: YT('NMrDNpzSMgk'),
    isbn: '9786045882348', publisher: 'NXB Thế Giới', pages: 712, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'],
    inStock: true, status: 'active'
  },

  // ── THIẾU NHI (3 quyển) ───────────────────────────────────────────────────
  {
    title: 'Totto-chan Bên Cửa Sổ', author: 'Tetsuko Kuroyanagi',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 72000, stock: 45, badge: 'best', rating: 4.9, reviewCount: 145, featured: true,
    description: 'Cuốn tự truyện nhân văn kể về tuổi thơ đầy cảm hứng của Totto-chan dưới mái trường Tomoe đột phá.',
    image: OL('9780870116957'), trailer: YT('f-tRSG3Rm5c'),
    isbn: '9786046923456', publisher: 'NXB Văn Học', pages: 356, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Harry Potter Và Hòn Đá Phù Thủy', author: 'J.K. Rowling',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 135000, stock: 38, badge: 'best', rating: 4.9, reviewCount: 310, featured: true,
    description: 'Tác phẩm đầu tiên mở ra thế giới phù thủy kỳ vĩ đầy lôi cuốn của cậu bé mồ côi Harry Potter.',
    image: OL('9780590353427'), trailer: YT('VyHV0BRtdxo'),
    isbn: '9786041135438', publisher: 'NXB Trẻ', pages: 360, coverType: 'Bìa cứng',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'],
    inStock: true, status: 'active'
  },
  {
    title: 'Charlie Và Nhà Máy Sô-cô-la', author: 'Roald Dahl',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 78000, stock: 35, badge: 'new', rating: 4.6, reviewCount: 29, featured: false,
    description: 'Chuyến phiêu lưu đầy bất ngờ của cậu bé Charlie Bucket trong vương quốc kẹo ngọt của ngài Willy Wonka.',
    image: OL('9780142410318'), trailer: YT('V6ZYhCeBnvQ'),
    isbn: '9786042103184', publisher: 'NXB Kim Đồng', pages: 200, coverType: 'Bìa mềm',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'],
    inStock: true, status: 'active'
  }
]

const ADMIN = {
  name:     'Admin Chin',
  email:    'admin@hieusachcin.vn',
  password: 'admin123456',
  role:     'admin',
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hieu-sach-chin')
  console.log('Connected to MongoDB')

  // Xóa và gieo lại danh mục
  await Category.deleteMany({})
  const seededCats = await Category.insertMany(CATEGORIES)
  console.log(`✅  Seeded ${seededCats.length} categories`)

  // Xóa và gieo lại sản phẩm
  await Product.deleteMany({})
  const seededProducts = await Product.insertMany(PRODUCTS)
  console.log(`✅  Seeded ${seededProducts.length} products`)

  // Reset tài khoản admin
  await User.deleteMany({ email: ADMIN.email })
  const admin = await User.create(ADMIN)
  console.log(`✅  Admin created: ${admin.email}`)

  // Seed Settings và Banners mẫu
  const BANNERS_SEED = [
    {
      title: "Ngày Hội Sách Văn Học Chiết Khấu 30%",
      imageUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=1200&h=500&q=80",
      link: "/books?category=van-hoc",
      order: 1,
      active: true
    },
    {
      title: "Tuyển Tập Sách Thiếu Nhi Mới Nhất 2026",
      imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&h=500&q=80",
      link: "/books?category=thieu-nhi",
      order: 2,
      active: true
    },
    {
      title: "Không Gian Văn Hóa Đọc Mới — Hiệu Sách Chin",
      imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&h=500&q=80",
      link: "/offers",
      order: 3,
      active: true
    }
  ]

  await Settings.deleteMany({})
  const settingsDoc = await Settings.create({
    _id: 'singleton',
    shippingFee: 0,
    freeShippingThreshold: 250000,
    siteName: 'Hiệu Sách Chin',
    supportEmail: '23011987@st.phenikaa-uni.edu.vn',
    hotline: '0383 687 670',
    socialLinks: { facebook: '', instagram: '', tiktok: '' },
    banners: BANNERS_SEED
  })
  console.log(`✅  Seeded settings with ${settingsDoc.banners.length} banners`)

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
