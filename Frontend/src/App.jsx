import React, { useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import { applyLanguage, getActiveLanguageCode } from "./components/LanguageSelector";

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

// React replaces page content during client-side navigation. Reapply only a
// language explicitly selected in this visit so newly rendered page content is
// translated with the rest of the site.
function ReapplySelectedLanguageOnNavigation() {
  const { pathname } = useLocation();

  useEffect(() => {
    const languageCode = getActiveLanguageCode();
    if (languageCode === "en") return undefined;

    const timer = setTimeout(() => applyLanguage(languageCode), 0);
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
      </Routes>
    </BrowserRouter>
  );
}
