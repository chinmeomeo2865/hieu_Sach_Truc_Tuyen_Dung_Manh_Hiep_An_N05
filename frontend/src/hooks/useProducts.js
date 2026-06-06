import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { BESTSELLERS, NEW_ARRIVALS, ALL_BOOKS } from '../data/books'

export function useProducts({ sort, limit, category, search, page } = {}) {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (sort)     params.set('sort', sort)
        if (limit)    params.set('limit', String(limit))
        if (category && category !== 'all') params.set('category', category)
        if (search)   params.set('search', search)
        if (page)     params.set('page', String(page))

        const data = await api.get(`/api/products?${params}`)
        if (!cancelled) {
          setProducts(data.data)
          setPagination(data.pagination || null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          const fallback = sort === 'rating' ? BESTSELLERS
            : sort === 'newest' ? NEW_ARRIVALS
            : ALL_BOOKS
          setProducts(limit ? fallback.slice(0, limit) : fallback)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [sort, limit, category, search, page])

  return { products, loading, error, pagination }
}
