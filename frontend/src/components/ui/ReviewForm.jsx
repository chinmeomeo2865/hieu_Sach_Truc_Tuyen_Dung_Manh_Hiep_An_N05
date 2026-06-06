import { useState } from 'react'
import { api }          from '../../services/api'
import { useToastStore } from '../../store/toastStore'

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`${star} sao`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${(hovered || value) >= star ? 'text-star' : 'text-divider'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-muted">{['','Tệ','Không tốt','Bình thường','Tốt','Xuất sắc'][value]}</span>
      )}
    </div>
  )
}

export function ReviewForm({ productId, orderId, onSuccess }) {
  const showToast = useToastStore(s => s.show)
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) { setError('Vui lòng chọn số sao'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/api/reviews', { productId, orderId, rating, comment })
      showToast({ message: 'Đánh giá của bạn đã được gửi', type: 'success' })
      onSuccess?.()
    } catch (err) {
      showToast({ message: err.message || 'Gửi đánh giá thất bại', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <StarInput value={rating} onChange={v => { setRating(v); setError('') }} />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        placeholder="Chia sẻ cảm nhận của bạn về cuốn sách…"
        maxLength={1000}
        className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors resize-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Đang gửi…' : 'Gửi đánh giá'}
      </button>
    </form>
  )
}
