import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnnouncementBar }  from './components/layout/AnnouncementBar'
import { Navbar }           from './components/layout/Navbar'
import { Footer }           from './components/layout/Footer'
import { ToastContainer }   from './components/ui/ToastContainer'
import { QuickViewModal }   from './components/ui/QuickViewModal'
import { SearchModal }      from './components/ui/SearchModal'
import { AuthPromptModal }  from './components/ui/AuthPromptModal'
import { SupportModal }     from './components/ui/SupportModal'
import Home                 from './pages/Home'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import CartPage             from './pages/CartPage'
import BooksPage            from './pages/BooksPage'
import BookDetailPage       from './pages/BookDetailPage'
import CheckoutPage         from './pages/CheckoutPage'
import AccountPage          from './pages/account/AccountPage'
import AccountProfilePage   from './pages/account/ProfilePage'
import AddressesPage        from './pages/account/AddressesPage'
import OrdersPage           from './pages/account/OrdersPage'
import WishlistPage         from './pages/account/WishlistPage'
import { AccountLayout }          from './components/layout/AccountLayout'
import PlaceholderPage      from './pages/PlaceholderPage'
import SupportPage          from './pages/SupportPage'
import AdminOrdersPage      from './pages/admin/AdminOrdersPage'
import AdminUsersPage       from './pages/admin/AdminUsersPage'
import AdminProductsPage    from './pages/admin/AdminProductsPage'
import AdminAccountsPage    from './pages/admin/AdminAccountsPage'
import AdminAnalyticsPage   from './pages/admin/AdminAnalyticsPage'
import AdminSettingsPage    from './pages/admin/AdminSettingsPage'
import AdminRoute           from './components/admin/AdminRoute'
import AdminReviewsPage    from './pages/admin/AdminReviewsPage'
import AdminArticlesPage   from './pages/admin/AdminArticlesPage'
import AdminCouponsPage    from './pages/admin/AdminCouponsPage'
import BlogPage            from './pages/BlogPage'
import BlogDetailPage      from './pages/BlogDetailPage'
import OffersPage          from './pages/OffersPage'
import NotificationsPage   from './pages/NotificationsPage'
import PaymentResultPage   from './pages/PaymentResultPage'
import WarehouseRoute        from './components/warehouse/WarehouseRoute'
import PMRoute              from './components/pm/PMRoute'
import PMDashboard          from './pages/pm/PMDashboard'
import PMCategoriesPage     from './pages/pm/PMCategoriesPage'
import PMProductsPage       from './pages/pm/PMProductsPage'
import PMVisibilityPage     from './pages/pm/PMVisibilityPage'
import PMActivityPage       from './pages/pm/PMActivityPage'
import WarehouseDashboard    from './pages/warehouse/WarehouseDashboard'
import WarehouseOrdersPage   from './pages/warehouse/WarehouseOrdersPage'
import WarehouseInventoryPage from './pages/warehouse/WarehouseInventoryPage'
import WarehouseAuditPage    from './pages/warehouse/WarehouseAuditPage'
import WarehouseReturnsPage  from './pages/warehouse/WarehouseReturnsPage'
import WarehouseActivityPage from './pages/warehouse/WarehouseActivityPage'
import WarehouseTransactionsPage from './pages/warehouse/WarehouseTransactionsPage'
import {
  NAV_LINKS,
  NAV_CATEGORIES,
  FOOTER_COLUMNS,
  ANNOUNCEMENT_MESSAGE,
} from './data/site'

function MainLayout({ children }) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <AnnouncementBar message={ANNOUNCEMENT_MESSAGE} />
        <Navbar links={NAV_LINKS} categories={NAV_CATEGORIES} />
      </div>
      <div className="h-[104px]" />
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
      <AuthPromptModal />
      <SupportModal />
      <ToastContainer />

      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/books" element={<MainLayout><BooksPage /></MainLayout>} />
        <Route path="/books/:id" element={<MainLayout><BookDetailPage /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
        <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
        
        <Route path="/account" element={<MainLayout><AccountLayout /></MainLayout>}>
          <Route index element={<AccountPage />} />
          <Route path="orders" element={<AccountPage />} />
          <Route path="profile" element={<AccountProfilePage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
        <Route path="/support"           element={<MainLayout><SupportPage /></MainLayout>} />
        <Route path="/uu-dai"            element={<MainLayout><OffersPage /></MainLayout>} />
        <Route path="/blog"              element={<MainLayout><BlogPage /></MainLayout>} />
        <Route path="/blog/:id"          element={<MainLayout><BlogDetailPage /></MainLayout>} />
        <Route path="/notifications"     element={<MainLayout><NotificationsPage /></MainLayout>} />
        <Route path="/payment-result"    element={<MainLayout><PaymentResultPage /></MainLayout>} />
        <Route path="/auth/login"     element={<LoginPage />} />
        <Route path="/auth/register"  element={<RegisterPage />} />

        {/* Product Manager */}
        <Route path="/pm"            element={<PMRoute><PMDashboard /></PMRoute>} />
        <Route path="/pm/categories" element={<PMRoute><PMCategoriesPage /></PMRoute>} />
        <Route path="/pm/products"   element={<PMRoute><PMProductsPage /></PMRoute>} />
        <Route path="/pm/visibility" element={<PMRoute><PMVisibilityPage /></PMRoute>} />
        <Route path="/pm/activity"   element={<PMRoute><PMActivityPage /></PMRoute>} />

        {/* Warehouse */}
        <Route path="/warehouse"           element={<WarehouseRoute><WarehouseDashboard /></WarehouseRoute>} />
        <Route path="/warehouse/orders"    element={<WarehouseRoute><WarehouseOrdersPage /></WarehouseRoute>} />
        <Route path="/warehouse/inventory" element={<WarehouseRoute><WarehouseInventoryPage /></WarehouseRoute>} />
        <Route path="/warehouse/audit"     element={<WarehouseRoute><WarehouseAuditPage /></WarehouseRoute>} />
        <Route path="/warehouse/transactions" element={<WarehouseRoute><WarehouseTransactionsPage /></WarehouseRoute>} />
        <Route path="/warehouse/returns"   element={<WarehouseRoute><WarehouseReturnsPage /></WarehouseRoute>} />
        <Route path="/warehouse/activity"  element={<WarehouseRoute><WarehouseActivityPage /></WarehouseRoute>} />

        {/* Admin */}
        <Route path="/admin/analytics"  element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
        <Route path="/admin/orders"     element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
        <Route path="/admin/products"   element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
        <Route path="/admin/users"      element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/accounts"   element={<AdminRoute><AdminAccountsPage /></AdminRoute>} />
        <Route path="/admin/settings"   element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
        <Route path="/admin/reviews"    element={<AdminRoute><AdminReviewsPage /></AdminRoute>} />
        <Route path="/admin/articles"   element={<AdminRoute><AdminArticlesPage /></AdminRoute>} />
        <Route path="/admin/coupons"    element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
