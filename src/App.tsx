import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PHPSourceViewer from "./components/PHPSourceViewer";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest } from "./types";
import { LogIn, Key, ShieldCheck, Download, Award, X, Copy, Check, Info, RefreshCw, CheckCircle, Mail, Lock, Send } from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'php-source'>('landing');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<MLMUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123'); // Demo bypass
  const [loginError, setLoginError] = useState('');

  // Forgot Password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'none' | 'request' | 'verify'>('none');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [simulatedMailContent, setSimulatedMailContent] = useState<any | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setSimulatedMailContent(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccess(data.message);
        setSimulatedMailContent(data.simulatedEmail);
        setForgotOtp('');
        setForgotStep('verify');
      } else {
        setForgotError(data.message || "Gagal mengirimkan permintaan reset.");
      }
    } catch (err) {
      setForgotError("Koneksi gagal saat menghubungi server.");
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccess(data.message);
        setForgotStep('none');
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setSimulatedMailContent(null);
      } else {
        setForgotError(data.message || "Gagal menyetel ulang kata sandi.");
      }
    } catch (err) {
      setForgotError("Koneksi gagal saat menghubungi server.");
    }
  };

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regFullname, setRegFullname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSponsor, setRegSponsor] = useState('');
  const [regUpline, setRegUpline] = useState('');
  const [regPosition, setRegPosition] = useState<'L' | 'R'>('L');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Dynamic branding & configuration settings
  const [systemSettings, setSystemSettings] = useState<any>({
    webName: "Zalora Denim Premium MLM",
    logoText: "ZALORA.DENIM",
    contactPhone: "081234567890",
    contactEmail: "support@zaloradenim.com",
    sponsorBonus: 20000,
    pairingBonus: 10000,
    roBonus: 5000,
    levelBonusG1: 5000,
    levelBonusG2: 4000,
    levelBonusG3: 3000,
    levelBonusG4: 1000,
    levelBonusG5: 1000,
    levelBonusG6: 1000,
    levelBonusG7: 1000,
    levelBonusG8: 1000,
    levelBonusG9: 1000,
    levelBonusG10: 1000,
    rewardThresholdLeft: 5,
    rewardThresholdRight: 5,
    rewardName: "Honda Vario Matic Baru",
    rewardCashEquivalent: 20000000
  });

  // Active user data
  const [userDashboardData, setUserDashboardData] = useState<{
    user: MLMUser;
    transactions: Transaction[];
    deposits: DepositRequest[];
    withdrawals: WDRequest[];
    notifications: any[];
    binaryTree: any;
    referrals: MLMUser[];
  } | null>(null);

  // Active admin data
  const [adminDashboardData, setAdminDashboardData] = useState<{
    metrics: {
      totalMembers: number;
      activeMembers: number;
      inactiveMembers: number;
      totalTurnover: number;
      totalBonusesPaid: number;
      pendingWDCount: number;
      pendingWDAmount: number;
      isAutoPayout: boolean;
    };
    users: MLMUser[];
    withdrawals: WDRequest[];
    deposits: DepositRequest[];
    transactions: Transaction[];
  } | null>(null);

  // Read URL params on mount for referral (?ref=username)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setRegSponsor(ref);
      setRegUpline(ref); // Default upline to sponsor as well
      setShowRegisterModal(true);
    }
    fetchProducts();
    fetchSettings();
  }, []);

  // Sync data automatically every 10 seconds if logged in
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Gagal memuat produk", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
      }
    } catch (err) {
      console.error("Gagal memuat setting", err);
    }
  };

  const getFallbackUser = (username: string): MLMUser => {
    const u = username.toLowerCase().trim();
    if (u === 'admin') {
      return {
        id: 1,
        username: "admin",
        fullname: "Administrator Zalora Denim",
        email: "admin@zaloradenim.com",
        phone: "081234567890",
        is_active: true,
        upline_id: null,
        position: null,
        sponsor_id: null,
        balance: 5000000,
        sponsor_bonus: 0,
        pairing_bonus: 0,
        level_bonus: 0,
        ro_bonus: 0,
        left_count: 5,
        right_count: 4,
        left_sales: 5,
        right_sales: 4,
        created_at: new Date().toISOString(),
        role: "admin"
      };
    }
    return {
      id: 2,
      username: u || "budi",
      fullname: u === "budi" ? "Budi Santoso" : (u.charAt(0).toUpperCase() + u.slice(1)),
      email: `${u || "budi"}@gmail.com`,
      phone: "081234567891",
      is_active: true,
      upline_id: 1,
      position: "L",
      sponsor_id: 1,
      balance: 750000,
      sponsor_bonus: 40000,
      pairing_bonus: 20000,
      level_bonus: 15000,
      ro_bonus: 5000,
      left_count: 2,
      right_count: 2,
      left_sales: 2,
      right_sales: 2,
      created_at: new Date().toISOString(),
      role: "user"
    };
  };

  const getDefaultAdminDashboard = (user: MLMUser) => ({
    metrics: {
      totalMembers: 12,
      activeMembers: 8,
      inactiveMembers: 4,
      totalTurnover: 15000000,
      totalBonusesPaid: 3500000,
      pendingWDCount: 1,
      pendingWDAmount: 250000,
      isAutoPayout: false
    },
    users: [
      user,
      {
        id: 2,
        username: "budi",
        fullname: "Budi Santoso",
        email: "budi@gmail.com",
        phone: "081234567891",
        is_active: true,
        upline_id: 1,
        position: "L",
        sponsor_id: 1,
        balance: 750000,
        sponsor_bonus: 40000,
        pairing_bonus: 20000,
        level_bonus: 15000,
        ro_bonus: 5000,
        left_count: 2,
        right_count: 2,
        left_sales: 2,
        right_sales: 2,
        created_at: "2026-06-15T10:00:00Z",
        role: "user"
      }
    ],
    withdrawals: [],
    deposits: [],
    transactions: []
  });

  const getDefaultUserDashboard = (user: MLMUser) => ({
    user,
    transactions: [
      {
        id: 1,
        user_id: user.id,
        username: user.username,
        type: "Sponsor Bonus",
        amount: 40000,
        description: "Bonus Sponsor Pendaftaran Member @agus",
        created_at: new Date().toISOString()
      }
    ],
    deposits: [],
    withdrawals: [],
    notifications: [
      { id: 1, title: "Selamat Datang!", message: "Selamat datang di Portal Member Zalora Denim MLM.", read: false, time: "Baru saja" }
    ],
    binaryTree: {
      user: user,
      left: { user: { username: "koko", fullname: "Koko Prasetyo", is_active: true }, left: null, right: null },
      right: { user: { username: "siti", fullname: "Siti Rahma", is_active: true }, left: null, right: null }
    },
    referrals: []
  });

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'admin') {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          setAdminDashboardData(data);
          if (data.settings) setSystemSettings(data.settings);
          return;
        }
      } else {
        const res = await fetch(`/api/user/${currentUser.id}/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setUserDashboardData(data);
          if (data.settings) setSystemSettings(data.settings);
          if (data.user) setCurrentUser(data.user);
          return;
        }
      }
    } catch (err) {
      console.warn("Gagal sinkronisasi data dashboard dari API, menggunakan data fallback", err);
    }

    if (currentUser.role === 'admin') {
      if (!adminDashboardData) setAdminDashboardData(getDefaultAdminDashboard(currentUser));
    } else {
      if (!userDashboardData) setUserDashboardData(getDefaultUserDashboard(currentUser));
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (res.ok) {
        setSystemSettings(data.settings);
        fetchDashboardData();
        return true;
      } else {
        alert(data.message || "Gagal mengupdate settings");
        return false;
      }
    } catch (err) {
      console.error("Error updating settings", err);
      alert("Koneksi gagal saat menyimpan settings");
      return false;
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUsername) {
      setLoginError("Harap isi username");
      return;
    }
    setLoginError('');
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setShowLoginModal(false);
        setLoginUsername('');
        // Immediately fetch relative data
        if (data.user.role === 'admin') {
          try {
            const r = await fetch("/api/admin/dashboard");
            if (r.ok) {
              const d = await r.json();
              setAdminDashboardData(d);
              if (d.settings) setSystemSettings(d.settings);
            }
          } catch {}
        } else {
          try {
            const r = await fetch(`/api/user/${data.user.id}/dashboard`);
            if (r.ok) {
              const d = await r.json();
              setUserDashboardData(d);
              if (d.settings) setSystemSettings(d.settings);
            }
          } catch {}
        }
        setActiveView('dashboard');
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.message) {
          setLoginError(data.message);
          return;
        }
      }
    } catch (err) {
      console.warn("API Login unreachable, using client fallback", err);
    }

    // Fallback if API backend is unreachable (e.g. static hosting without Node.js backend)
    const fallbackUser = getFallbackUser(loginUsername);
    setCurrentUser(fallbackUser);
    setShowLoginModal(false);
    setLoginUsername('');
    setActiveView('dashboard');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          fullname: regFullname,
          email: regEmail,
          phone: regPhone,
          sponsor_username: regSponsor,
          upline_username: regUpline,
          position: regPosition
        })
      });
      const data = await res.json().catch(() => ({ message: "Pendaftaran berhasil di mode demo." }));
      if (res.ok) {
        setRegSuccessMessage(data.message);
        setRegUsername('');
        setRegFullname('');
        setRegEmail('');
        setRegPhone('');
        setRegSponsor('');
        setRegUpline('');
      } else {
        alert(data.message || "Pendaftaran gagal");
      }
    } catch (err) {
      setRegSuccessMessage(`Pendaftaran demo berhasil untuk @${regUsername}! Silakan masuk ke akun Anda.`);
      setRegUsername('');
      setRegFullname('');
      setRegEmail('');
      setRegPhone('');
    }
  };

  const handleQuickLogin = async (role: 'user' | 'admin') => {
    const username = role === 'user' ? 'budi' : 'admin';
    setLoginUsername(username);
    setLoginError('');
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setShowLoginModal(false);
          setLoginUsername('');
          if (data.user.role === 'admin') {
            try {
              const r = await fetch("/api/admin/dashboard");
              if (r.ok) {
                const d = await r.json();
                setAdminDashboardData(d);
              }
            } catch {}
          } else {
            try {
              const r = await fetch(`/api/user/${data.user.id}/dashboard`);
              if (r.ok) {
                const d = await r.json();
                setUserDashboardData(d);
              }
            } catch {}
          }
          setActiveView('dashboard');
          return;
        }
      }
    } catch (err) {
      console.warn("Quick login API unreachable, using client fallback", err);
    }

    // Fallback for demo mode on static hosting
    const fallbackUser = getFallbackUser(username);
    setCurrentUser(fallbackUser);
    setShowLoginModal(false);
    setLoginUsername('');
    setActiveView('dashboard');
  };

  const handleBuyProduct = async (productId: number) => {
    if (!currentUser) return;
    const res = await fetch("/api/user/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, productId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    // Refresh products and dashboards
    fetchProducts();
    fetchDashboardData();
  };

  const handleDeposit = async (amount: number, method: 'qris' | 'bca' | 'mandiri') => {
    if (!currentUser) return;
    const res = await fetch("/api/user/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, amount, method })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    fetchDashboardData();
  };

  const handleWithdraw = async (amount: number, bank: string, accountNum: string, holder: string) => {
    if (!currentUser) return;
    const res = await fetch("/api/user/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        userId: currentUser.id, 
        amount, 
        bankName: bank, 
        accountNumber: accountNum, 
        accountHolder: holder 
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    fetchDashboardData();
  };

  const handleSimulatePayment = async (depositId: number) => {
    const res = await fetch("/api/payment/simulate-gateway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Simulasi gagal");
      return;
    }
    fetchDashboardData();
  };

  const handleAccountActivation = async () => {
    if (!currentUser) return;
    const res = await fetch("/api/user/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    fetchDashboardData();
  };

  // ADMIN OPERATIONS
  const handleUpdateProductStock = async (productId: number, stock: number, price: number, memberPrice: number) => {
    const res = await fetch("/api/admin/products/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, stock, price, memberPrice })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    fetchProducts();
    fetchDashboardData();
  };

  const handleProcessWithdrawal = async (wdId: number, action: 'approve' | 'reject') => {
    const res = await fetch("/api/admin/withdraw/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wdId, action })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    fetchDashboardData();
  };

  const handleToggleAutoPayout = async (autoPayout: boolean) => {
    const res = await fetch("/api/admin/settings/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoPayout })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    fetchDashboardData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserDashboardData(null);
    setAdminDashboardData(null);
    setActiveView('landing');
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans" id="app-viewport">
      
      {/* GLOBAL SYSTEM BAR FOR DEMO SWAPPING */}
      <div className="bg-slate-950 text-slate-300 py-2.5 px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-3 border-b border-slate-900 text-xs font-semibold z-50 shadow-sm" id="global-demo-bar">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Simulasi Sistem MLM Binary Aktif (Server Running)</span>
        </div>
        
        {/* Navigation Swapping tabs */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            id="global-tab-landing"
            onClick={() => setActiveView('landing')}
            className={`px-3 py-1 rounded transition hover:text-white ${activeView === 'landing' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-slate-400'}`}
          >
            Toko Zalora (Landing)
          </button>
          
          <button
            id="global-tab-code"
            onClick={() => setActiveView('php-source')}
            className={`px-3 py-1 rounded transition hover:text-white ${activeView === 'php-source' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-slate-400'}`}
          >
            Source Code PHP (Hosting)
          </button>

          {currentUser && (
            <button
              id="global-tab-portal"
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1 rounded transition hover:text-white ${activeView === 'dashboard' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-slate-400'}`}
            >
              Portal {currentUser.role === 'admin' ? 'Admin' : 'Member'}
            </button>
          )}

          {!currentUser && (
            <button
              id="global-btn-quick-login"
              onClick={() => setShowLoginModal(true)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 px-3 py-1 rounded text-[11px] font-bold shadow-sm"
            >
              Masuk Portal Dashboard
            </button>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col" id="active-viewport-body">
        {activeView === 'landing' && (
          <LandingPage
            products={products}
            isLoggedIn={!!currentUser}
            onLoginClick={() => setShowLoginModal(true)}
            onRegisterClick={(spon) => {
              if (spon) {
                setRegSponsor(spon);
                setRegUpline(spon);
              }
              setShowRegisterModal(true);
            }}
            onDashboardClick={() => setActiveView('dashboard')}
            settings={systemSettings}
          />
        )}

        {activeView === 'php-source' && (
          <PHPSourceViewer />
        )}

        {activeView === 'dashboard' && currentUser && (
          currentUser.role === 'admin' ? (
            adminDashboardData ? (
              <AdminDashboard
                user={currentUser}
                metrics={adminDashboardData.metrics}
                users={adminDashboardData.users}
                withdrawals={adminDashboardData.withdrawals}
                deposits={adminDashboardData.deposits}
                transactions={adminDashboardData.transactions}
                products={products}
                onRefresh={fetchDashboardData}
                onLogout={handleLogout}
                onUpdateProductStock={handleUpdateProductStock}
                onProcessWithdrawal={handleProcessWithdrawal}
                onToggleAutoPayout={handleToggleAutoPayout}
                settings={systemSettings}
                onUpdateSettings={handleUpdateSettings}
                onRefreshProducts={fetchProducts}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-12"><RefreshCw className="w-8 h-8 text-blue-600 animate-spin" /></div>
            )
          ) : (
            userDashboardData ? (
              <UserDashboard
                user={userDashboardData.user}
                transactions={userDashboardData.transactions}
                deposits={userDashboardData.deposits}
                withdrawals={userDashboardData.withdrawals}
                notifications={userDashboardData.notifications}
                binaryTree={userDashboardData.binaryTree}
                referrals={userDashboardData.referrals}
                products={products}
                onLogout={handleLogout}
                onRefresh={fetchDashboardData}
                onBuyProduct={handleBuyProduct}
                onDeposit={handleDeposit}
                onWithdraw={handleWithdraw}
                onSimulatePayment={handleSimulatePayment}
                onActivate={handleAccountActivation}
                serverUrl={window.location.origin}
                settings={systemSettings}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-12"><RefreshCw className="w-8 h-8 text-blue-600 animate-spin" /></div>
            )
          )
        )}
      </div>

      {/* ==========================================
          LOGIN MODAL POPUP (With Demo Helpers)
          ========================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="login-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-5">
            <button
              id="btn-close-login"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Portal Otentikasi
              </span>
              <h3 className="text-xl font-black text-slate-900">Masuk Akun Member / Admin</h3>
              <p className="text-xs text-slate-500">Silakan isi username terdaftar Anda untuk menjelajahi dashboard.</p>
            </div>

            {/* Quick Demo Accounts Fill */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Uji Coba Demo Akun Sekali-Klik:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-quick-budi"
                  onClick={() => handleQuickLogin('user')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold transition text-left flex flex-col justify-between shadow-sm hover:border-blue-500"
                >
                  <span className="text-blue-600">👤 Demo Member</span>
                  <strong className="block mt-1 font-extrabold text-slate-900">@budi</strong>
                </button>
                <button
                  type="button"
                  id="btn-quick-admin"
                  onClick={() => handleQuickLogin('admin')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold transition text-left flex flex-col justify-between shadow-sm hover:border-blue-500"
                >
                  <span className="text-red-600">⚙️ Administrator</span>
                  <strong className="block mt-1 font-extrabold text-slate-900">@admin</strong>
                </button>
              </div>
            </div>

            {loginError && <p className="bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-200 text-xs font-bold">{loginError}</p>}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username Anda..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kata Sandi (Demo Bypass)</label>
                <div className="relative">
                  <input
                    type="password"
                    disabled
                    value={loginPassword}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-slate-50 font-mono text-slate-400 focus:outline-none"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
                <div className="text-right pt-1">
                  <button
                    type="button"
                    id="btn-forgot-password-trigger"
                    onClick={() => {
                      setShowLoginModal(false);
                      setForgotError('');
                      setForgotSuccess('');
                      setForgotStep('request');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-modal-login-submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-blue-500" /> Masuk Ke Portal
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              Belum punya akun?{" "}
              <button
                id="btn-switch-register"
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
                className="text-blue-600 font-extrabold hover:underline"
              >
                Daftar Member Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FORGOT / RESET PASSWORD MODAL POPUP
          ========================================== */}
      {forgotStep !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="forgot-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <button
              id="btn-close-forgot"
              onClick={() => {
                setForgotStep('none');
                setForgotError('');
                setForgotSuccess('');
                setSimulatedMailContent(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Lupa / Setel Ulang Kata Sandi</h3>
                <p className="text-xs text-slate-500">
                  {forgotStep === 'request' ? 'Langkah 1: Masukkan email terdaftar Anda' : 'Langkah 2: Masukkan Kode OTP & Password Baru'}
                </p>
              </div>
            </div>

            {forgotError && (
              <p className="bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-200 text-xs font-bold">
                {forgotError}
              </p>
            )}

            {forgotSuccess && (
              <p className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold">
                {forgotSuccess}
              </p>
            )}

            {/* Simulated Email Notification Preview Card */}
            {simulatedMailContent && (
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-3 text-xs space-y-2 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Simulation Email Client (Demo)</span>
                  <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Dikirim Otomatis</span>
                </div>
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                  <p><span className="text-slate-400">Kepada:</span> {simulatedMailContent.to}</p>
                  <p><span className="text-slate-400">Subjek:</span> {simulatedMailContent.subject}</p>
                  <div className="mt-2 pt-2 border-t border-slate-700/60 text-slate-300">
                    Kode OTP Verifikasi Anda: <strong className="text-amber-400 text-sm tracking-wider px-2 py-0.5 bg-amber-400/10 rounded">{simulatedMailContent.code}</strong>
                  </div>
                </div>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Email Terdaftar</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="contoh: budi@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Petunjuk: Anda dapat menggunakan email demo seperti <code className="text-blue-600 font-bold">budi@gmail.com</code> atau <code className="text-blue-600 font-bold">admin@zalora.com</code>.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('none');
                      setShowLoginModal(true);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    id="btn-send-reset-otp"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-xs shadow flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Kirim Kode OTP Reset
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kode OTP (6 Digit)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Masukkan 6 digit OTP..."
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Masukkan kata sandi baru..."
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    ← Kembalikan Email
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-reset-password"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-xs shadow flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Simpan Kata Sandi Baru
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          REGISTRATION MODAL POPUP
          ========================================== */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="register-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <button
              id="btn-close-register"
              onClick={() => {
                setShowRegisterModal(false);
                setRegSuccessMessage('');
              }}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Registrasi Member Baru
              </span>
              <h3 className="text-xl font-black text-slate-900">Daftar Hak Usaha MLM Binary</h3>
              <p className="text-xs text-slate-500">Mulai langkah bisnis Anda dan dapatkan keuntungan tak terbatas.</p>
            </div>

            {regSuccessMessage ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h4 className="font-extrabold text-green-950">Pendaftaran Anda Berhasil!</h4>
                <p className="text-xs text-green-800 leading-relaxed">
                  Akun Anda telah terdaftar sebagai member dalam pohon jaringan silsilah binary. Status Anda saat ini adalah <strong className="text-red-600 font-black">TIDAK AKTIF</strong>. <br />
                  Silakan masuk menggunakan akun baru Anda, lalu lakukan pengisian deposit saldo Rp 100.000 untuk melakukan aktifasi premium agar seluruh bonus mengalir lancar!
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    id="btn-reg-success-login"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setRegSuccessMessage('');
                      setShowLoginModal(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow"
                  >
                    Masuk Sekarang
                  </button>
                  <button
                    id="btn-reg-success-close"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setRegSuccessMessage('');
                    }}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Username Baru</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: agus2026"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap..."
                      value={regFullname}
                      onChange={(e) => setRegFullname(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="Contoh: agus@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nomor Telepon</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Silsilah Penempatan Jaringan (Placement)</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Username Sponsor (Pengajak)</label>
                      <input
                        type="text"
                        placeholder="Admin (Bila dikosongkan)"
                        value={regSponsor}
                        onChange={(e) => setRegSponsor(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-blue-600 bg-blue-50/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Username Upline (Atasan Langsung)</label>
                      <input
                        type="text"
                        placeholder="Admin (Bila dikosongkan)"
                        value={regUpline}
                        onChange={(e) => setRegUpline(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-blue-600 bg-blue-50/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Posisi Kaki Binary</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="reg-pos-left"
                        onClick={() => setRegPosition('L')}
                        className={`py-2 px-3 border rounded-xl text-center text-xs font-extrabold transition ${
                          regPosition === 'L' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        👈 SISI KIRI (L)
                      </button>
                      <button
                        type="button"
                        id="reg-pos-right"
                        onClick={() => setRegPosition('R')}
                        className={`py-2 px-3 border rounded-xl text-center text-xs font-extrabold transition ${
                          regPosition === 'R' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        SISI KANAN (R) 👉
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed">
                  💡 <strong>Keterangan:</strong> Posisi menentukan di kaki mana Anda ditempatkan di bawah atasan (Upline) langsung Anda.
                </div>

                <button
                  type="submit"
                  id="btn-modal-register-submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-1.5 mt-2"
                >
                  <Award className="w-4 h-4 text-white" /> Daftar Sekarang
                </button>
              </form>
            )}

            <div className="text-center text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              Sudah punya akun?{" "}
              <button
                id="btn-switch-login"
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
                className="text-blue-600 font-extrabold hover:underline"
              >
                Masuk Di Sini
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
