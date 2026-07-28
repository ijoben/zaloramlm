import React, { useState, useEffect, useRef } from "react";
import { Product } from "../types";
import { DEFAULT_PRODUCTS } from "../data/defaultProducts";
import { 
  ShoppingBag, Heart, Search, Truck, ChevronLeft, ChevronRight, 
  X, Check, Menu, Filter, ArrowRight, User, ShieldCheck, Sparkles,
  Tag, Clock, MapPin, Eye, RefreshCw, Star
} from "lucide-react";

interface LandingPageProps {
  products: Product[];
  onLoginClick: () => void;
  onRegisterClick: (sponsorUsername?: string) => void;
  isLoggedIn: boolean;
  onDashboardClick: () => void;
  settings?: any;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function LandingPage({
  products,
  onLoginClick,
  onRegisterClick,
  isLoggedIn,
  onDashboardClick,
  settings,
}: LandingPageProps) {
  // Mobile & Modals State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isMemberOnlyModalOpen, setIsMemberOnlyModalOpen] = useState(false);
  const [selectedProductForMemberModal, setSelectedProductForMemberModal] = useState<Product | null>(null);

  // E-Commerce Functional States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all"); // 'all' | 'pria' | 'wanita' | 'aksesoris' | 'diskon'
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  // Ref for product carousel horizontal scrolling
  const carouselRef = useRef<HTMLDivElement>(null);

  // Track Order State
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingError, setTrackingError] = useState("");

  // Slide Utama (Hero Carousel) State
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "501® ORIGINAL DENIM",
      subtitle: "IKONIK SEJAK 1873. POTONGAN LURUS DENGAN RAW DENIM 14OZ PREMUM.",
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1600&auto=format&fit=crop",
      badge: "KOLEKSI IKONIK",
      cta: "BELANJA KOLEKSI 501®",
      categoryTarget: "pria"
    },
    {
      id: 2,
      title: "TRUCKER JACKET & OUTER",
      subtitle: "GAYA IKONIK DENIM MODERN UNTUK PENAMPILAN CASUAL HARIAN ANDA.",
      image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1600&auto=format&fit=crop",
      badge: "KOLEKSI TERBARU",
      cta: "LIHAT JAKET DENIM",
      categoryTarget: "wanita"
    },
    {
      id: 3,
      title: "SEASONAL SALE UP TO 40%",
      subtitle: "DISKON SPESIAL KOLEKSI DENIM ELEGAN DENGAN HARGA KHUSUS EKSKLUSIF.",
      image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1600&auto=format&fit=crop",
      badge: "DISKON MINGGU INI",
      cta: "BERBURU DISKON",
      categoryTarget: "diskon"
    }
  ];

  // Auto-play hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const webName = settings?.webName || "Levi's® Zalora Official Store";
  const phone = settings?.contactPhone || "081234567890";
  const email = settings?.contactEmail || "support@zaloradenim.com";

  // Helper to categorize products
  const categorizeProduct = (p: Product) => {
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes("wanita") || nameLower.includes("women") || nameLower.includes("skirt") || nameLower.includes("crop")) {
      return "wanita";
    }
    if (nameLower.includes("topi") || nameLower.includes("ikat pinggang") || nameLower.includes("belt") || nameLower.includes("tas") || nameLower.includes("aksesoris")) {
      return "aksesoris";
    }
    return "pria";
  };

  const activeProducts = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;

  // Filter products by active Category & Search Query
  const filteredProducts = activeProducts.filter((p) => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    if (activeCategory === "all") return true;
    if (activeCategory === "pria") {
      return categorizeProduct(p) === "pria" || p.name.toLowerCase().includes("501") || p.name.toLowerCase().includes("slim") || p.name.toLowerCase().includes("men");
    }
    if (activeCategory === "wanita") {
      return categorizeProduct(p) === "wanita" || p.name.toLowerCase().includes("wanita") || p.name.toLowerCase().includes("women") || p.name.toLowerCase().includes("721");
    }
    if (activeCategory === "aksesoris") {
      return categorizeProduct(p) === "aksesoris" || p.name.toLowerCase().includes("belt") || p.name.toLowerCase().includes("cap") || p.name.toLowerCase().includes("tas");
    }
    if (activeCategory === "diskon") {
      return (p.price - p.member_price) > 0;
    }
    return true;
  });

  // Best Sellers (Product Carousel)
  const bestSellerProducts = activeProducts.slice(0, 8);

  // Scroll carousel left/right
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Cart Functions (Enforcing Member-Only Rule)
  const addToCart = (product: Product) => {
    if (!isLoggedIn) {
      setSelectedProductForMemberModal(product);
      setIsMemberOnlyModalOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartTotalMember = cart.reduce(
    (sum, item) => sum + item.product.member_price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Wishlist Functions
  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Order Tracking Handler
  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");
    setTrackingResult(null);

    const cleanInput = trackingNumber.trim().toUpperCase();
    if (!cleanInput) {
      setTrackingError("Silakan masukkan Nomor Resi atau ID Transaksi anda.");
      return;
    }

    setTrackingResult({
      invoice: cleanInput,
      status: "DALAM PENGIRIMAN",
      courier: "JNE REGULER (003482194021)",
      origin: "Gudang Utama Levi's® Zalora Jakarta",
      destination: "Penerima (Sesuai Alamat Pemesan)",
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      steps: [
        { title: "Pesanan Dikonfirmasi & Dipacking", time: "09:15 WIB", done: true },
        { title: "Diserahkan ke Kurir Ekspedisi (JNE)", time: "11:30 WIB", done: true },
        { title: "Transit di Hub Logistik Jakarta Pusat", time: "14:20 WIB", done: true },
        { title: "Kurir Menuju Alamat Tujuan", time: "Estimasi Hari Ini", done: false }
      ]
    });
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-neutral-900 font-sans selection:bg-[#C41230] selection:text-white overflow-x-hidden w-full" id="store-landing-root">
      
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#111111] text-white text-[11px] font-bold tracking-widest uppercase py-2 px-4 border-b border-neutral-800 flex items-center justify-center gap-3 sm:gap-6 overflow-x-auto whitespace-nowrap">
        <span className="flex items-center gap-1.5 text-neutral-300 shrink-0">
          <Truck className="w-3.5 h-3.5 text-[#C41230]" /> FREE ONGKIR SELURUH INDONESIA
        </span>
        <span className="hidden md:inline-block text-neutral-600">•</span>
        <span className="hidden md:inline-block text-neutral-300">
          BAYAR DI TEMPAT (COD) TERSEDIA
        </span>
        <span className="hidden md:inline-block text-neutral-600">•</span>
        <span className="bg-[#C41230] text-white px-2 py-0.5 font-black text-[9px] tracking-wider uppercase rounded-xs shrink-0">
          DISKON MEMBER RP 100.000/PCS
        </span>
      </div>

      {/* 2. Main E-Commerce Header Navigation */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs w-full" id="main-header">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 min-w-0">
            <a href="#" className="flex items-center gap-1.5 group">
              <div className="bg-[#C41230] text-white font-black font-display text-xs sm:text-2xl tracking-tighter px-2 sm:px-4 py-1 sm:py-1.5 rounded-b-md shadow-md uppercase border-t-2 border-red-800 shrink-0">
                LEVI'S® <span className="font-light text-red-200 ml-0.5 sm:ml-1">DENIM</span>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-[11px] font-black tracking-widest uppercase text-neutral-800 leading-tight">
                  OFFICIAL STORE
                </span>
                <span className="text-[9px] text-[#C41230] font-bold tracking-wider uppercase">
                  ZALORA ONLINE MARKETPLACE
                </span>
              </div>
            </a>
          </div>

          {/* Center Category Links (Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => setActiveCategory("pria")}
              className={`text-xs font-black uppercase tracking-widest py-1 transition border-b-2 ${
                activeCategory === "pria"
                  ? "border-[#C41230] text-[#C41230]"
                  : "border-transparent text-neutral-800 hover:text-[#C41230]"
              }`}
            >
              PRIA
            </button>
            <button
              onClick={() => setActiveCategory("wanita")}
              className={`text-xs font-black uppercase tracking-widest py-1 transition border-b-2 ${
                activeCategory === "wanita"
                  ? "border-[#C41230] text-[#C41230]"
                  : "border-transparent text-neutral-800 hover:text-[#C41230]"
              }`}
            >
              WANITA
            </button>
            <button
              onClick={() => setActiveCategory("aksesoris")}
              className={`text-xs font-black uppercase tracking-widest py-1 transition border-b-2 ${
                activeCategory === "aksesoris"
                  ? "border-[#C41230] text-[#C41230]"
                  : "border-transparent text-neutral-800 hover:text-[#C41230]"
              }`}
            >
              AKSESORIS
            </button>
            <button
              onClick={() => setActiveCategory("diskon")}
              className={`text-xs font-black uppercase tracking-widest py-1 transition flex items-center gap-1.5 ${
                activeCategory === "diskon"
                  ? "bg-[#C41230] text-white px-2.5 py-1"
                  : "text-[#C41230] hover:bg-red-50 px-2.5 py-1"
              }`}
            >
              <Tag className="w-3.5 h-3.5" /> DISKON
            </button>

            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="text-xs font-black uppercase tracking-widest text-neutral-600 hover:text-neutral-900 transition flex items-center gap-1.5 border-l border-neutral-200 pl-6"
            >
              <Truck className="w-4 h-4 text-[#C41230]" /> TRACK PESANAN
            </button>
          </nav>

          {/* Right Actions: Search, Wishlist, Cart, Member Login, Mobile Menu Toggle */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            
            {/* Search Trigger */}
            <button
              id="btn-trigger-search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1 sm:p-2 text-neutral-700 hover:text-[#C41230] transition relative"
              title="Cari Produk Denim"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Wishlist Trigger */}
            <button
              id="btn-trigger-wishlist"
              onClick={() => setIsWishlistOpen(true)}
              className="p-1 sm:p-2 text-neutral-700 hover:text-[#C41230] transition relative hidden xs:flex"
              title="Wishlist Saya"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-[#C41230] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <button
              id="btn-trigger-cart"
              onClick={() => setIsCartOpen(true)}
              className="p-1 sm:p-2 text-neutral-700 hover:text-[#C41230] transition relative flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xs"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#C41230]" />
              <span className="text-xs font-black font-mono text-neutral-900">
                {cartCount}
              </span>
            </button>

            {/* Member Area Portal Button */}
            {isLoggedIn ? (
              <button
                id="btn-header-dashboard"
                onClick={onDashboardClick}
                className="bg-neutral-900 hover:bg-[#C41230] text-white px-2 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition flex items-center gap-1 shadow-xs shrink-0"
              >
                <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">MEMBER AREA</span><span className="sm:hidden">MEMBER</span>
              </button>
            ) : (
              <button
                id="btn-header-login"
                onClick={onLoginClick}
                className="bg-[#C41230] hover:bg-[#A00E26] text-white px-2 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition shadow-xs flex items-center gap-1 shrink-0"
              >
                <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">MEMBER PORTAL</span><span className="sm:hidden">MASUK</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button - Always Fits & Visible */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 text-neutral-900 lg:hidden focus:outline-none shrink-0 border border-neutral-300 rounded-xs bg-neutral-100 hover:bg-neutral-200"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-[#C41230]" /> : <Menu className="w-5 h-5 text-neutral-900" />}
            </button>
          </div>
        </div>

        {/* Search Bar Slide Down Input */}
        {isSearchOpen && (
          <div className="bg-neutral-900 text-white border-t border-neutral-800 p-4 shadow-xl animate-fadeIn">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <Search className="w-5 h-5 text-[#C41230] shrink-0" />
              <input
                type="text"
                placeholder="Cari produk denim, celana 501®, jaket trucker, atau ukuran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-white text-sm focus:outline-none font-medium placeholder-neutral-500"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-neutral-400 hover:text-white uppercase font-bold"
                >
                  RESET
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 hover:text-[#C41230]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Dropdown Category Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b-2 border-[#C41230] px-6 py-4 space-y-3 shadow-xl">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-black uppercase tracking-widest py-2 border-b border-neutral-100"
              >
                SEMUA KOLEKSI
              </button>
              <button
                onClick={() => {
                  setActiveCategory("pria");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-black uppercase tracking-widest py-2 border-b border-neutral-100 text-neutral-800"
              >
                KOLEKSI PRIA
              </button>
              <button
                onClick={() => {
                  setActiveCategory("wanita");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-black uppercase tracking-widest py-2 border-b border-neutral-100 text-neutral-800"
              >
                KOLEKSI WANITA
              </button>
              <button
                onClick={() => {
                  setActiveCategory("aksesoris");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-black uppercase tracking-widest py-2 border-b border-neutral-100 text-neutral-800"
              >
                AKSESORIS & BELT
              </button>
              <button
                onClick={() => {
                  setActiveCategory("diskon");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-black uppercase tracking-widest py-2 border-b border-neutral-100 text-[#C41230] flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" /> PROMO DISKON EKSKLUSIF
              </button>
              <button
                onClick={() => {
                  setIsTrackModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-black uppercase tracking-widest py-2 text-neutral-700 flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4 text-[#C41230]" /> TRACK STATUS PESANAN
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. Slide Utama (Hero Carousel Slider) */}
      <section className="relative bg-neutral-900 text-white overflow-hidden border-b-4 border-[#C41230]" id="hero-slider">
        <div className="relative h-[480px] sm:h-[560px] lg:h-[620px] w-full">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Background Image with Dark Vignette */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent"></div>

              {/* Slide Content */}
              <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-start space-y-6">
                <span className="bg-[#C41230] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {slide.badge}
                </span>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-none text-white max-w-2xl uppercase">
                  {slide.title}
                </h1>

                <p className="text-neutral-300 text-xs sm:text-sm max-w-lg leading-relaxed border-l-2 border-[#C41230] pl-4">
                  {slide.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      setActiveCategory(slide.categoryTarget);
                      const el = document.getElementById("katalog-produk");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-[#C41230] hover:bg-[#a00e26] text-white px-8 py-4 text-xs font-black uppercase tracking-widest transition shadow-xl flex items-center gap-2"
                  >
                    {slide.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsTrackModalOpen(true)}
                    className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-6 py-4 text-xs font-black uppercase tracking-widest transition flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-[#C41230]" /> LACAK PESANAN
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Prev/Next Controls */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-neutral-900/60 hover:bg-[#C41230] text-white p-3 transition backdrop-blur-xs"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-neutral-900/60 hover:bg-[#C41230] text-white p-3 transition backdrop-blur-xs"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators / Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 transition-all duration-300 ${
                i === currentSlide ? "w-8 bg-[#C41230]" : "w-2 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* 4. Brand Value Props / Store Benefits */}
      <section className="bg-white border-b border-neutral-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="p-4 flex flex-col items-center space-y-2 border-r border-neutral-100 last:border-none">
            <ShieldCheck className="w-7 h-7 text-[#C41230]" />
            <h4 className="font-black text-xs uppercase tracking-wider text-neutral-900">100% OTENTIK DENIM</h4>
            <p className="text-[11px] text-neutral-500">Produksi bahan Raw Denim 14oz bermutu tinggi.</p>
          </div>
          <div className="p-4 flex flex-col items-center space-y-2 border-r border-neutral-100 last:border-none">
            <Truck className="w-7 h-7 text-[#C41230]" />
            <h4 className="font-black text-xs uppercase tracking-wider text-neutral-900">GRATIS ONGKIR</h4>
            <p className="text-[11px] text-neutral-500">Pengiriman cepat ke seluruh wilayah Indonesia.</p>
          </div>
          <div className="p-4 flex flex-col items-center space-y-2 border-r border-neutral-100 last:border-none">
            <RefreshCw className="w-7 h-7 text-[#C41230]" />
            <h4 className="font-black text-xs uppercase tracking-wider text-neutral-900">GARANSI 30 HARI</h4>
            <p className="text-[11px] text-neutral-500">Penukaran size celana aman & tanpa ribet.</p>
          </div>
          <div className="p-4 flex flex-col items-center space-y-2">
            <Tag className="w-7 h-7 text-[#C41230]" />
            <h4 className="font-black text-xs uppercase tracking-wider text-neutral-900">HARGA KHUSUS MEMBER</h4>
            <p className="text-[11px] text-neutral-500">Potongan langsung untuk pemilik lisensi member.</p>
          </div>
        </div>
      </section>

      {/* 5. Carousel Produk (Best Sellers Slider - Fixed Responsive Layout & Navigation) */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-neutral-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#C41230] uppercase">
              TOP TRENDING DENIM
            </span>
            <h2 className="text-xl sm:text-3xl font-black font-display text-neutral-900 uppercase tracking-tight">
              PRODUK POPULER MINGGU INI
            </h2>
          </div>

          {/* Carousel Scroll Controls */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:inline-block">
              GESER / KLIK PANAH
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCarousel("left")}
                className="p-2 sm:p-2.5 bg-white hover:bg-[#C41230] hover:text-white text-neutral-800 transition border border-neutral-300 shadow-xs active:scale-95"
                title="Geser Kiri"
                aria-label="Geser Kiri"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="p-2 sm:p-2.5 bg-white hover:bg-[#C41230] hover:text-white text-neutral-800 transition border border-neutral-300 shadow-xs active:scale-95"
                title="Geser Kanan"
                aria-label="Geser Kanan"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel Container */}
        <div
          ref={carouselRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-[#C41230] scrollbar-track-neutral-100 snap-x snap-mandatory touch-pan-x scroll-smooth min-w-0 w-full"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {bestSellerProducts.map((p) => (
            <div
              key={p.id}
              className="w-[200px] sm:w-[240px] md:w-[260px] bg-white border border-neutral-200 snap-start flex flex-col hover:border-[#C41230] transition group shadow-xs shrink-0"
            >
              <div className="h-44 sm:h-56 w-full overflow-hidden relative bg-neutral-100">
                <img
                  referrerPolicy="no-referrer"
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-0 bg-[#C41230] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                  BEST SELLER
                </div>
                <button
                  onClick={() => toggleWishlist(p.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                    wishlist.includes(p.id)
                      ? "bg-[#C41230] text-white"
                      : "bg-white/80 text-neutral-700 hover:text-[#C41230]"
                  }`}
                  title="Tambah ke Wishlist"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wide text-neutral-900 line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-400 line-through text-xs font-bold">
                      Rp {p.price.toLocaleString()}
                    </span>
                    <span className="text-[#C41230] font-black font-display text-base">
                      Rp {p.member_price.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    className="w-full bg-neutral-900 hover:bg-[#C41230] text-white py-2.5 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> TAMBAH KE KERANJANG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Main Product Catalog Section (Katalog Utama) */}
      <section id="katalog-produk" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Section Header & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-[#C41230] uppercase">
              LEVI'S® ZALORA CATALOGUE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-neutral-900 uppercase tracking-tight">
              PRODUK BARU & KOLEKSI EKSKLUSIF
            </h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "SEMUA PRODUK" },
              { id: "pria", label: "PRIA" },
              { id: "wanita", label: "WANITA" },
              { id: "aksesoris", label: "AKSESORIS" },
              { id: "diskon", label: "PROMO DISKON" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                  activeCategory === cat.id
                    ? "bg-[#C41230] text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-black text-base uppercase text-neutral-800">TIDAK ADA PRODUK DITEMUKAN</h3>
            <p className="text-xs text-neutral-500">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-2 inline-block bg-[#C41230] text-white text-xs font-black uppercase px-6 py-2.5 tracking-widest"
            >
              RESET FILTER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-neutral-200 flex flex-col hover:border-[#C41230] transition duration-300 group shadow-xs"
              >
                {/* Image & Badges */}
                <div className="h-80 w-full overflow-hidden relative bg-neutral-100">
                  <img
                    referrerPolicy="no-referrer"
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  
                  {/* Red Tab Tag */}
                  <div className="absolute top-3 left-0 bg-[#C41230] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 shadow-md">
                    LEVI'S® RED TAB™
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                      wishlist.includes(product.id)
                        ? "bg-[#C41230] text-white"
                        : "bg-white/80 text-neutral-700 hover:text-[#C41230]"
                    }`}
                    title="Simpan ke Wishlist"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>

                  <div className="absolute bottom-3 left-3 bg-neutral-900/90 text-white text-[10px] font-mono px-2 py-0.5">
                    STOK: {product.stock} PCS
                  </div>
                </div>

                {/* Details & Prices */}
                <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm uppercase tracking-wide text-neutral-900 group-hover:text-[#C41230] transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-neutral-100">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Harga Normal</p>
                        <p className="text-neutral-400 line-through font-bold text-xs">
                          Rp {product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-[#C41230] font-black uppercase tracking-wider">Harga Member</p>
                        <p className="text-[#C41230] font-black font-display text-lg">
                          Rp {product.member_price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-neutral-900 hover:bg-[#C41230] text-white text-xs font-black uppercase tracking-widest py-3 transition text-center rounded-none flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" /> TAMBAH KE KERANJANG
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. Member-Only Required Purchase Rule Modal */}
      {isMemberOnlyModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 shadow-2xl border-t-4 border-[#C41230] relative animate-fadeIn">
            <button
              onClick={() => setIsMemberOnlyModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 mb-4">
              <div className="p-3 bg-[#C41230]/10 text-[#C41230] rounded-full">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider text-neutral-900">
                  KHUSUS MEMBER TERDAFTAR
                </h3>
                <p className="text-[11px] text-[#C41230] font-bold">Lisensi Keanggotaan Rp 550.000</p>
              </div>
            </div>

            {selectedProductForMemberModal && (
              <div className="bg-neutral-50 p-3 border border-neutral-200 flex items-center gap-3 mb-4">
                <img src={selectedProductForMemberModal.image} alt="" className="w-12 h-12 object-cover" />
                <div>
                  <p className="font-black text-xs uppercase line-clamp-1 text-neutral-900">{selectedProductForMemberModal.name}</p>
                  <p className="text-[#C41230] font-black text-xs font-display">
                    Harga Diskon Member: Rp {selectedProductForMemberModal.member_price.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-600 leading-relaxed mb-6">
              Sesuai peraturan sistem Zalora Denim, produk berkualitas ini <strong>hanya dapat dibeli oleh Member Terdaftar & Bayar Lisensi (Rp 550.000)</strong>. 
              Silakan Masuk ke akun anda atau lakukan Pendaftaran Member Baru.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsMemberOnlyModalOpen(false);
                  onLoginClick();
                }}
                className="w-full bg-[#C41230] hover:bg-[#a00e26] text-white py-3 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" /> MASUK AKUN MEMBER
              </button>
              <button
                onClick={() => {
                  setIsMemberOnlyModalOpen(false);
                  onRegisterClick();
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> DAFTAR MEMBER (RP 550.000)
              </button>
              <button
                onClick={() => setIsMemberOnlyModalOpen(false)}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 text-xs font-bold uppercase tracking-wider transition text-center"
              >
                BATAL / KEMBALI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Track Pesanan Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl border-t-4 border-[#C41230] relative animate-fadeIn">
            <button
              onClick={() => setIsTrackModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 mb-6">
              <div className="p-3 bg-[#C41230]/10 text-[#C41230]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg uppercase tracking-wider text-neutral-900">
                  LACAK PESANAN DENIM
                </h3>
                <p className="text-xs text-neutral-500">Cek status pengiriman real-time pesanan anda</p>
              </div>
            </div>

            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1">
                  Nomor Resi / Invoice Transaksi
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: INV-20260728-001"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-300 p-3 text-sm focus:outline-none focus:border-[#C41230] font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-[#C41230] hover:bg-[#a00e26] text-white px-5 py-3 font-black text-xs uppercase tracking-widest shrink-0"
                  >
                    LACAK
                  </button>
                </div>
                {trackingError && (
                  <p className="text-xs text-[#C41230] font-bold mt-1.5">{trackingError}</p>
                )}
              </div>
            </form>

            {/* Tracking Result View */}
            {trackingResult && (
              <div className="mt-6 pt-6 border-t border-neutral-200 space-y-4">
                <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-neutral-500">INVOICE:</span>
                    <span className="font-mono text-neutral-900">{trackingResult.invoice}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-neutral-500">STATUS:</span>
                    <span className="text-[#C41230] font-black">{trackingResult.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">EKSPEDISI:</span>
                    <span className="font-semibold text-neutral-800">{trackingResult.courier}</span>
                  </div>
                </div>

                <div className="space-y-3 pl-2 border-l-2 border-[#C41230]">
                  {trackingResult.steps.map((step: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${step.done ? 'bg-[#C41230]' : 'bg-neutral-300'}`}></span>
                        <span className="font-bold text-neutral-800">{step.title}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 pl-4">{step.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Wishlist Drawer / Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between animate-slideLeft">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#C41230]" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900">
                    WISHLIST SAYA ({wishlist.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Heart className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-xs font-bold text-neutral-500">Wishlist anda masih kosong.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {wishlist.map((id) => {
                    const prod = products.find((p) => p.id === id);
                    if (!prod) return null;
                    return (
                      <div key={id} className="flex gap-3 border border-neutral-200 p-3 items-center">
                        <img src={prod.image} alt={prod.name} className="w-16 h-16 object-cover bg-neutral-100" />
                        <div className="flex-1">
                          <h4 className="font-black text-xs uppercase text-neutral-900 line-clamp-1">{prod.name}</h4>
                          <p className="text-[#C41230] font-black text-xs font-display">Rp {prod.member_price.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => addToCart(prod)}
                          className="p-2 bg-neutral-900 text-white text-xs hover:bg-[#C41230]"
                          title="Tambah ke Keranjang"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="w-full bg-neutral-900 text-white py-3 font-black text-xs uppercase tracking-widest"
            >
              TUTUP WISHLIST
            </button>
          </div>
        </div>
      )}

      {/* 10. Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between animate-slideLeft">
            
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#C41230]" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900">
                    KERANJANG BELANJA ({cartCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
                  <p className="text-xs font-bold text-neutral-500">Keranjang belanja anda masih kosong.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-[#C41230] text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest inline-block"
                  >
                    MULAI BELANJA
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 border border-neutral-200 p-3 items-center">
                      <img src={item.product.image} alt={item.product.name} className="w-16 h-20 object-cover bg-neutral-100 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-black text-xs uppercase text-neutral-900 line-clamp-1">{item.product.name}</h4>
                        <p className="text-[#C41230] font-black text-xs font-display">Rp {item.product.member_price.toLocaleString()}</p>
                        
                        {/* Qty controls */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 border border-neutral-300 text-xs font-bold flex items-center justify-center hover:bg-neutral-100"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 border border-neutral-300 text-xs font-bold flex items-center justify-center hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-neutral-400 hover:text-[#C41230] p-1"
                        title="Hapus"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer Total & Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-500 font-bold">
                    <span>Subtotal Regular:</span>
                    <span className="line-through">Rp {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#C41230] font-black text-sm">
                    <span>Total Member:</span>
                    <span className="font-display">Rp {cartTotalMember.toLocaleString()}</span>
                  </div>
                </div>

                {!isLoggedIn && (
                  <div className="bg-red-50 border border-red-200 p-2.5 text-[11px] text-[#C41230] font-bold flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Hanya member terdaftar yang berhak menyelesaikan pesanan dengan harga diskon member.</span>
                  </div>
                )}

                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onDashboardClick();
                    }}
                    className="w-full bg-[#C41230] hover:bg-[#a00e26] text-white py-3.5 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    PROSES CHECKOUT DI MEMBER DASHBOARD <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsMemberOnlyModalOpen(true);
                    }}
                    className="w-full bg-[#C41230] hover:bg-[#a00e26] text-white py-3.5 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    MASUK AKUN UNTUK CHECKOUT <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* 11. Footer - Clean E-Commerce Footer */}
      <footer className="bg-[#0A0A0B] text-neutral-400 py-16 border-t-4 border-[#C41230]" id="store-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs border-b border-neutral-800 pb-12">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-3">
              <div className="bg-[#C41230] text-white font-black font-display text-lg tracking-tighter px-3 py-1 inline-block uppercase">
                LEVI'S® <span className="font-light text-red-200">DENIM</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Platform belanja online resmi celana jeans Levi's® Zalora dengan koleksi otentik 100% cotton raw denim.
              </p>
            </div>

            {/* Column 2: Categories */}
            <div className="space-y-2">
              <h4 className="font-black text-white uppercase tracking-wider">KOLEKSI KATALOG</h4>
              <ul className="space-y-1.5">
                <li><a href="#katalog-produk" onClick={() => setActiveCategory("pria")} className="hover:text-white transition">Celana Jeans Pria (501®)</a></li>
                <li><a href="#katalog-produk" onClick={() => setActiveCategory("wanita")} className="hover:text-white transition">Celana Jeans Wanita</a></li>
                <li><a href="#katalog-produk" onClick={() => setActiveCategory("pria")} className="hover:text-white transition">Jaket Trucker Denim</a></li>
                <li><a href="#katalog-produk" onClick={() => setActiveCategory("aksesoris")} className="hover:text-white transition">Ikat Pinggang & Aksesoris</a></li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div className="space-y-2">
              <h4 className="font-black text-white uppercase tracking-wider">LAYANAN PELANGGAN</h4>
              <ul className="space-y-1.5">
                <li><button onClick={() => setIsTrackModalOpen(true)} className="hover:text-white transition">Lacak Status Pengiriman</button></li>
                <li><a href="#" className="hover:text-white transition">Panduan Ukuran (Size Guide)</a></li>
                <li><a href="#" className="hover:text-white transition">Syarat & Ketentuan Garansi</a></li>
                <li><a href="#" className="hover:text-white transition">Kebijakan Privasi</a></li>
              </ul>
            </div>

            {/* Column 4: Contact & Member Portal */}
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider">HUBUNGI KAMI</h4>
              <p className="text-neutral-400">WhatsApp: <strong className="text-white">{phone}</strong></p>
              <p className="text-neutral-400">Email: <strong className="text-white">{email}</strong></p>
              
              <button
                onClick={onLoginClick}
                className="mt-2 bg-neutral-800 hover:bg-[#C41230] text-white px-4 py-2 text-xs font-black uppercase tracking-widest transition block w-full text-center"
              >
                MEMBER PORTAL
              </button>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono gap-4">
            <p>© 2026 {webName}. Hak Cipta Dilindungi Undang-Undang.</p>
            <div className="flex items-center gap-4">
              <span>BCA</span>
              <span>MANDIRI</span>
              <span>QRIS</span>
              <span>COD</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
