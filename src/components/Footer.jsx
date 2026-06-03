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
          <h2 className="footer-logo">AEROPACE</h2>
          <p className="footer-text">
            From treadmil to racetrack<br/> Optimal gear, break your limits. <br />
            Discover the professional gear that helps you accelerate on every track!
          </p>
        </div>

        {/* Cột 2 - Liên kết */}  
        <div className="footer-col" style={{ transitionDelay: "0.1s" }}>
          <h3 className="footer-title">Explore</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/aboutus">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Cột 3 - Hỗ trợ */}
        <div className="footer-col" style={{ transitionDelay: "0.2s" }}>
          <h3 className="footer-title">Support</h3>
          <ul className="footer-links">
            <li><Link to="/chinh-sach-doi-tra">Return Policy</Link></li>
            <li><Link to="/chinh-sach-bao-hanh">Warranty Policy</Link></li>
            <li><Link to="/chinh-sach-bao-mat">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Cột 4 - Mạng xã hội */}
        <div className="footer-col" style={{ transitionDelay: "0.3s" }}>
          <h3 className="footer-title">Follow Us</h3>
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
          © {new Date().getFullYear()} AeroPace. All rights reserved.
          <br />
          Made by <span className="footer-team">AeroPace Team</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
