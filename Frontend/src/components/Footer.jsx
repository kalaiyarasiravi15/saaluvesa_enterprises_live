import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import logo from "../assets/logo.jpeg";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        {/* Column 1: Brand & Trust Badge */}
        <div className="site-footer__brand">
          <div className="site-footer__brand-row">
            <img className="brand__logo" src={logo} alt="Saaluvesa" />
            <span className="brand__text">
              SAALU<span>VESA</span>
            </span>
          </div>
          <p className="site-footer__brand-desc">
            Saaluvesa Enterprises Private Limited — Premier custom apparel manufacturing, textile production, and global export solutions.
          </p>
          <div className="site-footer__trust-badge">
            <span className="trust-badge__dot" />
            <span>Inc. 2025 • Registered Garment Exporter</span>
          </div>
        </div>

        {/* Column 2: Navigation */}
        <div className="site-footer__col">
          <h4>Navigate</h4>
          <a href="/#home">Home</a>
          <Link to="/about">About Us</Link>
          <Link to="/products">Products</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        {/* Column 3: Order & Sourcing Inquiries */}
        <div className="site-footer__col">
          <h4>Order & Inquiries</h4>
          <a
            href="https://castbull.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__castbull-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>castbull.co.in</span>
          </a>

          <a href="mailto:contact@saaluvesa.com" className="site-footer__contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>contact@saaluvesa.com</span>
          </a>

          <a href="tel:+919488410884" className="site-footer__contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>+91 94884 10884</span>
          </a>

          <p className="site-footer__hours">
            <span>Sourcing Support:</span> Mon – Sat: 9:00 AM – 7:00 PM IST
          </p>
        </div>

        {/* Column 4: Registered Office & Export Destinations */}
        <div className="site-footer__col">
          <h4>Registered Office</h4>
          <div className="site-footer__address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon footer-icon--location">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p>
              Dr.No.18/76, Thiru.Ve.Ka. St,
              <br />
              Punjai Puliampatti, Sathyamangalam,
              <br />
              Erode, Tamil Nadu – 638459, India
            </p>
          </div>
          <p className="site-footer__exports">
            <span>Global Exports:</span> Shipping to USA, Europe, UAE, Australia & Worldwide.
          </p>
        </div>
      </div>

      <div className="wrap site-footer__bottom">
        <span className="site-footer__copy">
          Copyright &copy; {year} Saaluvesa Enterprises Private Limited.
        </span>
        <span className="site-footer__dev">
          Developed by{" "}
          <strong>
            <a href="https://saitechnosolutions.com/" target="_blank" rel="noopener noreferrer">
              Sai Techno Solutions
            </a>
          </strong>
        </span>
      </div>
    </footer>
  );
}
