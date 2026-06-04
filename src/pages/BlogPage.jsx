import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useScrollReveal } from '../hooks/useScrollReveal'

function ArticleCard({ article }) {
  const { ref, visible } = useScrollReveal()
  return (
    <article ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      <Link to={`/blog/${article._id}`} className="group block">
        <div className="aspect-card overflow-hidden rounded-lg bg-surface-subtle mb-4">
          {article.coverImage ? (
            <img src={article.coverImage} alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-90"/>
          ) : (
            <div className="w-full h-full bg-surface-subtle flex items-center justify-center">
              <svg className="w-10 h-10 text-divider" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13"/></svg>
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-label-xl text-accent mb-1.5">{article.category}</p>
        <h3 className="font-display font-semibold text-ink text-lg leading-snug mb-2 group-hover:text-ink-60 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-[13px] text-muted line-clamp-2 mb-2">{article.summary}</p>
        )}
        <p className="text-[12px] text-subtle">
          {new Date(article.createdAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
          {article.readTime && ` · ${article.readTime} phút đọc`}
        </p>
      </Link>
    </article>
  )
}

export default function BlogPage() {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/articles?page=${page}&limit=9`)
      .then(r => { setArticles(r.data); setPagination(r.pagination) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
      <div className="mb-10">
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-2">Góc đọc sách</p>
        <h1 className="font-display font-semibold text-3xl text-ink">Bài viết &amp; Cảm nhận</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-card bg-surface-subtle rounded-lg mb-4"/>
              <div className="h-3 bg-surface-subtle rounded w-1/3 mb-2"/>
              <div className="h-5 bg-surface-subtle rounded w-3/4 mb-2"/>
              <div className="h-3 bg-surface-subtle rounded w-1/2"/>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-center text-muted py-20">Chưa có bài viết nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(a => <ArticleCard key={a._id} article={a}/>)}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded text-[13px] font-medium transition-colors ${p === page ? 'bg-ink text-white' : 'border border-divider-lt text-muted hover:border-ink hover:text-ink'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
