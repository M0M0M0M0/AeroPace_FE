import React from "react";
import { HashRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Các components Layout & chung
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Các trang (Pages) của giao diện khách hàng
import Home from "./pages/Home";
import Products from "./pages/Products";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Policy from "./pages/Policy";

// Đăng nhập / Đăng ký
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./pages/Profile";

// --- CÁC COMPONENT ADMIN ---
// (Nhớ import đúng đường dẫn nơi bạn đã lưu các file này nhé)
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserManagement from "./components/UserManagement";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminSettings from "./pages/Admin/AdminSettings";
import AdminCustomers from "./pages/Admin/AdminCustomer";
import AdminCustomerDetail from "./pages/Admin/AdminCustomerDetail";
import AdminCatalogPage from "./pages/admin/AdminCatalogPage";

// Tạo một Layout riêng cho trang khách hàng (Chứa Navbar và Footer)
const StoreLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet /> 
      <Footer />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* 1. KHU VỰC CỦA KHÁCH HÀNG (Sử dụng StoreLayout có Navbar & Footer) */}
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
            </Route>

            {/* 2. KHU VỰC CỦA ADMIN (Sử dụng AdminLayout với Sidebar & Header riêng) */}
            {/* Có thể bọc bằng <ProtectedRoute> sau này để yêu cầu đăng nhập */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />{" "}
              {/* Mặc định vào /admin sẽ hiển thị Dashboard */}
              <Route path="users" element={<UserManagement />} />{" "}
              {/* Đường dẫn: /admin/users */}
              <Route path="products" element={<AdminProducts />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:id" element={<AdminCustomerDetail />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
