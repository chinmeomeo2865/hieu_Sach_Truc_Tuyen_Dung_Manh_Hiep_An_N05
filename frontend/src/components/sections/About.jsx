import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SectionHeader }   from '../ui/SectionHeader'

export function About({ hours = [] }) {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="about" aria-label="Về chúng tôi" className="py-16 md:py-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeader eyebrow="Câu chuyện của chúng tôi" title="Về Hiệu Sách Chin" />

        <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-3 gap-[1.5px] border border-divider-lt rounded-xl overflow-hidden bg-divider-lt transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          {/* About */}
          <div className="bg-white p-8 md:p-10">
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-accent mb-4">Về chúng tôi</p>
            <p className="text-sm text-ink-60 leading-relaxed">
              Hiệu Sách Chin ra đời từ niềm đam mê với sách và mong muốn đưa tri thức đến gần hơn với mọi người.
            </p>
            <p className="text-sm text-ink-60 leading-relaxed mt-3">
              Mỗi cuốn sách đều được tuyển chọn kỹ lưỡng với tình yêu và sự chân thành — chúng tôi tin rằng một cuốn sách đúng sẽ thay đổi cả một cuộc đời.
            </p>
          </div>

          {/* Address */}
          <div className="bg-white p-8 md:p-10">
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-accent mb-4">Địa chỉ & Liên hệ</p>
            <p className="text-sm text-ink-60 leading-loose">
              Đường Nguyễn Trác, P. Yên Nghĩa<br />
              Quận Hà Đông, Hà Nội
            </p>
            <a href="tel:0383687670" className="block mt-4 text-sm font-semibold text-ink hover:text-muted transition-colors">
              0383 687 670
            </a>
            <a href="mailto:23011987@st.phenikaa-uni.edu.vn" className="block mt-1 text-xs text-muted break-all hover:text-ink transition-colors">
              23011987@st.phenikaa-uni.edu.vn
            </a>
          </div>

          {/* Hours */}
          <div className="bg-white p-8 md:p-10">
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-accent mb-4">Giờ mở cửa</p>
            <div className="divide-y divide-divider-lt">
              {hours.map(({ days, time }) => (
                <div key={days} className="flex justify-between text-sm py-2.5">
                  <span className="text-ink-60">{days}</span>
                  <strong className="font-semibold text-ink">{time}</strong>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-subtle flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              Đang mở cửa
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
