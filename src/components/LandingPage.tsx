import React, { useState } from "react";
import { Product } from "../types";
import { Shirt, Award, ShieldCheck, TreePine, Users, ArrowRight, Zap, Menu, X } from "lucide-react";

interface LandingPageProps {
  products: Product[];
  onLoginClick: () => void;
  onRegisterClick: (sponsorUsername?: string) => void;
  isLoggedIn: boolean;
  onDashboardClick: () => void;
  settings?: any;
}

export default function LandingPage({
  products,
  onLoginClick,
  onRegisterClick,
  isLoggedIn,
  onDashboardClick,
  settings,
}: LandingPageProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logo = settings?.logoText || "ZALORA.DENIM";
  const webName = settings?.webName || "Zalora Denim Premium MLM";
  const phone = settings?.contactPhone || "081234567890";
  const email = settings?.contactEmail || "support@zaloradenim.com";

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900" id="landing-container">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 shadow-sm" id="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-black tracking-tight text-slate-900">
              {logo}
            </span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
              MLM Binary
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#about-mlm" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Skema Bisnis
            </a>
            <a href="#koleksi-jeans" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Koleksi Denim
            </a>
            {isLoggedIn ? (
              <button
                id="btn-nav-dashboard"
                onClick={onDashboardClick}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  id="btn-nav-login"
                  onClick={onLoginClick}
                  className="text-sm font-bold text-slate-700 hover:text-slate-900 px-3 py-2 transition"
                >
                  Masuk
                </button>
                <button
                  id="btn-nav-join"
                  onClick={() => onRegisterClick()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                >
                  Gabung Member
                </button>
              </div>
            )}
          </div>

          {/* Mobile Burger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200/80 animate-fade-in px-4 pt-2 pb-6 space-y-4 shadow-lg">
            <div className="flex flex-col space-y-3">
              <a 
                href="#about-mlm" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-600 hover:text-slate-900 py-2 border-b border-slate-100 transition"
              >
                Skema Bisnis
              </a>
              <a 
                href="#koleksi-jeans" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-600 hover:text-slate-900 py-2 border-b border-slate-100 transition"
              >
                Koleksi Denim
              </a>
            </div>
            
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onDashboardClick();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLoginClick();
                  }}
                  className="w-full text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/60 py-2.5 rounded-xl text-sm font-extrabold transition"
                >
                  Masuk ke Akun
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onRegisterClick();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-extrabold transition text-center shadow-md shadow-blue-600/10"
                >
                  Gabung Member (Rp 100K)
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Hero Banner Section */}
      <section className="bg-slate-900 text-white overflow-hidden relative border-b border-slate-800" id="hero-section">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs text-blue-400 font-semibold uppercase tracking-wider">
              <Zap className="w-3 h-3 text-blue-400 animate-pulse" /> Peluncuran Premium 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-tight text-white">
              Denim Premium Dunia, <br />
              <span className="text-blue-500">Hasil Melimpah</span> Bersama.
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Zalora Denim menghadirkan koleksi celana jeans premium berkualitas ekspor (14oz stretch raw denim). Dapatkan harga diskon member premium Rp 100.000 hemat dan bangun aset pasif Anda melalui skema Binary 10 Level berpendapatan tak terbatas.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#koleksi-jeans"
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-blue-600/30 text-center text-sm tracking-wide"
              >
                Lihat Koleksi Jeans
              </a>
              <button
                id="btn-hero-register"
                onClick={() => onRegisterClick()}
                className="bg-white hover:bg-slate-100 text-slate-900 px-8 py-4 rounded-xl font-bold transition text-center text-sm shadow-md"
              >
                Gabung Member (Rp 100K)
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full rotate-3">
                Aktifasi Otomatis!
              </div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="text-blue-500 w-5 h-5" /> Potensi Bonus & Komisi MLM
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 border-b border-slate-700/50 pb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Bonus Sponsor (Rp 20.000)</h4>
                    <p className="text-xs text-slate-400">Komisi langsung setiap kali merekrut atau mengajak rekan baru beraktifasi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-b border-slate-700/50 pb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                    <TreePine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Bonus Pairing / Pasangan (Rp 10.000)</h4>
                    <p className="text-xs text-slate-400">Pencairan bonus harian saat terjadi pasangan di grup Kiri dan Kanan. Max 10 pasang/hari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-b border-slate-700/50 pb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Bonus Level Jaringan (Hingga 10 Level)</h4>
                    <p className="text-xs text-slate-400">Pembagian komisi berjenjang dari Level 1 (Rp 5.000) sampai Level 10 (Rp 1.000) setiap pertumbuhan jaringan.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Bonus Repeat Order (Rp 5.000)</h4>
                    <p className="text-xs text-slate-400">Pasif income berkelanjutan setiap kali jaringan di bawah Anda melakukan pembelian celana jeans.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MLM Trust Section */}
      <section className="py-20 bg-white border-b border-slate-200/60" id="about-mlm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">Kenapa Harus Zalora Denim?</h2>
            <p className="text-slate-500 text-sm sm:text-base">Menggabungkan kenyamanan produk fashion premium kelas atas dengan sistem komisi MLM yang adil, aman, dan transparan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#f8fafc] p-8 rounded-2xl border border-slate-200/50 text-left space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:translate-y-[-4px] transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                1
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Produk Jeans Nyata & Premium</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Bukan MLM investasi bodong tanpa produk. Kami menjual celana jeans premium kualitas retail tinggi dengan harga diskon khusus member yang sangat terjangkau.
              </p>
            </div>

            <div className="bg-[#f8fafc] p-8 rounded-2xl border border-slate-200/50 text-left space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:translate-y-[-4px] transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                2
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Integrasi API Gateway Cepat</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Deposit saldo dan aktifasi akun premium berjalan otomatis dalam hitungan detik menggunakan verifikasi otomatis API Gateway QRIS lokal & Virtual Account Bank.
              </p>
            </div>

            <div className="bg-[#f8fafc] p-8 rounded-2xl border border-slate-200/50 text-left space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:translate-y-[-4px] transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                3
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Pencairan Bonus Otomatis</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Ucapkan selamat tinggal pada pencairan yang lambat. Admin menyediakan opsi penarikan otomatis langsung masuk ke rekening bank lokal Anda secara real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Collection Grid */}
      <section id="koleksi-jeans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold tracking-tight text-slate-900">Koleksi Denim Terlaris</h2>
            <p className="text-slate-500 text-sm">Silakan login dan aktifkan akun premium Anda (Rp 100.000) untuk membuka diskon member dan berbelanja.</p>
          </div>
          <span className="text-xs bg-amber-50 text-amber-800 font-bold border border-amber-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 self-start md:self-auto shadow-sm">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Memerlukan Aktifasi Member Premium
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col hover:shadow-xl hover:border-slate-300/80 transition duration-300 group"
            >
              <div className="h-80 w-full overflow-hidden relative bg-slate-100">
                <img
                  referrerPolicy="no-referrer"
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                />
                <div className="absolute top-4 left-4 bg-slate-900/95 text-white text-[10px] font-mono font-medium px-2.5 py-1 rounded-md shadow-md">
                  Stok Gudang: {product.stock} pcs
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-base leading-snug text-slate-900 group-hover:text-blue-600 transition duration-300">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-4 border-t border-slate-100/80 pt-4">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Harga Umum</p>
                      <p className="text-slate-400 line-through font-bold text-sm">
                        Rp {product.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">Harga Member</p>
                      <p className="text-blue-600 font-display font-bold text-lg">
                        Rp {product.member_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100/50 text-blue-900 rounded-xl p-3.5 text-[11px] font-medium leading-relaxed">
                    Lebih hemat <span className="font-bold text-blue-700">Rp {(product.price - product.member_price).toLocaleString()}</span> dengan Lisensi Premium.
                  </div>

                  {isLoggedIn ? (
                    <button
                      onClick={onDashboardClick}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded-xl transition text-center shadow-md shadow-blue-600/10"
                    >
                      Beli di Dashboard Member
                    </button>
                  ) : (
                    <button
                      onClick={onLoginClick}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition text-center border border-slate-200/80"
                    >
                      Login Untuk Membeli
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900" id="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-lg font-extrabold tracking-widest text-white">
            {logo}
          </p>
          <p className="text-xs max-w-xl mx-auto">
            {webName} adalah portal e-commerce produk celana jeans premium terintegrasi jaringan pemasaran MLM binary terpercaya. Seluruh transaksi aman, legal, terverifikasi otomatis, dengan operasional stok gudang transparan.
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-400 font-medium font-mono">
            <span>WhatsApp / Telp: <strong className="text-white">{phone}</strong></span>
            <span>Email: <strong className="text-white">{email}</strong></span>
          </div>
          <div className="border-t border-slate-900 pt-6 text-[11px] text-slate-600">
            © 2026 PT {webName} Indonesia. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
