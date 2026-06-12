import React from "react";
import { HashRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AdminRoute from "./routes/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Products from "./pages/Products";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Policy from "./pages/Policy";

import Login from "./components/Login";
import Register from "./components/Register";

import Profile from "./pages/Profile";
import OrderDetail from "./pages/OrderDetail";

import DetailedReview from "./pages/DetailedReview";

import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminCustomers from "./pages/Admin/AdminCustomer";
import AdminCustomerDetail from "./pages/Admin/AdminCustomerDetail";
import AdminCatalogPage from "./pages/Admin/AdminCatalogPage";
import AdminShippingPage from "./pages/Admin/AdminShippingPage";
import AdminOrderDetail from "./pages/Admin/AdminOrderDetail";
import AdminProductDetail from "./pages/Admin/AdminProductDetail";

const StoreLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

// Wrapper để ErrorBoundary tự reset khi đổi route
const ErrorBoundaryWithReset = ({ children }) => {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      {children}
    </ErrorBoundary>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider>
        <Router>
          <ScrollToTop />
          <ErrorBoundaryWithReset>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/aboutus" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/products/detail/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/chinh-sach-doi-tra" element={<Policy />} />
                <Route path="/chinh-sach-bao-hanh" element={<Policy />} />
                <Route path="/chinh-sach-bao-mat" element={<Policy />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/order-detail/:orderCode" element={<OrderDetail />} />
                <Route path="/review/detail" element={<DetailedReview />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="catalog" element={<AdminCatalogPage />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="customers/:id" element={<AdminCustomerDetail />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/details/:orderCode" element={<AdminOrderDetail />} />
                  <Route path="products/:id" element={<AdminProductDetail />} />
                  <Route path="shippings" element={<AdminShippingPage />} />
                </Route>
              </Route>
            </Routes>
          </ErrorBoundaryWithReset>
        </Router>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;