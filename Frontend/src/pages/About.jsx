import React from "react";
import { Link } from "react-router-dom";
import "../index.css";
import "./About.css";
import useScrollAnimation from "../hooks/useScrollAnimation";

import Header from "../components/Header";
import PageBanner from "../components/PageBanner";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

const ICONS = {
  "trending-up": (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  "shield-check": (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
};

const WHY_CHOOSE_US = [
  {
    icon: "trending-up",
    num: "01",
    title: "Export Expertise",
    body: "Strong understanding of international trade and compliance standards.",
  },
  {
    icon: "shield-check",
    num: "02",
    title: "Quality Commitment",
    body: "Rigorous quality checks ensure durability and comfort in every consignment.",
  },
  {
    icon: "users",
    num: "03",
    title: "Customer-Centric Approach",
    body: "Designs and solutions tailored to each client's requirements.",
  },
  {
    icon: "globe",
    num: "04",
    title: "Global Reach",
    body: "Efficient logistics and supply chain management for timely delivery worldwide.",
  },
];

export default function About() {
  const animRef = useScrollAnimation();

  return (
    <div className="about-page" ref={animRef}>
      <Header />

      {/* ---------- Banner ---------- */}
      <PageBanner
        title="About Us"
      />

      {/* ---------- Company Overview ---------- */}
      <section className="about-section about-section--ivory">
        <div className="wrap about-overview">
          <div className="about-overview__layout">
            <div className="about-overview__text" data-animate="fade-left">
              <div className="about-section__head">
                <div className="eyebrow about-section__eyebrow">Our Story</div>
                <div className="about-established">
                  <span className="about-established__label">Established</span>
                  <span className="about-established__year">2025</span>
                </div>
                <h2>Who We Are.</h2>
              </div>
              <p>
                Saaluvesa Enterprises Private Limited was incorporated on 14 September 2025 in INDIA
                with a broad vision to engage in wholesale and retail trading, importing, exporting,
                and distribution of a wide range of goods and commodities across India and
                international markets.
              </p>
              <p>
                Our incorporation objectives empower us to operate retail outlets, warehouses, online
                platforms, and trading facilities, while also aiming to build strong partnerships at
                national and international level.
              </p>
              <p>
                As a registered Indian private limited company, we maintain all mandatory business registrations required for domestic operations and international trade.
              </p>
              <ul className="about-compliance-list">
                <li><strong>Corporate Identification Number (CIN)</strong> - U46900TZ2025PTC036041</li>
                <li><strong>Goods and Services Tax Identification Number (GSTIN)</strong> – 33ABRCS3304A1ZR</li>
                <li><strong>Importer Exporter Code (IEC)</strong> - ABRCS3304A</li>
              </ul>
              <p>
                These registrations enable us to conduct business responsibly, transparently, and in accordance with applicable regulatory requirements.
              </p>
            </div>
            <div className="about-overview__image-wrap" data-animate="fade-right">
              <img
                src="/whoweare-baner.jpeg"
                alt="Saaluvesa Enterprises Global Trade & Exports"
                className="about-overview__image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Vision & Mission (From PDF) ---------- */}
      <section className="about-section about-section--ivory-deep">
        <div className="wrap">
          <div className="about-section__head" data-animate="fade-up">
            <div className="eyebrow about-section__eyebrow">Vision & Mission</div>
            <h2>Guided by Purpose, Driven by Quality.</h2>
          </div>

          <div className="about-vm-grid">
            <div className="about-vm-card delay-1" data-animate="card">
              <h3>Our Vision</h3>
              <p>
                To become a trusted global export partner recognized for reliability, quality, ethical business practices, and customer-focused solutions across international markets.
              </p>
            </div>

            <div className="about-vm-card delay-2" data-animate="card">
              <h3>Our Mission</h3>
              <ul>
                <li>To promote quality products from India to global markets.</li>
                <li>To create sustainable value for customers, suppliers, and stakeholders.</li>
                <li>To support international trade through efficient sourcing and export management.</li>
                <li>To establish long-term partnerships based on trust, transparency, and mutual growth.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Why Choose Us ---------- */}
      <section className="about-section about-section--navy">
        <div className="wrap">
          <div className="about-section__head" data-animate="fade-up">
            <div className="eyebrow about-section__eyebrow">Why Choose Us</div>
            <h2>Built on Expertise, Quality, and Reach.</h2>
          </div>

          <div className="about-why-grid">
            {WHY_CHOOSE_US.map((item, i) => (
              <div
                className={`about-why-card about-why-card--light delay-${i + 1}`}
                data-animate="card"
                key={item.title}
              >
                <div className="about-why-card__top">
                  <span className="about-why-card__num">{item.num}</span>
                  <span className="about-why-card__icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {ICONS[item.icon]}
                    </svg>
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Partner With Us (From PDF) ---------- */}
      <section className="about-section about-section--ivory">
        <div className="wrap">
          <div className="about-partner-card" data-animate="card">
            <div className="eyebrow about-section__eyebrow" style={{ justifyContent: "center" }}>Global Collaboration</div>
            <h3>Partner With Us</h3>
            <p>
              Whether you are an importer, distributor, wholesaler, retailer, or sourcing partner, Saaluvesa Enterprises Private Limited is committed to delivering dependable export solutions that support your business growth.
            </p>
            <p className="about-partner-tagline">
              Together, we connect products, businesses, and opportunities across borders.
            </p>
            <Link to="/contact" className="btn btn--mint">
              <span>Contact Us</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Contact Section ---------- */}
      <ContactSection />

      <Footer />
    </div>
  );
}
