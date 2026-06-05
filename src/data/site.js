/* All site-wide static content — single source of truth */

export const NAV_LINKS = [
  { href: '/',       label: 'Trang chủ' },
  { href: '/books',  label: 'Danh mục' },
  { href: '/blog',   label: 'Bài viết' },
  { href: '/#about', label: 'Về chúng tôi' },
]

export const NAV_CATEGORIES = [
  { slug: 'van-hoc',   name: 'Văn học' },
  { slug: 'ky-nang',   name: 'Kỹ năng sống' },
  { slug: 'thieu-nhi', name: 'Thiếu nhi' },
  { slug: 'kien-thuc', name: 'Kiến thức' },
  { slug: 'triet-hoc', name: 'Triết học' },
  { slug: 'lich-su',   name: 'Lịch sử' },
]

export const HERO_EYEBROW       = 'Hà Đông · Hà Nội · Est. 2024'
export const HERO_CATEGORIES_LABEL = 'Văn học · Kiến thức · Thiếu nhi · Triết học · Kỹ năng'

export const HERO_STATS = [
  { num: '500+',    label: 'Đầu sách' },
  { num: '2.400+', label: 'Khách hàng' },
  { num: '4.9 ★',  label: 'Đánh giá' },
]

export const HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=480&q=85', tall: true },
  { src: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=320&q=80', tall: false },
  { src: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=320&q=80', tall: false },
]

export const TRUST_ITEMS = [
  { id: 'shipping', title: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 250.000₫',     icon: 'truck'   },
  { id: 'returns',  title: 'Đổi trả 30 ngày',     sub: 'Không hài lòng, hoàn tiền', icon: 'refresh' },
  { id: 'payment',  title: 'Thanh toán an toàn',   sub: 'VNPay · COD · Ví điện tử', icon: 'shield'  },
  { id: 'fast',     title: 'Giao hàng nhanh',      sub: 'Nội thành HN trong 2 giờ', icon: 'zap'     },
]

export const ABOUT_HOURS = [
  { days: 'Thứ Hai – Thứ Sáu',  time: '08:00 – 21:00' },
  { days: 'Thứ Bảy – Chủ Nhật', time: '09:00 – 22:00' },
]

export const FOOTER_COLUMNS = [
  {
    label: 'Thể loại',
    links: [
      { label: 'Văn học',      href: '/books?category=van-hoc' },
      { label: 'Kiến thức',    href: '/books?category=kien-thuc' },
      { label: 'Thiếu nhi',    href: '/books?category=thieu-nhi' },
      { label: 'Kỹ năng sống', href: '/books?category=ky-nang' },
      { label: 'Triết học',    href: '/books?category=triet-hoc' },
      { label: 'Lịch sử',      href: '/books?category=lich-su' },
    ],
  },
  {
    label: 'Hỗ trợ',
    links: [
      { label: 'Cách đặt hàng', href: '#', modal: 'how-to-order' },
      { label: 'Đổi trả hàng',  href: '#', modal: 'returns' },
      { label: 'Thanh toán',    href: '#', modal: 'payment' },
      { label: 'Theo dõi đơn',  href: '#', modal: 'tracking' },
      { label: 'FAQ',           href: '#', modal: 'faq' },
      { label: 'Liên hệ',       href: '#', modal: 'contact' },
    ],
  },
  {
    label: 'Tài khoản',
    links: [
      { label: 'Đăng nhập',           href: '/auth/login' },
      { label: 'Đăng ký',             href: '/auth/register' },
      { label: 'Đơn hàng của tôi',    href: '/account/orders' },
      { label: 'Danh sách yêu thích', href: '/account/wishlist' },
    ],
  },
]

export const ANNOUNCEMENT_MESSAGE = 'Miễn phí vận chuyển đơn từ 250.000₫ · Đổi trả 30 ngày · Giao hàng toàn quốc'
