require('dotenv').config({ path: '../.env' })
require('dotenv').config()
const mongoose = require('mongoose')
const Article  = require('./models/Article')
const User     = require('./models/User')

const UNSPLASH = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`

const ARTICLES = [
  {
    title: '10 cuốn sách thay đổi cách nhìn về cuộc sống',
    category: 'Cảm nhận',
    readTime: 6,
    coverImage: UNSPLASH('photo-1481627834876-b7833e8f5570'),
    summary:
      'Có những cuốn sách ta đọc xong rồi để đó. Nhưng cũng có những cuốn, sau khi gấp lại, ta thấy thế giới quanh mình đã khác đi một chút. Đây là mười cuốn như thế.',
    content: `Đọc sách không phải lúc nào cũng để giải trí. Đôi khi, một cuốn sách đúng vào thời điểm đúng có thể khiến ta nhìn lại toàn bộ cách mình đang sống. Dưới đây là mười cuốn mà đội ngũ Hiệu Sách Chin tin rằng ai cũng nên đọc ít nhất một lần.

1. Đắc Nhân Tâm — Dale Carnegie
Không phải ngẫu nhiên mà cuốn sách này bán được hơn 30 triệu bản. Carnegie dạy ta một điều giản dị mà sâu sắc: muốn người khác lắng nghe mình, trước hết hãy thật lòng quan tâm đến họ.

2. Nhà Giả Kim — Paulo Coelho
Hành trình của cậu bé chăn cừu Santiago đi tìm kho báu thực ra là hành trình mỗi người đi tìm chính mình. "Khi bạn thật sự mong muốn điều gì, cả vũ trụ sẽ hợp lực giúp bạn đạt được nó."

3. Atomic Habits — James Clear
Thay đổi lớn bắt đầu từ những thói quen nhỏ 1% mỗi ngày. Clear chỉ ra rằng ta không vươn tới mục tiêu, ta rơi xuống mức độ của hệ thống mình xây dựng.

4. Sapiens: Lược Sử Loài Người — Yuval Noah Harari
Một cái nhìn táo bạo về việc loài người đã đi từ những bộ lạc nhỏ bé đến vị trí thống trị hành tinh như thế nào và cái giá phải trả.

5. Đi Tìm Lẽ Sống — Viktor Frankl
Viết từ trải nghiệm trong trại tập trung Đức Quốc Xã, Frankl khẳng định: khi không thể thay đổi hoàn cảnh, ta vẫn có thể chọn thái độ của mình trước nó.

6. Sức Mạnh Của Hiện Tại — Eckhart Tolle
Phần lớn khổ đau của con người đến từ việc sống trong quá khứ hoặc lo lắng về tương lai. Tolle mời ta trở về với khoảnh khắc duy nhất thật sự tồn tại: bây giờ.

7. Tuổi Trẻ Đáng Giá Bao Nhiêu — Rosie Nguyễn
Một cuốn sách gần gũi cho người trẻ Việt: hãy đọc, hãy đi, và hãy làm việc tử tế khi còn trẻ.

8. Người Giàu Có Nhất Thành Babylon — George S. Clason
Những bài học tài chính ngàn năm vẫn đúng, kể qua các câu chuyện ngụ ngôn dễ nhớ: hãy trả cho mình trước, và để tiền làm việc thay bạn.

9. Tôi Tài Giỏi, Bạn Cũng Thế — Adam Khoo
Phương pháp học tập và làm chủ tư duy, chứng minh rằng thành công là kỹ năng có thể rèn luyện được.

10. Cây Cam Ngọt Của Tôi — José Mauro de Vasconcelos
Câu chuyện về cậu bé Zezé sẽ khiến bạn vừa bật cười vừa rơi nước mắt, và nhắc ta nhớ về sự trong trẻo đã mất.

Bạn không cần đọc cả mười cuốn cùng lúc. Hãy bắt đầu từ cuốn nào khiến bạn tò mò nhất. Một cuốn sách hay, đọc đúng lúc, có thể là khởi đầu cho một phiên bản tốt hơn của chính bạn.`,
  },
  {
    title: 'Sách hay cho những chiều hè dài và lười biếng',
    category: 'Gợi ý mùa hè',
    readTime: 4,
    coverImage: UNSPLASH('photo-1474932430478-367dbb6832c1'),
    summary:
      'Mùa hè là lúc dành cho những cuốn sách đọc chậm, nhâm nhi từng trang bên ly trà đá. Đây là vài gợi ý cho những buổi chiều không vội vã.',
    content: `Có một kiểu đọc rất riêng của mùa hè: không đặt mục tiêu, không gạch chân, chỉ đọc cho vui. Nếu bạn đang tìm một cuốn để bầu bạn qua những buổi chiều dài, hãy thử vài gợi ý sau.

Dành cho ai muốn cười và khóc
"Tôi Thấy Hoa Vàng Trên Cỏ Xanh" của Nguyễn Nhật Ánh là lựa chọn không bao giờ sai. Tuổi thơ làng quê hiện lên trong veo, vừa hồn nhiên vừa man mác buồn. Đọc xong, bạn sẽ muốn gọi điện cho người bạn thân thời nhỏ.

Dành cho ai thích phiêu lưu
"Dế Mèn Phiêu Lưu Ký" của Tô Hoài không chỉ dành cho trẻ con. Hành trình của chú dế kiêu ngạo dần trưởng thành là một câu chuyện về lòng can đảm và tình bạn vượt thời gian.

Dành cho ai muốn suy ngẫm nhẹ nhàng
"Nhà Giả Kim" mỏng, dễ đọc, nhưng để lại dư âm dài. Rất hợp để đọc trong một buổi chiều rồi ngồi nhìn ra cửa sổ nghĩ ngợi.

Mẹo đọc mùa hè
Đừng ép mình đọc nhanh. Hãy để cuốn sách bên cạnh, đọc vài trang rồi nghỉ. Mùa hè không phải cuộc đua. Một cuốn sách hay, đọc thong thả, sẽ ở lại với bạn lâu hơn mười cuốn đọc vội.

Pha một ly trà, tìm một góc mát, và để trang sách lật theo gió. Đó đã là một mùa hè trọn vẹn rồi.`,
  },
  {
    title: 'Làm sao để trẻ yêu thích đọc sách từ nhỏ?',
    category: 'Thiếu nhi',
    readTime: 5,
    coverImage: UNSPLASH('photo-1503454537195-1dcabb73ffb9'),
    summary:
      'Không đứa trẻ nào sinh ra đã ghét sách. Tình yêu đọc sách được nuôi dưỡng từ những thói quen nhỏ trong gia đình. Đây là vài cách bố mẹ có thể bắt đầu.',
    content: `Nhiều phụ huynh than phiền con mình chỉ mê điện thoại, không chịu đọc sách. Nhưng sự thật là trẻ học bằng cách bắt chước, và tình yêu sách thường bắt đầu từ chính người lớn.

1. Đọc cùng con, đừng bắt con đọc
Trẻ nhỏ thích được bố mẹ đọc cho nghe hơn là bị giao một cuốn sách rồi để đó. Mười lăm phút đọc truyện trước giờ ngủ tạo nên cả một bầu trời tưởng tượng và kỷ niệm.

2. Để sách ở khắp nơi trong nhà
Một giá sách thấp ngang tầm với của trẻ, vài cuốn truyện tranh trên bàn, sách trong giỏ xe. Khi sách hiện diện tự nhiên, trẻ sẽ cầm lên mà không cần ai nhắc.

3. Đừng biến đọc sách thành nhiệm vụ
Khi đọc sách gắn với "phải đọc xong chương này mới được chơi", trẻ sẽ ghét nó. Hãy để đọc sách là phần thưởng, là niềm vui, không phải hình phạt.

4. Chọn sách hợp lứa tuổi
Sách tranh nhiều màu cho bé mầm non, truyện ngắn có nhân vật gần gũi cho bé tiểu học. "Dế Mèn Phiêu Lưu Ký" hay "Cây Cam Ngọt Của Tôi" là những lựa chọn kinh điển.

5. Làm gương
Nếu bố mẹ tối nào cũng đọc sách thay vì lướt điện thoại, trẻ sẽ coi đó là điều bình thường. Trẻ không nghe lời ta nói, trẻ nhìn việc ta làm.

Nuôi dưỡng một đứa trẻ yêu sách không cần ngân sách lớn hay phương pháp cao siêu. Nó cần sự kiên nhẫn, một chút thời gian mỗi ngày, và niềm tin rằng mỗi trang sách đang âm thầm xây nên thế giới nội tâm của con.`,
  },
  {
    title: 'Đọc sách giấy hay sách điện tử: cuộc tranh luận chưa hồi kết',
    category: 'Góc đọc sách',
    readTime: 5,
    coverImage: UNSPLASH('photo-1512820790803-83ca734da794'),
    summary:
      'Người yêu mùi giấy mới, người mê sự tiện lợi của màn hình. Vậy đâu mới là cách đọc tốt hơn? Có lẽ câu hỏi đúng không phải là "cái nào", mà là "khi nào".',
    content: `Mỗi lần nhắc đến chuyện đọc sách, kiểu gì cũng có người hỏi: sách giấy hay Kindle? Thực ra, cả hai đều có chỗ đứng riêng, và việc chọn cái nào phụ thuộc vào bạn đang cần gì.

Sách giấy: trải nghiệm trọn vẹn
Cảm giác lật trang, mùi giấy, sức nặng của cuốn sách trên tay là điều màn hình không thay thế được. Nhiều nghiên cứu cho thấy đọc sách giấy giúp ghi nhớ tốt hơn, vì não bộ gắn thông tin với vị trí vật lý trên trang. Sách giấy cũng không làm mỏi mắt và không có thông báo nào nhảy ra cắt ngang.

Sách điện tử: gọn nhẹ và tiện lợi
Cả một thư viện nằm gọn trong thiết bị mỏng hơn một cuốn tạp chí. Bạn có thể chỉnh cỡ chữ, tra từ ngay lập tức, đọc trong bóng tối. Với người hay di chuyển, sách điện tử là cứu cánh.

Vậy chọn gì?
Câu trả lời thành thật là: tùy hoàn cảnh. Một cuốn tiểu thuyết để nhâm nhi cuối tuần, hãy chọn sách giấy. Một cuốn sách kỹ năng để tra cứu trên đường công tác, sách điện tử tiện hơn.

Điều quan trọng nhất không phải định dạng, mà là bạn có thật sự đọc hay không. Một cuốn ebook được đọc hết vẫn hơn một cuốn sách giấy đẹp đẽ nằm phủ bụi trên kệ.

Ở Hiệu Sách Chin, chúng tôi vẫn tin vào vẻ đẹp của sách giấy. Nhưng hơn cả, chúng tôi tin vào thói quen đọc, dù bằng hình thức nào.`,
  },
  {
    title: 'Xây dựng thói quen đọc 20 phút mỗi ngày',
    category: 'Kỹ năng sống',
    readTime: 4,
    coverImage: UNSPLASH('photo-1456513080510-7bf3a84b82f8'),
    summary:
      'Bạn không cần đọc 50 cuốn một năm. Chỉ cần 20 phút mỗi ngày, đều đặn, là đã có thể đọc xong hơn một chục cuốn sách. Bí quyết nằm ở sự bền bỉ, không phải tốc độ.',
    content: `Nhiều người đặt mục tiêu "năm nay sẽ đọc 30 cuốn sách" rồi bỏ cuộc sau tháng đầu tiên. Vấn đề không nằm ở ý chí, mà ở cách đặt mục tiêu. Thay vì đếm số cuốn, hãy đếm số phút.

Vì sao 20 phút?
20 phút đủ ngắn để không tạo áp lực, nhưng đủ dài để đọc khoảng 15 đến 20 trang. Nhân với 365 ngày, bạn đọc được hơn 6000 trang một năm, tương đương 15 đến 20 cuốn sách. Tất cả chỉ từ 20 phút mỗi ngày.

Gắn việc đọc với một thói quen sẵn có
Đây là nguyên tắc James Clear gọi là "habit stacking": gắn thói quen mới vào thói quen cũ. Ví dụ: "Sau khi pha cà phê sáng, tôi sẽ đọc 20 phút." Hành động cũ trở thành lời nhắc cho hành động mới.

Để sách trong tầm mắt
Đặt cuốn sách đang đọc trên gối, trên bàn ăn sáng, trong túi xách. Càng dễ thấy, càng dễ đọc. Càng phải đi tìm, càng dễ quên.

Đừng sợ bỏ dở một cuốn sách dở
Cuộc đời quá ngắn để đọc những cuốn không hợp với mình. Nếu sau 50 trang bạn vẫn thấy chán, hãy gấp lại và chọn cuốn khác. Đọc sách là niềm vui, không phải nghĩa vụ.

Theo dõi tiến độ
Đánh dấu mỗi ngày bạn đọc trên lịch. Chuỗi ngày liên tiếp sẽ tạo động lực kỳ lạ: bạn sẽ không muốn làm đứt nó.

Hãy bắt đầu ngay hôm nay, với cuốn sách gần bạn nhất, và chỉ 20 phút. Mai lại 20 phút nữa. Một năm sau nhìn lại, bạn sẽ ngạc nhiên vì mình đã đi xa đến đâu.`,
  },
  {
    title: 'Vì sao những câu chuyện cũ vẫn khiến ta rung động?',
    category: 'Văn học',
    readTime: 6,
    coverImage: UNSPLASH('photo-1495446815901-a7297e633e8d'),
    summary:
      'Từ Dế Mèn đến Hoàng Tử Bé, có những cuốn sách đã nhiều thập kỷ tuổi nhưng đọc lại vẫn thấy mới. Điều gì khiến một câu chuyện vượt qua được thời gian?',
    content: `Có một nghịch lý thú vị: trong thời đại mọi thứ thay đổi chóng mặt, những cuốn sách được yêu thích nhất lại thường là những cuốn cũ. Vì sao một câu chuyện viết cách đây 50, 70, thậm chí cả trăm năm vẫn chạm được vào trái tim người đọc hôm nay?

Vì nó nói về con người, không phải thời đại
Công nghệ đổi thay, nhưng nỗi cô đơn, niềm hy vọng, khát khao được yêu thương thì không. Khi "Hoàng Tử Bé" nói "Điều cốt lõi thì mắt thường không nhìn thấy được", câu ấy đúng vào năm 1943 và vẫn đúng hôm nay.

Vì nó được viết bằng sự chân thành
Những tác phẩm sống lâu thường không cố làm dáng. Tô Hoài viết "Dế Mèn" bằng cái nhìn trong trẻo, hài hước mà sâu sắc. Sự chân thành ấy không có hạn sử dụng.

Vì mỗi lần đọc lại là một lần khác
Đọc "Cây Cam Ngọt Của Tôi" lúc 15 tuổi, ta thấy một câu chuyện buồn. Đọc lại lúc làm cha mẹ, ta thấy cả một nỗi đau khác mà ngày xưa chưa hiểu. Sách hay lớn lên cùng người đọc.

Vì chúng kết nối các thế hệ
Khi bạn đọc cho con cuốn sách mà ngày xưa bố mẹ từng đọc cho bạn, một sợi dây vô hình nối liền ba thế hệ. Đó là điều rất ít phương tiện giải trí nào làm được.

Có lẽ vì thế mà ở Hiệu Sách Chin, bên cạnh những đầu sách mới, chúng tôi luôn dành một góc trang trọng cho những câu chuyện cũ. Bởi cái đẹp thật sự thì không bao giờ lỗi thời. Lần tới khi phân vân không biết đọc gì, hãy thử quay về một cuốn kinh điển. Biết đâu nó lại nói với bạn điều gì đó hoàn toàn mới.`,
  },
]

async function seedArticles() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hieu-sach-chin')
  console.log('Connected to MongoDB')

  // Gán tác giả là admin (nếu có)
  const admin = await User.findOne({ role: 'admin' }).select('_id')
  const author = admin?._id

  let created = 0
  let updated = 0
  for (const a of ARTICLES) {
    const doc = { ...a, status: 'PUBLISHED', author }
    const res = await Article.findOneAndUpdate(
      { title: a.title },
      { $set: doc },
      { upsert: true, new: true, rawResult: true }
    )
    if (res.lastErrorObject?.updatedExisting) updated++
    else created++
  }

  console.log(`✅  Bài viết: ${created} tạo mới, ${updated} cập nhật (tổng ${ARTICLES.length})`)
  await mongoose.disconnect()
  console.log('Done.')
}

seedArticles().catch(err => { console.error(err); process.exit(1) })
