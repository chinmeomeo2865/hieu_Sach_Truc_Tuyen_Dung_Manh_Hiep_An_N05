import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnnouncementBar }  from './components/layout/AnnouncementBar'
import { Navbar }           from './components/layout/Navbar'
import { Footer }           from './components/layout/Footer'
import { ToastContainer }   from './components/ui/ToastContainer'
import { QuickViewModal }   from './components/ui/QuickViewModal'
import { SearchModal }      from './components/ui/SearchModal'
import Home                 from './pages/Home'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import CartPage             from './pages/CartPage'
import BooksPage            from './pages/BooksPage'
import BookDetailPage       from './pages/BookDetailPage'
import CheckoutPage         from './pages/CheckoutPage'
import OrdersPage           from './pages/OrdersPage'
import WishlistPage         from './pages/WishlistPage'
import PlaceholderPage      from './pages/PlaceholderPage'
import AdminLoginPage       from './pages/admin/AdminLoginPage'
import AdminOrdersPage      from './pages/admin/AdminOrdersPage'
import AdminRoute           from './components/admin/AdminRoute'
import {
  NAV_LINKS,
  NAV_CATEGORIES,
  FOOTER_COLUMNS,
  ANNOUNCEMENT_MESSAGE,
} from './data/site'

function MainLayout({ children }) {
  return (
    <>
      <AnnouncementBar message={ANNOUNCEMENT_MESSAGE} />
      <Navbar links={NAV_LINKS} categories={NAV_CATEGORIES} />
      <main>{children}</main>
      <Footer columns={FOOTER_COLUMNS} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SearchModal />
      <QuickViewModal />
      <ToastContainer />

      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/books" element={<MainLayout><BooksPage /></MainLayout>} />
        <Route path="/books/:id" element={<MainLayout><BookDetailPage /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
        <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
        <Route path="/account/orders"    element={<MainLayout><OrdersPage /></MainLayout>} />
        <Route path="/account/wishlist"  element={<MainLayout><WishlistPage /></MainLayout>} />
        <Route path="/account/addresses" element={<MainLayout><PlaceholderPage title="Địa chỉ giao hàng" description="Quản lý địa chỉ nhận hàng của bạn. Tính năng đang được phát triển." /></MainLayout>} />
        <Route path="/support/how-to-order" element={<MainLayout><PlaceholderPage title="Cách đặt hàng" description="Hướng dẫn đặt hàng trực tuyến tại Hiệu Sách Chin." /></MainLayout>} />
        <Route path="/support/returns"   element={<MainLayout><PlaceholderPage title="Đổi trả hàng" description="Chính sách đổi trả trong 30 ngày, không cần lý do." /></MainLayout>} />
        <Route path="/support/payment"   element={<MainLayout><PlaceholderPage title="Thanh toán" description="Hỗ trợ COD, VNPay và các ví điện tử phổ biến." /></MainLayout>} />
        <Route path="/support/faq"       element={<MainLayout><PlaceholderPage title="Câu hỏi thường gặp" description="Giải đáp các thắc mắc phổ biến về đơn hàng và dịch vụ." /></MainLayout>} />
        <Route path="/contact"           element={<MainLayout><PlaceholderPage title="Liên hệ" description="Liên hệ với chúng tôi qua hotline 0383 687 670 hoặc email 23011987@st.phenikaa-uni.edu.vn." /></MainLayout>} />
        <Route path="/auth/login"     element={<LoginPage />} />
        <Route path="/auth/register"  element={<RegisterPage />} />

        {/* Admin */}
        <Route path="/admin/login"  element={<AdminLoginPage />} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
