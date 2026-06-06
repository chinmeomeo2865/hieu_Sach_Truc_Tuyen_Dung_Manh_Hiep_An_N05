import { useEffect, useState } from 'react'

export function useNavbar() {
  const [scrolled,       setScrolled]       = useState(false)
  const [backTopVisible, setBackTopVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      setBackTopVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { scrolled, backTopVisible }
}
