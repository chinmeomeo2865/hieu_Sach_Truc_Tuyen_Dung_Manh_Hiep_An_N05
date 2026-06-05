import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

const TOPICS = [
  {
    id: 'how-to-order',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
      </svg>
    ),
    label: 'Cách đặt hàng',
    title: 'Hướng dẫn đặt hàng',
    items: [
      { mark: '1', text: 'Tìm sách tại trang Danh mục hoặc dùng thanh tìm kiếm.' },
      { mark: '2', text: 'Nhấn "Thêm vào giỏ" và vào trang Giỏ hàng.' },
      { mark: '3', text: 'Điền địa chỉ giao hàng và chọn phương thức thanh toán (COD hoặc PayOS/QR).' },
      { mark: '4', text: 'Xác nhận đơn — bạn sẽ nhận email xác nhận ngay sau đó.' },
      { mark: '5', text: 'Theo dõi trạng thái đơn tại Tài khoản → Đơn hàng của tôi.' },
    ],
  },
  {
    id: 'returns',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    label: 'Đổi trả hàng',
    title: 'Chính sách đổi trả',
    items: [
      { mark: '✓', text: 'Đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.' },
      { mark: '✓', text: 'Sản phẩm còn nguyên vẹn, chưa qua sử dụng, còn đầy đủ bao bì.' },
      { mark: '✓', text: 'Liên hệ hotline 0383 687 670 để được hỗ trợ xử lý.' },
      { mark: '✓', text: 'Hoàn tiền trong 3–5 ngày làm việc sau khi nhận hàng hoàn trả.' },
      { mark: '✗', text: 'Không áp dụng với sách đã bị rách, ẩm mốc hoặc có dấu hiệu đọc nhiều.' },
    ],
  },
  {
    id: 'payment',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    label: 'Thanh toán',
    title: 'Phương thức thanh toán',
    items: [
      { mark: '💵', text: 'COD (Thanh toán khi nhận hàng) — không phụ phí.' },
      { mark: '📱', text: 'PayOS / VietQR — quét mã QR, chuyển khoản ngay lập tức.' },
      { mark: '🔒', text: 'Mọi giao dịch đều được mã hóa bảo mật.' },
      { mark: 'ℹ️', text: 'Đơn PayOS chưa thanh toán sẽ tự hủy sau 30 phút.' },
    ],
  },
  {
    id: 'tracking',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    label: 'Theo dõi đơn',
    title: 'Theo dõi đơn hàng',
    items: [
      { mark: '1', text: 'Đăng nhập và vào mục "Đơn hàng của tôi".' },
      { mark: '2', text: 'Mỗi đơn hiển thị trạng thái: Chờ xác nhận → Đóng gói → Đang giao → Đã giao.' },
      { mark: '3', text: 'Nhấn vào đơn để xem chi tiết lịch sử thay đổi trạng thái.' },
      { mark: '4', text: 'Đơn PENDING có thể hủy trực tiếp từ trang Tài khoản.' },
    ],
    link: { label: 'Xem đơn hàng của tôi', href: '/account/orders' },
  },
  {
    id: 'faq',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'FAQ',
    title: 'Câu hỏi thường gặp',
    items: [
      { mark: 'Q', text: 'Giao hàng mất bao lâu? — Nội thành HN: 1–2 ngày. Tỉnh khác: 3–5 ngày.' },
      { mark: 'Q', text: 'Phí ship bao nhiêu? — Miễn phí đơn từ 250.000₫. Dưới mức đó tính theo vùng.' },
      { mark: 'Q', text: 'Sách có bị hỏng khi vận chuyển không? — Đóng gói kỹ bằng bọc khí và hộp cứng.' },
      { mark: 'Q', text: 'Có thể mua nhiều cuốn một lần không? — Có, không giới hạn số lượng.' },
      { mark: 'Q', text: 'Quên mật khẩu? — Liên hệ hotline để được hỗ trợ đặt lại.' },
    ],
  },
  {
    id: 'contact',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Liên hệ',
    title: 'Liên hệ với chúng tôi',
    items: [
      { mark: '📞', text: 'Hotline: 0383 687 670' },
      { mark: '🕐', text: 'T2–T6: 08:00–21:00 · T7–CN: 09:00–22:00' },
      { mark: '✉️', text: 'Email: 23011987@st.phenikaa-uni.edu.vn' },
      { mark: '📍', text: 'Đường Nguyễn Trác, P. Yên Nghĩa, Q. Hà Đông, Hà Nội' },
    ],
  },
]

export function SupportModal() {
  const topic = useUIStore(s => s.supportModalTopic)
  const close = useUIStore(s => s.closeSupportModal)
  const open  = useUIStore(s => s.openSupportModal)

  const isOpen   = topic !== null
  const current  = TOPICS.find(t => t.id === topic) || TOPICS[0]

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[1020px] max-h-[88vh] bg-white rounded-sm shadow-md flex overflow-hidden">

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-gray-100 flex flex-col border-r border-gray-200">
          <div className="px-6 py-6 border-b border-gray-200">
            <p className="text-[10px] font-semibold tracking-label-2xl uppercase text-muted">
              Trung tâm hỗ trợ
            </p>
          </div>
          <nav className="flex-1 py-3 overflow-y-auto">
            {TOPICS.map(t => (
              <button
                key={t.id}
                onClick={() => open(t.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                  current.id === t.id
                    ? 'bg-gray-200 text-ink'
                    : 'text-ink-60 hover:text-ink hover:bg-gray-200/70'
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{t.icon}</span>
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-9 py-6 border-b border-divider-lt">
            <h2 className="font-display font-semibold text-xl text-ink">{current.title}</h2>
            <button
              onClick={close}
              aria-label="Đóng"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-surface-subtle hover:text-ink transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-9 py-8">
            <div className="space-y-5">
              {current.items.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-subtle flex items-center justify-center text-xs font-bold text-ink-60">
                    {item.mark}
                  </span>
                  <p className="text-base text-ink-60 leading-relaxed pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>

            {current.link && (
              <Link
                to={current.link.href}
                onClick={close}
                className="inline-flex items-center gap-2 mt-8 text-xs font-semibold tracking-label uppercase text-ink hover:text-accent transition-colors"
              >
                {current.link.label}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="px-9 py-5 border-t border-divider-lt flex justify-end">
            <button
              onClick={close}
              className="px-6 py-2.5 bg-ink text-white text-xs font-semibold tracking-label uppercase rounded-sm hover:bg-ink-80 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
