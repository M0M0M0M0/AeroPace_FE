import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import './Contact.css';

function Contact() {
  const contactDetails = [
    {
      icon: MapPin,
      title: "Address",
      content: "FPT Polytechnic Building, 13 Trịnh Văn Bô, Nam Từ Liêm, Hà Nội",
    },
    {
      icon: Phone,
      title: "Phone Number",
      content: "(+84) 123 456 789",
    },
    {
      icon: Mail,
      title: "Email",
      content: "support@shoestore.vn",
    },
    {
      icon: Clock,
      title: "Opening Hours",
      content: "Monday - Sunday: 09:00 - 21:00",
    },
  ];

  return (
    <div className="contact-page-wrapper">
      <div className="contact-container">
        {/* Bên trái: Thông tin liên hệ */}
        <div className="contact-info-col">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            The Shoestore team is always ready to assist you 24/7.
          </p>

          <div className="contact-details-list">
            {contactDetails.map((item, index) => (
              <div className="contact-item" key={index}>
                <div className="contact-icon-box">
                  <item.icon className="contact-icon" size={24} />
                </div>
                <div className="contact-text-box">
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bên phải: Bản đồ Google Map (Đã cập nhật link của bạn) */}
        <div className="contact-map-col">
          <div className="map-canvas">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d59581.867128176746!2d105.67055074863278!3d21.0380192!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313455305afd834b%3A0x17268e09af37081e!2sT%C3%B2a%20nh%C3%A0%20FPT%20Polytechnic.!5e0!3m2!1sen!2s!4v1774445980542!5m2!1sen!2s"
             width="800" 
            height="800"
             style={{ border: 0 }}
             allowfullscreen="" loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;