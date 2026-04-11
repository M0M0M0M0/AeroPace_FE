import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import "./Footer.css";

function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const footer = footerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            footer.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 } // chỉ cần 20% footer hiển thị là kích hoạt
    );

    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer-wrapper" ref={footerRef}>
      {/* Nội dung chính */}
      <div className="footer-container">
        {/* Cột 1 - Giới thiệu */}
        <div className="footer-col">
          <h2 className="footer-logo">SHOESTORE</h2>
          <p className="footer-text">
            Từ máy chạy đến đường đua<br/> Trọn bộ hành trang, bứt phá giới hạn. <br />
            Khám phá ngay kho trang bị chuyên nghiệp giúp bạn bứt tốc trên mọi cung đường!
          </p>
        </div>

        {/* Cột 2 - Liên kết */}  
        <div className="footer-col" style={{ transitionDelay: "0.1s" }}>
          <h3 className="footer-title">Khám phá</h3>
          <ul className="footer-links">
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/products">Sản phẩm</Link></li>
            <li><Link to="/aboutus">Giới thiệu</Link></li>
            <li><Link to="/contact">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Cột 3 - Hỗ trợ */}
        <div className="footer-col" style={{ transitionDelay: "0.2s" }}>
          <h3 className="footer-title">Hỗ trợ</h3>
          <ul className="footer-links">
            <li><Link to="/chinh-sach-doi-tra">Chính sách đổi trả</Link></li>
            <li><Link to="/chinh-sach-bao-hanh">Chính sách bảo hành</Link></li>
            <li><Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link></li>
          </ul>
        </div>

        {/* Cột 4 - Mạng xã hội */}
        <div className="footer-col" style={{ transitionDelay: "0.3s" }}>
          <h3 className="footer-title">Theo dõi chúng tôi</h3>
          <div className="footer-socials">
            {[
              { icon: Facebook, url: "https://facebook.com" },
              { icon: Instagram, url: "https://instagram.com" },
              { icon: Youtube, url: "https://youtube.com" },
              { icon: Twitter, url: "https://x.com" },
            ].map(({ icon: Icon, url }, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Icon size={22} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Dòng cuối */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} ShopRunner. All rights reserved.
          <br />
          Made by <span className="footer-team">ShopRunner Team</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
