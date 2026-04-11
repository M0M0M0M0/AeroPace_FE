import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const coreValues = [
    { title: "Tận Tâm", desc: "Luôn đặt khách hàng làm trọng tâm trong mọi hoạt động." },
    { title: "Chất Lượng", desc: "Cung cấp những sản phẩm chạy bộ chính hãng tốt nhất." },
    { title: "Cộng Đồng", desc: "Lan tỏa tinh thần thể thao đến mọi người dân Việt Nam." }
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>CHÚNG TÔI LÀ AI?</h1>
          <p>Hành trình mang lại sức khỏe và niềm vui qua từng bước chạy.</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-text">
            <h2>Câu Chuyện Của Chúng Tôi</h2>
            <p>
              Bắt đầu từ niềm đam mê chạy bộ cháy bỏng, chúng tôi hiểu rằng một đôi giày tốt 
              không chỉ là phụ kiện, mà là người bạn đồng hành trên mọi cung đường.
            </p>
            <p>
              Được thành lập với mục tiêu hỗ trợ cộng đồng runner, chúng tôi không ngừng 
              tìm kiếm những công nghệ mới nhất để bảo vệ đôi chân của bạn.
            </p>
          </div>
          <div className="about-image">
            <img src="https://www.womensrunning.co.uk/wp-content/uploads/2018/09/half-marathon-race.png" alt="Hành trình" />
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="values-section">
        <div className="section-title">
          <h2>Giá Trị Cốt Lõi</h2>
        </div>
        <div className="values-grid">
          {coreValues.map((value, index) => (
            <div key={index} className="value-card">
              <h3>{value.title}</h3>
              <p>{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="about-section alternate">
        <div className="about-grid">
          <div className="about-image">
            <img src="https://img.cand.com.vn/resize/800x800/NewFiles/Images/2023/11/16/1-1700110703839.jpg" alt="Tầm nhìn" />
          </div>
          <div className="about-text">
            <h2>Tầm Nhìn & Sứ Mệnh</h2>
            <p>
              Trở thành điểm đến tin cậy nhất cho cộng đồng chạy bộ tại Việt Nam, 
              không chỉ về sản phẩm mà còn về kiến thức và trải nghiệm.
            </p>
            <button className="cta-button">Khám Phá Thêm</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;