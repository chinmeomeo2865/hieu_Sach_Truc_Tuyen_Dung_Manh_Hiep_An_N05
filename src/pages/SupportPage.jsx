import { useState } from 'react'
import { Link } from 'react-router-dom'

const TOPICS = [
  {
    id: 'how-to-order',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
      </svg>
    ),
    title: 'Cách đặt hàng',
    summary: 'Hướng dẫn từng bước đặt hàng trực tuyến tại Hiệu Sách Chin.',
    content: [
      { step: '1', text: 'Tìm sách bạn muốn mua tại trang Danh mục hoặc dùng thanh tìm kiếm.' },
      { step: '2', text: 'Nhấn "Thêm vào giỏ" và tiến hành kiểm tra giỏ hàng.' },
      { step: '3', text: 'Điền địa chỉ giao hàng và chọn phương thức thanh toán (COD hoặc PayOS/QR).' },
      { step: '4', text: 'Xác nhận đơn hàng — bạn sẽ nhận email xác nhận ngay sau đó.' },
      { step: '5', text: 'Theo dõi trạng thái đơn tại trang Tài khoản → Đơn hàng của tôi.' },
    ],
  },
  {
    id: 'returns',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Đổi trả hàng',
    summary: 'Chính sách đổi trả trong 30 ngày, không cần lý do.',
    content: [
      { step: '✓', text: 'Đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.' },
      { step: '✓', text: 'Sản phẩm còn nguyên vẹn, chưa qua sử dụng, còn đầy đủ bao bì.' },
      { step: '✓', text: 'Liên hệ hotline 0383 687 670 hoặc email để được hỗ trợ.' },
      { step: '✓', text: 'Hoàn tiền trong 3–5 ngày làm việc sau khi nhận hàng hoàn trả.' },
      { step: '✗', text: 'Không áp dụng với sách đã bị rách, ẩm mốc hoặc có dấu hiệu đã đọc nhiều.' },
    ],
  },
  {
    id: 'payment',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'Thanh toán',
    summary: 'Hỗ trợ COD, PayOS/VietQR và các ví điện tử phổ biến.',
    content: [
      { step: '💵', text: 'COD (Thanh toán khi nhận hàng) — không phụ phí.' },
      { step: '📱', text: 'PayOS / VietQR — quét mã QR, chuyển khoản tức thì.' },
      { step: '🔒', text: 'Mọi giao dịch đều được mã hóa và bảo mật.' },
      { step: 'ℹ️', text: 'Đơn PayOS chưa thanh toán sẽ tự hủy sau 30 phút.' },
    ],
  },
  {
    id: 'tracking',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Theo dõi đơn hàng',
    summary: 'Xem trạng thái đơn hàng và lịch sử mua của bạn.',
    content: [
      { step: '1', text: 'Đăng nhập vào tài khoản và vào mục "Đơn hàng của tôi".' },
      { step: '2', text: 'Mỗi đơn hiển thị trạng thái: Chờ xác nhận → Đóng gói → Đang giao → Đã giao.' },
      { step: '3', text: 'Nhấn vào đơn để xem chi tiết lịch sử thay đổi trạng thái.' },
      { step: '4', text: 'Đơn PENDING có thể hủy trực tiếp từ trang Tài khoản.' },
    ],
    link: { label: 'Xem đơn hàng của tôi', href: '/account/orders' },
  },
  {
    id: 'faq',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Câu hỏi thường gặp',
    summary: 'Giải đáp nhanh các thắc mắc phổ biến nhất.',
    content: [
      { step: 'Q', text: 'Giao hàng mất bao lâu? — Nội thành Hà Nội: 1–2 ngày. Tỉnh thành khác: 3–5 ngày.' },
      { step: 'Q', text: 'Phí ship bao nhiêu? — Miễn phí cho đơn từ 250.000₫. Dưới mức đó tính theo vùng.' },
      { step: 'Q', text: 'Sách có bị hỏng khi vận chuyển không? — Sách được đóng gói kỹ bằng bọc khí và hộp cứng.' },
      { step: 'Q', text: 'Có thể mua nhiều cuốn một lần không? — Có, không giới hạn số lượng trong một đơn.' },
      { step: 'Q', text: 'Quên mật khẩu thì làm sao? — Liên hệ hotline để được hỗ trợ đặt lại mật khẩu.' },
    ],
  },
  {
    id: 'contact',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Liên hệ',
    summary: 'Gặp vấn đề cần hỗ trợ? Đội ngũ Chin luôn sẵn sàng.',
    content: [
      { step: '📞', text: 'Hotline: 0383 687 670 (T2–T6: 08:00–21:00 · T7–CN: 09:00–22:00)' },
      { step: '✉️', text: 'Email: 23011987@st.phenikaa-uni.edu.vn' },
      { step: '📍', text: 'Đường Nguyễn Trác, P. Yên Nghĩa, Q. Hà Đông, Hà Nội' },
    ],
  },
]

function TopicCard({ topic }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`border rounded-sm transition-all duration-300 ${open ? 'border-ink' : 'border-divider-lt hover:border-divider'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 p-6 text-left"
      >
        <span className={`flex-shrink-0 mt-0.5 transition-colors ${open ? 'text-ink' : 'text-muted'}`}>
          {topic.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-base text-ink mb-1">{topic.title}</h3>
          <p className="text-sm text-muted leading-relaxed">{topic.summary}</p>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 mt-1 text-subtle transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 pt-0">
          <div className="border-t border-divider-lt pt-4 space-y-3">
            {topic.content.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-subtle flex items-center justify-center text-[11px] font-bold text-ink-60">
                  {item.step}
                </span>
                <p className="text-sm text-ink-60 leading-relaxed">{item.text}</p>
              </div>
            ))}
            {topic.link && (
              <Link
                to={topic.link.href}
                className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold tracking-label uppercase text-ink hover:text-accent transition-colors"
              >
                {topic.link.label}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-divider-lt py-12 md:py-16 bg-surface-warm">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
          <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-3">Trợ giúp</p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink mb-2">Trung tâm hỗ trợ</h1>
          <p className="text-sm text-muted">Tìm câu trả lời cho mọi thắc mắc về đơn hàng, thanh toán và dịch vụ.</p>
        </div>
      </div>

      {/* Topics */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-3">
          {TOPICS.map(topic => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>

        {/* Bottom contact bar */}
        <div className="mt-10 p-6 bg-surface-warm border border-divider-lt rounded-sm text-center">
          <p className="text-sm text-ink-60 mb-1">Vẫn chưa tìm được câu trả lời?</p>
          <p className="text-sm font-semibold text-ink">
            Gọi cho chúng tôi:{' '}
            <a href="tel:0383687670" className="text-accent hover:underline">0383 687 670</a>
          </p>
        </div>
      </div>
    </div>
  )
}
