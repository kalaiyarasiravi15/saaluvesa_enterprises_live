import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import logo from "../assets/logo.jpeg";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        {/* Column 1: Brand & Registration */}
        <div className="site-footer__brand">
          <div className="site-footer__brand-col notranslate" translate="no">
            <img className="brand__logo" src={logo} alt="Saaluvesa" />
            <span className="brand__text notranslate" translate="no">
              SAALU<span>VESA</span>
            </span>
          </div>
        </div>

        {/* Column 2: Navigate */}
        <div className="site-footer__col site-footer__col--nav">
          <h4>Navigate</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/products">Products</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        {/* Column 3: Contact Mail and Contact Number */}
        <div className="site-footer__col site-footer__col--contact">
          <h4>Contact Mail and Contact Number</h4>

          <a href="mailto:contact@saaluvesa.com" className="site-footer__contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span className="notranslate" translate="no">contact@saaluvesa.com</span>
          </a>

          <a href="tel:+919488410884" className="site-footer__contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="notranslate" translate="no">+91 94884 10884</span>
          </a>
        </div>

        {/* Column 4: Sourcing */}
        <div className="site-footer__col site-footer__col--sourcing">
          <h4>Sourcing</h4>
          <div className="site-footer__hours">
            <span className="hours-label">Sourcing Support</span>
            <span className="hours-val">Mon – Sat: 9:00 AM – 7:00 PM IST</span>
          </div>
          <div className="site-footer__exports">
            <span className="exports-label">Global Exports</span>
            <span className="exports-val">USA, Europe, Australia &amp; Worldwide</span>
          </div>
        </div>

        {/* Column 5: Registered Office */}
        <div className="site-footer__col site-footer__col--office">
          <h4>Registered Office</h4>
          <div className="site-footer__address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-icon footer-icon--location">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <a 
              href="https://maps.app.goo.gl/gK7DXZfcxnwXErxB7?g_st=aw" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <p>
                Dr.No.18/76, Thiru.Ve.Ka. St,
                <br />
                Punjai Puliampatti, Sathyamangalam,
                <br />
                Erode, Tamil Nadu – 638459, India
              </p>
            </a>
          </div>
        </div>
      </div>

      <div className="wrap site-footer__bottom">
        <p className="site-footer__copy">
          Copyright &copy; {year} <span className="notranslate" translate="no">Saaluvesa Enterprises Private Limited</span>.
        </p>
        <p className="site-footer__dev">
          Developed by{" "}
          <a href="https://saitechnosolutions.com/" target="_blank" rel="noopener noreferrer" className="notranslate" translate="no">
            Sai Techno Solutions
          </a>
        </p>
      </div>
    </footer>
  );
}
