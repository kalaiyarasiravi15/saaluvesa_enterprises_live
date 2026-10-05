import React, { useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./index.css";
import "./animations.css";

import Header from "./components/Header";
import Hero from "./components/Hero";
import ValueStrip from "./components/ValueStrip";
import ConnectWithUs from "./components/ConnectWithUs";
import ProductsTeaser from "./components/ProductsTeaser";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import { applyLanguage } from "./components/LanguageSelector";

function ScrollToTopOrHash() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

// When React router navigates (client-side), new page content is rendered fresh.
// GT has already translated the DOM but new elements from React won't be covered.
// Re-firing applyLanguage after navigation tells GT to re-scan the DOM.
function ReapplySelectedLanguageOnNavigation() {
  const { pathname } = useLocation();

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem("saalu_selected_lang") || ""; } catch (_) {}
    if (!saved || saved === "en") return;

    // Give React time to finish rendering before asking GT to re-translate
    const timer = setTimeout(() => applyLanguage(saved), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

export function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <ConnectWithUs />
      <ProductsTeaser />
      <ValueStrip />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOrHash />
      <ReapplySelectedLanguageOnNavigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/labels" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
