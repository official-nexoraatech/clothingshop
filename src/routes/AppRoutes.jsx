import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';

import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import ProductsPage from '../pages/public/ProductsPage';
import ProductDetailsPage from '../pages/public/ProductDetailsPage';
import ContactPage from '../pages/public/ContactPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import NotFoundPage from '../pages/public/NotFoundPage';

import CustomerDashboardPage from '../pages/customer/CustomerDashboardPage';
import CustomerProfilePage from '../pages/customer/CustomerProfilePage';
import CustomerAddressesPage from '../pages/customer/CustomerAddressesPage';
import CustomerCartPage from '../pages/customer/CustomerCartPage';
import CustomerWishlistPage from '../pages/customer/CustomerWishlistPage';
import CustomerCheckoutPage from '../pages/customer/CustomerCheckoutPage';
import CustomerOrdersPage from '../pages/customer/CustomerOrdersPage';
import CustomerOrderDetailsPage from '../pages/customer/CustomerOrderDetailsPage';
import CustomerNotificationsPage from '../pages/customer/CustomerNotificationsPage';
import CustomerSettingsPage from '../pages/customer/CustomerSettingsPage';
import CustomerSupportPage from '../pages/customer/CustomerSupportPage';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminBrandsPage from '../pages/admin/AdminBrandsPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminCustomersPage from '../pages/admin/AdminCustomersPage';
import AdminCouponsPage from '../pages/admin/AdminCouponsPage';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminContactMessagesPage from '../pages/admin/AdminContactMessagesPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';

import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage';
import EmployeeOrdersPage from '../pages/employee/EmployeeOrdersPage';
import EmployeeInventoryPage from '../pages/employee/EmployeeInventoryPage';
import EmployeeNotificationsPage from '../pages/employee/EmployeeNotificationsPage';

import SystemDesignPage from '../pages/public/SystemDesignPage';
import DatabasePlanPage from '../pages/public/DatabasePlanPage';
import PageFlowPage from '../pages/public/PageFlowPage';
import UserJourneysPage from '../pages/public/UserJourneysPage';
import ProtectedRoute from '../components/ProtectedRoute';
import PolicyPage from '../pages/public/PolicyPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
        <Route path="/terms" element={<PolicyPage kind="terms" />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/system-design" element={<SystemDesignPage />} />
        <Route path="/database-plan" element={<DatabasePlanPage />} />
        <Route path="/page-flow" element={<PageFlowPage />} />
        <Route path="/user-journeys" element={<UserJourneysPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['customer']} />}><Route element={<CustomerLayout />}>
        <Route path="/customer" element={<CustomerDashboardPage />} />
        <Route path="/customer/profile" element={<CustomerProfilePage />} />
        <Route path="/customer/addresses" element={<CustomerAddressesPage />} />
        <Route path="/customer/cart" element={<CustomerCartPage />} />
        <Route path="/customer/wishlist" element={<CustomerWishlistPage />} />
        <Route path="/customer/checkout" element={<CustomerCheckoutPage />} />
        <Route path="/customer/orders" element={<CustomerOrdersPage />} />
        <Route path="/customer/orders/:id" element={<CustomerOrderDetailsPage />} />
        <Route path="/customer/notifications" element={<CustomerNotificationsPage />} />
        <Route path="/customer/settings" element={<CustomerSettingsPage />} />
        <Route path="/customer/support" element={<CustomerSupportPage />} />
      </Route></Route>

      <Route element={<ProtectedRoute roles={['admin']} />}><Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/brands" element={<AdminBrandsPage />} />
        <Route path="/admin/inventory" element={<AdminInventoryPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/coupons" element={<AdminCouponsPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/contact-messages" element={<AdminContactMessagesPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/support" element={<AdminSupportPage />} />
      </Route></Route>

      <Route element={<ProtectedRoute roles={['employee']} />}><Route element={<EmployeeLayout />}>
        <Route path="/employee" element={<EmployeeDashboardPage />} />
        <Route path="/employee/orders" element={<EmployeeOrdersPage />} />
        <Route path="/employee/inventory" element={<EmployeeInventoryPage />} />
        <Route path="/employee/notifications" element={<EmployeeNotificationsPage />} />
        <Route path="/employee/support" element={<AdminSupportPage />} />
      </Route></Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
