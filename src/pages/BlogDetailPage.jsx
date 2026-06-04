import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'

export default function BlogDetailPage() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    api.get(`/api/articles/${id}`)
      .then(r => setArticle(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="max-w-[720px] mx-auto px-4 py-20 animate-pulse">
      <div className="h-4 bg-surface-subtle rounded w-1/4 mb-4"/>
      <div className="h-8 bg-surface-subtle rounded w-3/4 mb-6"/>
      <div className="aspect-[16/7] bg-surface-subtle rounded-lg mb-8"/>
      {Array.from({length:6}).map((_,i)=><div key={i} className="h-4 bg-surface-subtle rounded mb-3"/>)}
    </div>
  )

  if (error || !article) return (
    <div className="max-w-[720px] mx-auto px-4 py-20 text-center">
      <p className="text-muted text-[15px]">Không tìm thấy bài viết.</p>
      <Link to="/blog" className="text-accent underline text-[13px] mt-3 inline-block">← Quay lại Góc đọc sách</Link>
    </div>
  )

  return (
    <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <Link to="/blog"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink transition-colors mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Quay lại Góc đọc sách
      </Link>

      {/* Meta */}
      <p className="text-[11px] font-semibold uppercase tracking-label-2xl text-accent mb-3">{article.category}</p>
      <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink leading-tight mb-4">{article.title}</h1>
      <div className="flex items-center gap-3 text-[12.5px] text-subtle mb-8">
        <span>{new Date(article.createdAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'long', year:'numeric' })}</span>
        {article.readTime && <><span>·</span><span>{article.readTime} phút đọc</span></>}
        {article.author?.name && <><span>·</span><span>bởi {article.author.name}</span></>}
      </div>

      {/* Cover */}
      {article.coverImage && (
        <div className="aspect-[16/7] overflow-hidden rounded-lg mb-8 bg-surface-subtle">
          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover"/>
        </div>
      )}

      {/* Summary */}
      {article.summary && (
        <p className="text-[15px] text-ink-60 leading-relaxed border-l-2 border-divider pl-4 mb-8 italic">
          {article.summary}
        </p>
      )}

      {/* Content */}
      <div className="prose prose-sm max-w-none text-[14.5px] text-[#404040] leading-relaxed whitespace-pre-wrap">
        {article.content}
      </div>
    </article>
  )
}
