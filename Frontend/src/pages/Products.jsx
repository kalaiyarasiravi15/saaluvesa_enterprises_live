import React from "react";
import "../index.css";
import "./Product.css";

import Header from "../components/Header";
import PageBanner from "../components/PageBanner";
import ProductsTeaser from "../components/ProductsTeaser";
import ProductsProcess from "../components/ProductsProcess";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

export default function Products() {
  return (
    <div className="products-page">
      <Header />

      {/* ---------- Banner ---------- */}
      <PageBanner
        title="Products"
        subtitle="Built for Global Export"
      />

      {/* Full responsive grid showing ALL products */}
      <ProductsTeaser showAll={true} />

      {/* How It Works process section */}
      <ProductsProcess />

      {/* Contact Form Section */}
      <ContactSection />

      <Footer />
    </div>
  );
}
