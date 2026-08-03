import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Download from './pages/Download';
import About from './pages/About';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const Layout = ({ children }) => (
  <>
    <Header />
    <main style={{ minHeight: '100vh' }}>{children}</main>
    <Footer />
    <CookieBanner />
  </>
);

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/fiyatlandirma" element={<Layout><Pricing /></Layout>} />
        <Route path="/indir" element={<Layout><Download /></Layout>} />
        <Route path="/hakkimizda" element={<Layout><About /></Layout>} />
        <Route path="/destek" element={<Layout><Support /></Layout>} />
        <Route path="/kullanim-kosullari" element={<Layout><Terms /></Layout>} />
        <Route path="/gizlilik-politikasi" element={<Layout><Privacy /></Layout>} />
        <Route path="/cerez-politikasi" element={<Layout><Cookies /></Layout>} />
        <Route path="*" element={<Layout><Home /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
