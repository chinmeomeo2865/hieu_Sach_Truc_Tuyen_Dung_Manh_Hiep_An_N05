import { useState, useEffect } from 'react'
import { Link }               from 'react-router-dom'
import { useScrollReveal }    from '../../hooks/useScrollReveal'
import { SectionHeader }      from '../ui/SectionHeader'
import { api }                from '../../services/api'

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-star' : 'text-divider'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review, delay = 0 }) {
  const { ref, visible } = useScrollReveal()
  const pid = review.product?._id || review.product

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="h-full bg-white border border-divider-lt rounded-sm p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-card-h hover:border-divider transition-all duration-300">
        {/* Stars + date */}
        <div className="flex items-center justify-between">
          <Stars rating={review.rating} />
          <span className="text-2xs text-subtle">
            {new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>

        {/* Comment */}
        <p className="text-sm text-ink-60 leading-relaxed flex-1 line-clamp-4">
          "{review.comment}"
        </p>

        {/* Book ref */}
        {review.product && (
          <Link
            to={`/books/${pid}`}
            className="flex items-center gap-2.5 pt-3 border-t border-divider-lt group"
          >
            {review.product.image && (
              <img
                src={review.product.image}
                alt={review.product.title}
                className="w-8 h-10 object-cover rounded-sm flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink line-clamp-1 group-hover:text-accent transition-colors">
                {review.product.title}
              </p>
              {review.product.author && (
                <p className="text-2xs text-muted mt-0.5">{review.product.author}</p>
              )}
            </div>
          </Link>
        )}

        {/* Reviewer */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-divider-lt">
          <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-2xs font-bold flex-shrink-0">
            {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="text-xs font-semibold text-ink">{review.user?.name || 'Độc giả'}</p>
          <span className="ml-auto text-2xs text-accent font-semibold">✓ Đã mua</span>
        </div>
      </div>
    </div>
  )
}

export function CustomerReviews() {
  const [reviews, setReviews] = useState([])
  const [loaded, setLoaded]   = useState(false)
  const { ref, visible }      = useScrollReveal()

  useEffect(() => {
    api.get('/api/reviews/recent?limit=6')
      .then(res => setReviews(res.data || []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Chỉ render khi đã load xong VÀ có review thật
  if (!loaded || reviews.length === 0) return null

  return (
    <section aria-label="Cảm nhận từ độc giả" className="border-t border-divider-lt py-16 md:py-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader
            eyebrow="Độc giả nói gì"
            title="Cảm nhận thật"
            subtitle={`${reviews.length} đánh giá từ khách hàng đã mua tại Hiệu Sách Chin`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {reviews.map((review, i) => (
              <ReviewCard key={review._id} review={review} delay={i * 80} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
