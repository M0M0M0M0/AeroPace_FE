import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const coreValues = [
    { title: "Devotion", desc: "Always put customers at the center of all activities." },
    { title: "Quality", desc: "Provide the best authentic running products." },
    { title: "Community", desc: "Spread the spirit of sports to people across Vietnam." }
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>WHO ARE WE?</h1>
          <p>Our journey to bring health and joy through every run.</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-text">
            <h2>Our Story</h2>
            <p>
              Starting from a passion for running, we understand that a good pair of shoes 
              is not just an accessory, but a companion on every journey.
            </p>
            <p>
              Founded with the goal of supporting the running community, we continuously 
              seek the latest technologies to protect your feet.
            </p>
          </div>
          <div className="about-image">
            <img src="https://www.womensrunning.co.uk/wp-content/uploads/2018/09/half-marathon-race.png" alt="Journey" />
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="values-section">
        <div className="abu-section-title">
          <h2>Core Values</h2>
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
            <img src="https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/4/18/1035166/Tay-Ho-Hm-2021-Vdv-1.JPG" alt="Tầm nhìn" />
          </div>
          <div className="about-text">
            <h2>Vision & Mission</h2>
            <p>
              To become the most trusted destination for the running community in Vietnam, 
              not only for our products but also for knowledge and experience.
            </p>
            <button className="cta-button">Discover More</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;