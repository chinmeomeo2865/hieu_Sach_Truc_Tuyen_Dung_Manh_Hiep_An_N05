require('dotenv').config({ path: '../.env' })
require('dotenv').config()
const mongoose = require('mongoose')
const Product  = require('./models/Product')
const User     = require('./models/User')

const OL  = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
const OLC = (id)   => `https://covers.openlibrary.org/b/id/${id}-L.jpg`
const TK  = (path) => `https://salt.tikicdn.com/cache/280x280/ts/product/${path}`
const YT  = (id)   => `https://www.youtube.com/watch?v=${id}`

const PRODUCTS = [
  // ── KỸ NĂNG SỐNG ──────────────────────────────────────────────────────────
  {
    title: 'Đắc Nhân Tâm', author: 'Dale Carnegie',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 89000, stock: 48, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Kiệt tác bất hủ về nghệ thuật giao tiếp và tạo dựng mối quan hệ. Đã bán hơn 30 triệu bản trên toàn thế giới.',
    image: OL('9780671723651'), trailer: YT('jXc7XF6ApAw'),
  },
  {
    title: 'Atomic Habits', author: 'James Clear',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 98000, stock: 55, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Thay đổi 1% mỗi ngày — bí quyết xây dựng thói quen tốt và phá bỏ thói quen xấu một cách khoa học.',
    image: OL('9780735211292'), trailer: YT('9kWQvF-Whik'),
  },
  {
    title: 'Mindset: Tư Duy Thành Công', author: 'Carol S. Dweck',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 78000, originalPrice: 95000, stock: 32, badge: 'sale', rating: 0, reviewCount: 0,
    description: 'Khám phá sự khác biệt giữa "tư duy cố định" và "tư duy phát triển" — chìa khóa cho thành công bền vững.',
    image: OL('9780345472328'), trailer: YT('wh9QLqnQRls'),
  },
  {
    title: '7 Thói Quen Của Người Thành Đạt', author: 'Stephen R. Covey',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 105000, stock: 28, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Cuốn sách kinh điển định hình lại cách tiếp cận về hiệu quả cá nhân và lãnh đạo.',
    image: OL('9780743269513'), trailer: YT('ktlTxC4YBwE'),
  },
  {
    title: 'Tư Duy Nhanh Và Chậm', author: 'Daniel Kahneman',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 125000, stock: 20, rating: 0, reviewCount: 0,
    description: 'Nobel kinh tế học giải thích hai hệ thống tư duy chi phối mọi quyết định của con người.',
    image: OL('9780374533557'), trailer: YT('CjVQJdIrDJ0'),
  },
  {
    title: 'Sức Mạnh Của Thói Quen', author: 'Charles Duhigg',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 88000, stock: 35, rating: 0, reviewCount: 0,
    description: 'Tại sao chúng ta làm những gì chúng ta làm trong cuộc sống và kinh doanh.',
    image: OL('9780812981605'), trailer: YT('OMbsGBlpP30'),
  },
  {
    title: 'Bố Già Dạy Con Làm Giàu', author: 'Robert T. Kiyosaki',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 95000, stock: 42, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Cuốn sách về tài chính cá nhân bán chạy nhất mọi thời đại — tư duy của người giàu vs. người nghèo.',
    image: OL('9781612680194'), trailer: YT('azq_S3TDShI'),
  },
  {
    title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu', author: 'Rosie Nguyễn',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 68000, stock: 60, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Cẩm nang sống dành cho người trẻ Việt: quản lý thời gian, tiền bạc, và định hướng tương lai.',
    image: TK('1f/7c/f9/564b1a3c8921201587bc8625dc8f318b.jpg'), trailer: YT('UH-Alp2H8w8'),
  },
  {
    title: 'Người Giàu Có Nhất Thành Babylon', author: 'George S. Clason',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 72000, stock: 38, rating: 0, reviewCount: 0,
    description: 'Những bài học tài chính cổ điển qua những câu chuyện kể từ thành Babylon huyền thoại.',
    image: OL('9780451205360'), trailer: YT('koMNfqxGUC0'),
  },
  {
    title: 'Đừng Bao Giờ Đi Ăn Một Mình', author: 'Keith Ferrazzi',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 82000, stock: 25, rating: 0, reviewCount: 0,
    description: 'Bí quyết xây dựng mạng lưới quan hệ thực sự — nền tảng của mọi thành công trong sự nghiệp.',
    image: OL('9780385512053'), trailer: YT('jXc7XF6ApAw'),
  },
  {
    title: 'Khéo Ăn Nói Sẽ Có Được Thiên Hạ', author: 'Trác Nhã',
    category: 'Kỹ năng sống', categorySlug: 'ky-nang',
    price: 135000, stock: 35, rating: 0, reviewCount: 0,
    description: 'Bộ sách thực hành về nghệ thuật giao tiếp, đàm phán và ứng xử khéo léo trong mọi tình huống.',
    image: TK('0c/f7/7b/c8c6ff915b8c7dcfc4534f3d9c737a0c.jpg'), trailer: YT('jXc7XF6ApAw'),
  },

  // ── VĂN HỌC ───────────────────────────────────────────────────────────────
  {
    title: 'Nhà Giả Kim', author: 'Paulo Coelho',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 79000, stock: 45, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Hành trình của chàng chăn cừu Santiago đi tìm kho báu — và khám phá ra ý nghĩa đích thực của cuộc đời.',
    image: OL('9780061122415'), trailer: YT('He4moNnEnIg'),
  },
  {
    title: 'Người Đua Diều', author: 'Khaled Hosseini',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 92000, stock: 28, rating: 0, reviewCount: 0,
    description: 'Câu chuyện về tình bạn, sự phản bội và chuộc lỗi trên nền đất nước Afghanistan đầy biến động.',
    image: OL('9781594631931'), trailer: YT('m4MK_VHmFsI'),
  },
  {
    title: 'Ngàn Mặt Trời Rực Rỡ', author: 'Khaled Hosseini',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 109000, stock: 30, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Câu chuyện xúc động về hai người phụ nữ Afghanistan cùng chung số phận qua bốn thập kỷ chiến tranh, nhưng vẫn giữ vững tình người.',
    image: OL('9781594483851'), trailer: YT('m4MK_VHmFsI'),
  },
  {
    title: 'Trăm Năm Cô Đơn', author: 'Gabriel García Márquez',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 145000, stock: 18, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Kiệt tác văn học Latin America — biên niên sử của dòng họ Buendía qua bảy thế hệ tại Macondo.',
    image: OL('9780060883287'), trailer: YT('cxpIjz3TPBQ'),
  },
  {
    title: '1984', author: 'George Orwell',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 88000, stock: 35, rating: 0, reviewCount: 0,
    description: 'Dystopia kinh điển về một xã hội toàn trị nơi Anh Cả luôn dõi theo bạn. Tác phẩm tiên tri cho thế kỷ 21.',
    image: OL('9780451524935'), trailer: YT('J6T9jQXzDrE'),
  },
  {
    title: 'Kẻ Trộm Sách', author: 'Markus Zusak',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 180000, stock: 25, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Câu chuyện Thế chiến thứ II được kể qua lời của Thần Chết về cô bé Liesel và tình yêu bất diệt với những cuốn sách giữa bom đạn.',
    image: OL('9780375842207'), trailer: YT('_8xNxk5iyPc'),
  },
  {
    title: 'Tội Ác Và Hình Phạt', author: 'Fyodor Dostoevsky',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 180000, stock: 20, rating: 0, reviewCount: 0,
    description: 'Kiệt tác văn học Nga về cuộc đấu tranh tâm lý của sinh viên Raskolnikov — khám phá chiều sâu tâm hồn và sự cứu rỗi qua đau khổ.',
    image: OL('9780679734505'), trailer: YT('z2FGZqMk3X0'),
  },
  {
    title: 'Ông Già Và Biển Cả', author: 'Ernest Hemingway',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 85000, stock: 30, rating: 0, reviewCount: 0,
    description: 'Kiệt tác đoạt giải Nobel — cuộc chiến đơn độc của lão ngư Santiago với con cá kiếm khổng lồ, biểu tượng về ý chí và phẩm giá con người.',
    image: OL('9780684801223'), trailer: YT('n23E3eN4b2g'),
  },
  {
    title: 'Nhật Ký Anne Frank', author: 'Anne Frank',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 95000, stock: 35, rating: 0, reviewCount: 0,
    description: 'Nhật ký của cô gái Do Thái viết trong hai năm ẩn náu tại Amsterdam dưới thời Đức Quốc xã — chứng nhân lịch sử đau thương và cảm động.',
    image: OL('9780385473781'), trailer: YT('_hE2G1m2UgM'),
  },
  {
    title: 'Chuyện Con Mèo Dạy Hải Âu Bay', author: 'Luis Sepúlveda',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 79000, stock: 40, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Câu chuyện kỳ diệu về chú mèo đen Zorba hứa với hải âu hấp hối sẽ nuôi và dạy chim con bay — bài thơ về tình yêu thương và lòng trắc ẩn.',
    image: OLC(277600), trailer: YT('tLNadHuYPTU'),
  },
  {
    title: 'Giết Con Chim Nhại', author: 'Harper Lee',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 95000, stock: 22, rating: 0, reviewCount: 0,
    description: 'Giải Pulitzer 1961 — câu chuyện về công lý và bất bình đẳng nhìn qua mắt bé Scout ở miền Nam nước Mỹ.',
    image: OL('9780446310789'), trailer: YT('rSEGDUiVHSI'),
  },
  {
    title: 'Hoàng Tử Bé', author: 'Antoine de Saint-Exupéry',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 55000, stock: 70, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: '"Điều quan trọng nhất thì mắt thường không nhìn thấy được." — Tác phẩm triết học dành cho mọi lứa tuổi, dịch sang 250 ngôn ngữ.',
    image: OL('9780156012195'), trailer: YT('bqB_1E4lajI'),
  },
  {
    title: 'Cây Cam Ngọt Của Tôi', author: 'José Mauro de Vasconcelos',
    category: 'Văn học', categorySlug: 'van-hoc',
    price: 85000, stock: 32, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Câu chuyện đẹp buồn về cậu bé Zezé và người bạn đặc biệt — chiếc cây cam nhỏ trong vườn nhà.',
    image: OL('9781800246041'), trailer: YT('pewsNVkp6I0'),
  },

  // ── VĂN HỌC VIỆT NAM ──────────────────────────────────────────────────────
  {
    title: 'Mắt Biếc', author: 'Nguyễn Nhật Ánh',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 65000, stock: 50, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Tình yêu học trò trong sáng và nỗi đau nhớ nhung — áng văn đẹp nhất của Nguyễn Nhật Ánh.',
    image: OLC(13258074), trailer: YT('aFpIjnYAPoA'),
  },
  {
    title: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', author: 'Nguyễn Nhật Ánh',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 58000, stock: 42, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Cuốn sách không phải cho trẻ em, mà cho những người đã từng là trẻ em — ký ức tuổi thơ trong veo, vô lo.',
    image: OL('9786041004757'), trailer: YT('2aH5_OOLHdg'),
  },
  {
    title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', author: 'Nguyễn Nhật Ánh',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 62000, stock: 38, rating: 0, reviewCount: 0,
    description: 'Câu chuyện về hai anh em Thiều và Tường — tuổi thơ bình dị và những bài học về tình thương. Được chuyển thể thành phim điện ảnh nổi tiếng.',
    image: OL('9786041158023'), trailer: YT('ZAQ-IBSDUzU'),
  },
  {
    title: 'Mùa Hè Không Tên', author: 'Nguyễn Nhật Ánh',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 115000, stock: 40, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Tác phẩm mới nhất của Nguyễn Nhật Ánh — những câu chuyện tuổi thơ tinh nghịch tại quê hương Đo Đo, Quảng Nam.',
    image: TK('33/0d/24/24fabc33c850056116983b365ce943a0.jpg'), trailer: YT('ZAQ-IBSDUzU'),
  },
  {
    title: 'Tôi Là Bêtô', author: 'Nguyễn Nhật Ánh',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 115000, stock: 30, rating: 0, reviewCount: 0,
    description: 'Những câu chuyện ngộ nghĩnh về chú chó Bêtô nhìn thế giới loài người qua con mắt hồn nhiên — tái bản hơn 50 lần.',
    image: TK('a4/c8/f2/8949d89bdddb677df2c3325c6d2dc06d.jpg'), trailer: YT('2aH5_OOLHdg'),
  },
  {
    title: 'Số Đỏ', author: 'Vũ Trọng Phụng',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 68000, stock: 30, rating: 0, reviewCount: 0,
    description: 'Tiểu thuyết trào phúng kinh điển của văn học hiện đại Việt Nam — phê phán sâu sắc xã hội thực dân nửa phong kiến.',
    image: TK('e3/1f/53/b64a434e0f6806575a1d9aa3884e5007.jpg'), trailer: YT('jXc7XF6ApAw'),
  },
  {
    title: 'Đất Rừng Phương Nam', author: 'Đoàn Giỏi',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 135000, stock: 35, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Kiệt tác văn học Việt Nam về cậu bé An lưu lạc trong vùng rừng rậm miền Nam — khắc họa vẻ đẹp thiên nhiên và con người Nam Bộ.',
    image: TK('85/7a/b7/80852ec0adc1dcb94416f1abf863786d.png'), trailer: YT('zASuOmaZt7E'),
  },
  {
    title: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài',
    category: 'Văn học Việt Nam', categorySlug: 'van-hoc',
    price: 52000, stock: 55, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Cuộc phiêu lưu của chú Dế Mèn qua thế giới côn trùng — tác phẩm thiếu nhi kinh điển nhất Việt Nam.',
    image: TK('f1/c7/3e/2b686d818fc0f3e0fc33c9e4ff15f432.png'), trailer: YT('_17j-cXBl_c'),
  },

  // ── TRIẾT HỌC ─────────────────────────────────────────────────────────────
  {
    title: 'Dám Bị Ghét', author: 'Ichiro Kishimi & Fumitake Koga',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 88000, stock: 40, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Triết học Adler qua đối thoại — can đảm để sống tự do và không bị xiềng xích bởi sự phán xét của người khác.',
    image: TK('78/b3/13/de903c0ebaa38ba594634a009072ce7d.jpeg'), trailer: YT('5z7UjnFiZpc'),
  },
  {
    title: 'Nghệ Thuật Tinh Tế Của Việc Không Quan Tâm', author: 'Mark Manson',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 82000, stock: 38, rating: 0, reviewCount: 0,
    description: 'Cách tiếp cận phản trực giác để sống một cuộc đời tốt hơn — biết chọn điều đáng quan tâm.',
    image: OL('9780062641540'), trailer: YT('WqnhN2Rzaqc'),
  },
  {
    title: 'Ikigai: Bí Quyết Sống Trường Thọ Và Hạnh Phúc', author: 'Héctor García & Francesc Miralles',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 85000, stock: 45, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Triết lý sống của người Nhật từ làng trường thọ Ogimi — tìm ra lý do để thức dậy mỗi sáng.',
    image: OL('9780143130727'), trailer: YT('pk-PGsNmGLQ'),
  },
  {
    title: 'Đi Tìm Lẽ Sống', author: 'Viktor E. Frankl',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 79000, stock: 35, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Hồi ký của bác sĩ tâm lý sống sót qua trại tập trung Auschwitz — về ý nghĩa và sức mạnh tinh thần con người.',
    image: OL('9780807014271'), trailer: YT('fHKbCeUJKoE'),
  },
  {
    title: 'Sức Mạnh Của Hiện Tại', author: 'Eckhart Tolle',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 88000, stock: 30, rating: 0, reviewCount: 0,
    description: 'Hướng dẫn thiêng liêng để giác ngộ tinh thần — sống trọn vẹn trong từng khoảnh khắc hiện tại.',
    image: OL('9781577314806'), trailer: YT('8ShTlFKhMXc'),
  },
  {
    title: 'Suy Tưởng — Meditations', author: 'Marcus Aurelius',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 180000, stock: 22, rating: 0, reviewCount: 0,
    description: 'Nhật ký triết học của Hoàng đế La Mã — cuốn kinh điển Stoicism về lòng kiên nhẫn, điềm tĩnh và trí tuệ.',
    image: OL('9780812968255'), trailer: YT('Auuk1y4DRgk'),
  },
  {
    title: 'Đạo Đức Kinh', author: 'Lão Tử (Nguyễn Hiến Lê dịch)',
    category: 'Triết học', categorySlug: 'triet-hoc',
    price: 68000, stock: 25, rating: 0, reviewCount: 0,
    description: '81 chương triết học cổ đại về con đường thuận tự nhiên và nghệ thuật vô vi. Bản dịch được đánh giá cao nhất tại Việt Nam.',
    image: OL('9780061142666'), trailer: YT('nMEjFJSFqEs'),
  },

  // ── LỊCH SỬ & KHOA HỌC ───────────────────────────────────────────────────
  {
    title: 'Sapiens: Lược Sử Loài Người', author: 'Yuval Noah Harari',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 120000, stock: 30, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Hành trình 70.000 năm của loài người — từ vượn châu Phi đến bá chủ thế giới.',
    image: OL('9780062316097'), trailer: YT('hfbI14Mr3wQ'),
  },
  {
    title: 'Homo Deus: Lược Sử Tương Lai', author: 'Yuval Noah Harari',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 125000, stock: 25, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Tương lai của nhân loại trong thế kỷ 21 — khi AI, dữ liệu và công nghệ sinh học định hình lại sự sống.',
    image: OL('9780062464316'), trailer: YT('4ChHc5jhZxs'),
  },
  {
    title: '21 Bài Học Cho Thế Kỷ 21', author: 'Yuval Noah Harari',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 115000, stock: 28, rating: 0, reviewCount: 0,
    description: 'Những câu hỏi cấp bách nhất mà chúng ta phải đối mặt ngay hôm nay — từ công nghệ đến chính trị và ý nghĩa.',
    image: OL('9780525512196'), trailer: YT('Baj9UDrXsKg'),
  },
  {
    title: 'Lược Sử Thời Gian', author: 'Stephen Hawking',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 95000, stock: 20, rating: 0, reviewCount: 0,
    description: 'Từ Big Bang đến hố đen — nhà vật lý thiên tài giải thích vũ trụ theo cách mọi người đều hiểu được.',
    image: OL('9780553380163'), trailer: YT('WenHLfTF7u4'),
  },
  {
    title: 'Súng, Vi Trùng Và Thép', author: 'Jared Diamond',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 135000, stock: 18, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Giải mã tại sao một số nền văn minh thống trị lịch sử trong khi những nền khác lại bị chinh phục.',
    image: OL('9780393354324'), trailer: YT('NMrDNpzSMgk'),
  },
  {
    title: 'Vũ Trụ Trong Vỏ Hạt Dẻ', author: 'Stephen Hawking',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 112000, stock: 15, rating: 0, reviewCount: 0,
    description: 'Tiếp nối Lược Sử Thời Gian — Hawking khám phá M-theory, supergravity và thế giới 11 chiều.',
    image: OL('9780553802023'), trailer: YT('WenHLfTF7u4'),
  },
  {
    title: 'Thế Giới Phẳng', author: 'Thomas L. Friedman',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 115000, stock: 22, rating: 0, reviewCount: 0,
    description: 'Toàn cầu hóa thế kỷ 21 — tại sao thế giới bị phẳng hóa và điều đó có nghĩa gì với bạn.',
    image: OL('9780312425074'), trailer: YT('jXc7XF6ApAw'),
  },
  {
    title: 'Bản Đồ Tư Duy', author: 'Tony Buzan',
    category: 'Lịch sử & Khoa học', categorySlug: 'lich-su',
    price: 88000, stock: 32, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Kỹ thuật Mind Map cách mạng hóa cách ghi chép, ghi nhớ và tư duy sáng tạo.',
    image: OL('9780452273221'), trailer: YT('jXc7XF6ApAw'),
  },

  // ── THIẾU NHI ─────────────────────────────────────────────────────────────
  {
    title: 'Totto-chan Bên Cửa Sổ', author: 'Tetsuko Kuroyanagi',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 72000, stock: 45, badge: 'best', rating: 0, reviewCount: 0, featured: true,
    description: 'Câu chuyện về ngôi trường toa tàu kỳ diệu — nơi mọi trẻ em đều được tự do học theo cách của mình.',
    image: OL('9780870116957'), trailer: YT('f-tRSG3Rm5c'),
  },
  {
    title: 'Harry Potter Và Hòn Đá Phù Thủy', author: 'J.K. Rowling',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 135000, stock: 38, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Khởi đầu của cuộc hành trình kỳ diệu tại Hogwarts — câu chuyện về tình bạn, lòng dũng cảm và phép thuật.',
    image: OL('9780590353427'), trailer: YT('VyHV0BRtdxo'),
  },
  {
    title: 'Kính Vạn Hoa (Trọn Bộ 54 Tập)', author: 'Nguyễn Nhật Ánh',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 185000, originalPrice: 220000, stock: 12, badge: 'sale', rating: 0, reviewCount: 0,
    description: 'Bộ truyện thiếu nhi dài nhất của Nguyễn Nhật Ánh — thế giới học trò hồn nhiên và đáng yêu.',
    image: TK('cf/ed/52/9da75f139d1107cc563d076768cb04d9.jpg'), trailer: YT('2aH5_OOLHdg'),
  },
  {
    title: 'Hai Vạn Dặm Dưới Biển', author: 'Jules Verne',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 99000, stock: 35, rating: 0, reviewCount: 0,
    description: 'Chuyến hành trình huyền bí dưới đáy đại dương cùng thuyền trưởng Nemo trên tàu ngầm Nautilus.',
    image: OL('9780141394930'), trailer: YT('F52mFQ1DYhU'),
  },
  {
    title: 'Không Gia Đình', author: 'Hector Malot',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 125000, stock: 28, rating: 0, reviewCount: 0,
    description: 'Câu chuyện đầy cảm động về cậu bé Rémi lưu lạc đi tìm gia đình thật sự — kiệt tác văn học thiếu nhi Pháp.',
    image: OL('9781481270328'), trailer: YT('tLNadHuYPTU'),
  },
  {
    title: 'Charlie Và Nhà Máy Sô-cô-la', author: 'Roald Dahl',
    category: 'Thiếu nhi', categorySlug: 'thieu-nhi',
    price: 78000, stock: 35, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Cuộc phiêu lưu kỳ diệu của cậu bé Charlie Bucket trong nhà máy chocolate bí ẩn của Willy Wonka.',
    image: OL('9780142410318'), trailer: YT('V6ZYhCeBnvQ'),
  },

  // ── KINH TẾ & KHỞI NGHIỆP ────────────────────────────────────────────────
  {
    title: 'Zero to One', author: 'Peter Thiel & Blake Masters',
    category: 'Kinh tế & Khởi nghiệp', categorySlug: 'ky-nang',
    price: 88000, stock: 30, badge: 'new', rating: 0, reviewCount: 0,
    description: 'Nhà sáng lập PayPal chia sẻ bí quyết xây dựng startup đột phá — làm thế nào để tạo ra thứ gì đó hoàn toàn mới.',
    image: OL('9780804139298'), trailer: YT('rFZiMrIbwPE'),
  },
  {
    title: 'Khởi Nghiệp Tinh Gọn', author: 'Eric Ries',
    category: 'Kinh tế & Khởi nghiệp', categorySlug: 'ky-nang',
    price: 92000, stock: 25, rating: 0, reviewCount: 0,
    description: 'Phương pháp Lean Startup — xây dựng sản phẩm nhanh, học hỏi từ thực tế và tránh lãng phí nguồn lực.',
    image: OL('9780307887894'), trailer: YT('fEvKo90q3MQ'),
  },
  {
    title: 'Từ Tốt Đến Vĩ Đại', author: 'Jim Collins',
    category: 'Kinh tế & Khởi nghiệp', categorySlug: 'ky-nang',
    price: 95000, stock: 22, badge: 'best', rating: 0, reviewCount: 0,
    description: 'Nghiên cứu 5 năm về những công ty chuyển mình từ tốt thành vĩ đại — những nguyên tắc bất biến của sự xuất sắc.',
    image: OL('9780066620992'), trailer: YT('ivbDuwytxwI'),
  },
  {
    title: 'Nghĩ Giàu Làm Giàu', author: 'Napoleon Hill',
    category: 'Kinh tế & Khởi nghiệp', categorySlug: 'ky-nang',
    price: 75000, stock: 40, badge: 'best', rating: 0, reviewCount: 0,
    description: '13 nguyên tắc thành công được đúc kết từ 500 người giàu nhất nước Mỹ — kinh điển mọi thời đại.',
    image: OL('9780449214923'), trailer: YT('3bBxmCxlEak'),
  },
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

  await Product.deleteMany({})
  await User.deleteMany({ email: ADMIN.email })

  const products = await Product.insertMany(PRODUCTS)
  console.log(`✅  Seeded ${products.length} products`)

  const admin = await User.create(ADMIN)
  console.log(`✅  Admin created: ${admin.email}`)

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
