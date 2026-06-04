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
import AccountProfilePage   from './pages/AccountProfilePage'
import AccountPage          from './pages/AccountPage'
import AddressesPage        from './pages/account/AddressesPage'
import PlaceholderPage      from './pages/PlaceholderPage'
import AdminLoginPage       from './pages/admin/AdminLoginPage'
import AdminOrdersPage      from './pages/admin/AdminOrdersPage'
import AdminUsersPage       from './pages/admin/AdminUsersPage'
import AdminProductsPage    from './pages/admin/AdminProductsPage'
import AdminAccountsPage    from './pages/admin/AdminAccountsPage'
import AdminAnalyticsPage   from './pages/admin/AdminAnalyticsPage'
import AdminSettingsPage    from './pages/admin/AdminSettingsPage'
import AdminRoute           from './components/admin/AdminRoute'
import AdminCouponsPage     from './pages/admin/AdminCouponsPage'
import AdminReviewsPage    from './pages/admin/AdminReviewsPage'
import AdminArticlesPage   from './pages/admin/AdminArticlesPage'
import BlogPage            from './pages/BlogPage'
import BlogDetailPage      from './pages/BlogDetailPage'
import NotificationsPage   from './pages/NotificationsPage'
import PaymentResultPage   from './pages/PaymentResultPage'
import WarehouseRoute        from './components/warehouse/WarehouseRoute'
import PMRoute              from './components/pm/PMRoute'
import PMLoginPage          from './pages/pm/PMLoginPage'
import PMDashboard          from './pages/pm/PMDashboard'
import PMCategoriesPage     from './pages/pm/PMCategoriesPage'
import PMProductsPage       from './pages/pm/PMProductsPage'
import PMVisibilityPage     from './pages/pm/PMVisibilityPage'
import PMPromotionsPage     from './pages/pm/PMPromotionsPage'
import PMActivityPage       from './pages/pm/PMActivityPage'
import WarehouseLoginPage    from './pages/warehouse/WarehouseLoginPage'
import WarehouseDashboard    from './pages/warehouse/WarehouseDashboard'
import WarehouseOrdersPage   from './pages/warehouse/WarehouseOrdersPage'
import WarehouseInventoryPage from './pages/warehouse/WarehouseInventoryPage'
import WarehouseAuditPage    from './pages/warehouse/WarehouseAuditPage'
import WarehouseReturnsPage  from './pages/warehouse/WarehouseReturnsPage'
import WarehouseActivityPage from './pages/warehouse/WarehouseActivityPage'
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
        <Route path="/account"           element={<MainLayout><AccountPage /></MainLayout>} />
        <Route path="/account/orders"    element={<MainLayout><OrdersPage /></MainLayout>} />
        <Route path="/account/wishlist"  element={<MainLayout><WishlistPage /></MainLayout>} />
        <Route path="/account/profile"   element={<MainLayout><AccountProfilePage /></MainLayout>} />
        <Route path="/account/addresses" element={<MainLayout><AddressesPage /></MainLayout>} />
        <Route path="/support/how-to-order" element={<MainLayout><PlaceholderPage title="Cách đặt hàng" description="Hướng dẫn đặt hàng trực tuyến tại Hiệu Sách Chin." /></MainLayout>} />
        <Route path="/support/returns"   element={<MainLayout><PlaceholderPage title="Đổi trả hàng" description="Chính sách đổi trả trong 30 ngày, không cần lý do." /></MainLayout>} />
        <Route path="/support/payment"   element={<MainLayout><PlaceholderPage title="Thanh toán" description="Hỗ trợ COD, VNPay và các ví điện tử phổ biến." /></MainLayout>} />
        <Route path="/support/faq"       element={<MainLayout><PlaceholderPage title="Câu hỏi thường gặp" description="Giải đáp các thắc mắc phổ biến về đơn hàng và dịch vụ." /></MainLayout>} />
        <Route path="/contact"           element={<MainLayout><PlaceholderPage title="Liên hệ" description="Liên hệ với chúng tôi qua hotline 0383 687 670 hoặc email 23011987@st.phenikaa-uni.edu.vn." /></MainLayout>} />
        <Route path="/blog"              element={<MainLayout><BlogPage /></MainLayout>} />
        <Route path="/blog/:id"          element={<MainLayout><BlogDetailPage /></MainLayout>} />
        <Route path="/notifications"     element={<MainLayout><NotificationsPage /></MainLayout>} />
        <Route path="/payment-result"    element={<MainLayout><PaymentResultPage /></MainLayout>} />
        <Route path="/auth/login"     element={<LoginPage />} />
        <Route path="/auth/register"  element={<RegisterPage />} />

        {/* Product Manager */}
        <Route path="/pm/login"      element={<PMLoginPage />} />
        <Route path="/pm"            element={<PMRoute><PMDashboard /></PMRoute>} />
        <Route path="/pm/categories" element={<PMRoute><PMCategoriesPage /></PMRoute>} />
        <Route path="/pm/products"   element={<PMRoute><PMProductsPage /></PMRoute>} />
        <Route path="/pm/visibility" element={<PMRoute><PMVisibilityPage /></PMRoute>} />
        <Route path="/pm/promotions" element={<PMRoute><PMPromotionsPage /></PMRoute>} />
        <Route path="/pm/activity"   element={<PMRoute><PMActivityPage /></PMRoute>} />

        {/* Warehouse */}
        <Route path="/warehouse/login"     element={<WarehouseLoginPage />} />
        <Route path="/warehouse"           element={<WarehouseRoute><WarehouseDashboard /></WarehouseRoute>} />
        <Route path="/warehouse/orders"    element={<WarehouseRoute><WarehouseOrdersPage /></WarehouseRoute>} />
        <Route path="/warehouse/inventory" element={<WarehouseRoute><WarehouseInventoryPage /></WarehouseRoute>} />
        <Route path="/warehouse/audit"     element={<WarehouseRoute><WarehouseAuditPage /></WarehouseRoute>} />
        <Route path="/warehouse/returns"   element={<WarehouseRoute><WarehouseReturnsPage /></WarehouseRoute>} />
        <Route path="/warehouse/activity"  element={<WarehouseRoute><WarehouseActivityPage /></WarehouseRoute>} />

        {/* Admin */}
        <Route path="/admin/login"      element={<AdminLoginPage />} />
        <Route path="/admin/analytics"  element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
        <Route path="/admin/orders"     element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
        <Route path="/admin/products"   element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
        <Route path="/admin/users"      element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/accounts"   element={<AdminRoute><AdminAccountsPage /></AdminRoute>} />
        <Route path="/admin/settings"   element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
        <Route path="/admin/coupons"    element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
        <Route path="/admin/reviews"    element={<AdminRoute><AdminReviewsPage /></AdminRoute>} />
        <Route path="/admin/articles"   element={<AdminRoute><AdminArticlesPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
