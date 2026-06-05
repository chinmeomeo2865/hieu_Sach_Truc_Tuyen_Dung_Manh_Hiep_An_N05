import { Hero }          from '../components/sections/Hero'
import { TrustBar }      from '../components/sections/TrustBar'
import { FeaturedBooks } from '../components/sections/FeaturedBooks'
import { NewArrivals }   from '../components/sections/NewArrivals'
import { Categories }    from '../components/sections/Categories'
import { Blog }          from '../components/sections/Blog'
import { Quote }            from '../components/sections/Quote'
import { CustomerReviews }  from '../components/sections/CustomerReviews'
import { About }         from '../components/sections/About'
import { Newsletter }    from '../components/sections/Newsletter'

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FILTER_TABS }   from '../data/books'
import { CATEGORIES }    from '../data/categories'
import { BLOG_POSTS }    from '../data/blog'
import {
  HERO_STATS,
  HERO_IMAGES,
  TRUST_ITEMS,
  ABOUT_HOURS,
} from '../data/site'
import { useProducts }   from '../hooks/useProducts'
import { api }           from '../services/api'

export default function Home() {
  const location = useLocation()
  useEffect(() => {
    if (location.state?.scrollTo) {
      const el = document.getElementById(location.state.scrollTo)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [location.state])

  // limit cao để FeaturedBooks có đủ sách từ mọi thể loại khi lọc cục bộ
  const { products: bestsellers, loading: loadingBest } = useProducts({ sort: 'rating',  limit: 8 })
  const { products: newArrivals, loading: loadingNew  } = useProducts({ sort: 'newest',  limit: 8  })

  const [blogPosts, setBlogPosts] = useState(BLOG_POSTS)
  useEffect(() => {
    api.get('/api/articles/recent?limit=3')
      .then(r => { if (r.data?.length) setBlogPosts(r.data) })
      .catch(() => {})
  }, [])

  return (
    <>
      <Hero
        stats={HERO_STATS}
        images={HERO_IMAGES}
      />

      <TrustBar items={TRUST_ITEMS} />

      <div className={loadingBest ? 'opacity-60 animate-pulse' : undefined}>
        <FeaturedBooks
          eyebrow="Bán chạy nhất"
          title="Bestsellers"
          subtitle="Những cuốn sách được hàng nghìn độc giả tin yêu"
          books={bestsellers}
          filters={FILTER_TABS}
          linkText="Xem tất cả bestsellers"
        />
      </div>

      <div className={loadingNew ? 'opacity-60 animate-pulse' : undefined}>
        <NewArrivals
          books={newArrivals}
          eyebrow="Vừa về kho"
          title="Mới về"
          subtitle="Những đầu sách mới nhất vừa được bổ sung"
          linkText="Xem tất cả"
        />
      </div>

      <Categories
        categories={CATEGORIES}
        eyebrow="Khám phá"
        title="Danh mục sách"
        subtitle="Tìm cuốn sách phù hợp với bạn"
      />

      <Blog
        posts={blogPosts}
        eyebrow="Góc đọc sách"
        title="Bài viết nổi bật"
        subtitle="Cảm nhận, gợi ý và câu chuyện từ đội ngũ Chin"
        linkText="Xem tất cả"
        linkHref="/blog"
      />

      <CustomerReviews />

      <Quote />

      <About hours={ABOUT_HOURS} />

      <Newsletter
        title="Nhận gợi ý sách mỗi tuần"
        subtitle="Ưu đãi độc quyền, sách mới về, và góc đọc sách từ đội ngũ Chin — thẳng vào hộp thư của bạn."
      />
    </>
  )
}
