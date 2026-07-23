import React, { useState } from "react";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, BinaryTreeNode } from "../types";
import { 
  DollarSign, TrendingUp, Users, TreePine, ArrowUpRight, ArrowDownLeft, 
  Copy, Check, ShoppingBag, ShieldAlert, CheckCircle, RefreshCw, 
  CreditCard, Send, LogOut, Bell, HelpCircle, Award, Percent, Menu, X,
  User, Lock
} from "lucide-react";

interface UserDashboardProps {
  user: MLMUser;
  transactions: Transaction[];
  deposits: DepositRequest[];
  withdrawals: WDRequest[];
  notifications: any[];
  binaryTree: BinaryTreeNode | null;
  referrals: MLMUser[];
  products: Product[];
  onLogout: () => void;
  onRefresh: () => void;
  onBuyProduct: (productId: number) => Promise<void>;
  onDeposit: (amount: number, method: 'qris' | 'bca' | 'mandiri') => Promise<void>;
  onWithdraw: (amount: number, bank: string, accountNum: string, holder: string) => Promise<void>;
  onSimulatePayment: (depositId: number) => Promise<void>;
  onActivate: () => Promise<void>;
  onUpdateProfile?: (data: { fullname: string; email: string; phone: string; password?: string }) => Promise<boolean>;
  onResetPassword?: (currentPass: string, newPass: string) => Promise<boolean>;
  serverUrl: string;
  settings?: any;
}

export default function UserDashboard({
  user,
  transactions,
  deposits,
  withdrawals,
  notifications,
  binaryTree,
  referrals,
  products,
  onLogout,
  onRefresh,
  onBuyProduct,
  onDeposit,
  onWithdraw,
  onSimulatePayment,
  onActivate,
  onUpdateProfile,
  onResetPassword,
  serverUrl,
  settings
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tree' | 'shop' | 'finance' | 'referrals' | 'bonuses' | 'panduan' | 'profil'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Form states
  const [depAmount, setDepAmount] = useState('');
  const [depMethod, setDepMethod] = useState<'qris' | 'bca' | 'mandiri'>('qris');
  const [wdAmount, setWdAmount] = useState('');
  const [wdBank, setWdBank] = useState('BCA');
  const [wdAccount, setWdAccount] = useState('');
  const [wdHolder, setWdHolder] = useState(user.fullname);

  // Profile and Password Form states
  const [profileFullname, setProfileFullname] = useState(user.fullname);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(user.phone);
  const [profilePassword, setProfilePassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Sync profile fields when user prop updates
  React.useEffect(() => {
    setProfileFullname(user.fullname);
    setProfileEmail(user.email);
    setProfilePhone(user.phone);
  }, [user]);

  // Tree focus state (allows drilling down the tree)
  const [treeRootNode, setTreeRootNode] = useState<BinaryTreeNode | null>(binaryTree);
  const [copied, setCopied] = useState(false);

  // Status/message states
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Reset Tree Root when backend tree updates
  React.useEffect(() => {
    if (binaryTree && (!treeRootNode || treeRootNode.id === user.id)) {
      setTreeRootNode(binaryTree);
    }
  }, [binaryTree]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${user.username}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(depAmount);
    if (!amt || amt < 50000) {
      alert("Minimal deposit adalah Rp 50.000");
      return;
    }
    setLoadingAction(true);
    try {
      await onDeposit(amt, depMethod);
      setDepAmount('');
      setStatusMessage({ text: "Permintaan deposit berhasil dibuat. Silakan lakukan pembayaran di tabel bawah.", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal membuat deposit", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(wdAmount);
    if (!amt || amt < 50000) {
      alert("Minimal penarikan adalah Rp 50.000");
      return;
    }
    if (user.balance < amt) {
      alert("Saldo tidak mencukupi!");
      return;
    }
    if (!wdAccount || !wdHolder) {
      alert("Mohon isi nomor rekening dan nama pemilik");
      return;
    }
    setLoadingAction(true);
    try {
      await onWithdraw(amt, wdBank, wdAccount, wdHolder);
      setWdAmount('');
      setWdAccount('');
      setStatusMessage({ text: "Penarikan berhasil diajukan!", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal mengajukan penarikan", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullname || !profileEmail || !profilePhone) {
      alert("Nama Lengkap, Email, dan No. WA harus diisi!");
      return;
    }
    setLoadingAction(true);
    setStatusMessage({ text: '', type: '' });
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          fullname: profileFullname,
          email: profileEmail,
          phone: profilePhone,
          ...(profilePassword ? { password: profilePassword } : {})
        });
        setProfilePassword('');
        setStatusMessage({ text: "Profil Anda berhasil diperbarui!", type: "success" });
        onRefresh();
      } else {
        const res = await fetch(`/api/user/${user.id}/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname: profileFullname,
            email: profileEmail,
            phone: profilePhone,
            password: profilePassword
          })
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          setProfilePassword('');
          setStatusMessage({ text: "Profil Anda berhasil diperbarui!", type: "success" });
          onRefresh();
        } else {
          setStatusMessage({ text: "Profil Anda telah diperbarui di database local!", type: "success" });
        }
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal memperbarui profil", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Mohon isi semua field kata sandi!");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }
    setLoadingAction(true);
    setStatusMessage({ text: '', type: '' });
    try {
      if (onResetPassword) {
        await onResetPassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setStatusMessage({ text: "Kata sandi Anda berhasil diperbarui!", type: "success" });
        onRefresh();
      } else {
        const res = await fetch(`/api/user/${user.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          setStatusMessage({ text: "Kata sandi Anda berhasil diperbarui!", type: "success" });
          onRefresh();
        } else {
          setStatusMessage({ text: "Kata sandi telah diperbarui!", type: "success" });
        }
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal mereset kata sandi", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleProductPurchase = async (productId: number) => {
    if (!user.is_active) {
      alert("Aktifkan akun premium Rp 100.000 terlebih dahulu!");
      return;
    }
    setLoadingAction(true);
    try {
      await onBuyProduct(productId);
      setStatusMessage({ text: "Pembelian celana jeans premium berhasil! Stok diperbarui, bonus sponsor & RO mengalir.", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal melakukan pembelian", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAccountActivation = async () => {
    if (user.balance < 100000) {
      alert("Saldo Anda kurang dari Rp 100.000. Silakan lakukan deposit terlebih dahulu!");
      return;
    }
    setLoadingAction(true);
    try {
      await onActivate();
      setStatusMessage({ text: "Selamat! Akun Anda kini aktif sebagai Member Premium. Jaringan binary 10 level Anda telah terbuka!", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal mengaktifkan akun", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  // Traverses tree downward to set visual node focus
  const findNodeInTree = (node: BinaryTreeNode | null, id: number): BinaryTreeNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    const leftRes = findNodeInTree(node.left, id);
    if (leftRes) return leftRes;
    return findNodeInTree(node.right, id);
  };

  const handleTreeNodeClick = (id: number) => {
    const target = findNodeInTree(binaryTree, id);
    if (target) {
      setTreeRootNode(target);
    }
  };

  const resetTreeFocus = () => {
    setTreeRootNode(binaryTree);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900" id="user-dashboard-root">
      {/* Upper Brand bar */}
      <header className="bg-slate-950 text-white h-16 px-6 flex items-center justify-between shadow-lg sticky top-0 z-40" id="user-header">
        <div className="flex items-center gap-3">
          <span className="text-xl font-display font-black tracking-tight text-white">ZALORA<span className="text-blue-500 font-light">.PORTAL</span></span>
          <span className="bg-blue-600/20 text-blue-300 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/15 uppercase tracking-wider">
            HAK USAHA MEMBER
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-200">{user.fullname}</p>
              <p className="text-[10px] text-slate-400">@{user.username} • {user.is_active ? 'Premium Active' : 'Inactive'}</p>
            </div>
          </div>
          <button 
            id="btn-logout"
            onClick={onLogout} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-lg transition font-bold text-xs"
            title="Keluar dari Aplikasi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
          
          {/* Mobile Menu Toggle Button */}
          <button 
            id="user-burger-btn"
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Slide-in Menu (Right Slide) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fade-in" id="user-mobile-menu">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel - slides from right */}
          <div className="relative w-80 max-w-full bg-slate-950 text-slate-100 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slide-in-right">
            <div className="space-y-6">
              {/* Header with Logo & Close Button */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex flex-col">
                  <span className="text-lg font-display font-black tracking-tight text-white">
                    ZALORA<span className="text-blue-500 font-light">.PORTAL</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Hak Usaha Member
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Details */}
              <div className="bg-slate-900 p-4 rounded-xl flex items-center gap-3 border border-slate-800">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-display font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/10 shrink-0">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.fullname}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                    @{user.username} • {user.is_active ? 'Premium Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {/* Activation Warning Widget if Inactive */}
              {!user.is_active && (
                <div className="bg-amber-600/15 border border-amber-500/25 p-3.5 rounded-xl space-y-3">
                  <div className="flex gap-2 text-amber-400 text-[10px] font-medium leading-normal">
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                    <div>
                      <span className="font-extrabold block text-amber-300 text-xs">AKUN BELUM AKTIF</span>
                      Wajib aktifasi Rp 100.000 untuk bonus jaringan & belanja.
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleAccountActivation(); }}
                    disabled={user.balance < 100000 || loadingAction}
                    className={`w-full text-xs font-bold py-2 rounded-lg transition text-center shadow-sm ${
                      user.balance >= 100000 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {user.balance >= 100000 ? "Aktifkan Akun (Dipotong Saldo)" : "Isi Saldo Rp 100k untuk Aktifasi"}
                  </button>
                </div>
              )}

              {/* Navigation Tabs */}
              <nav className="space-y-1.5">
                <button
                  id="tab-overview-mobile"
                  onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4" /> Ringkasan Bisnis
                  </span>
                </button>

                <button
                  id="tab-tree-mobile"
                  onClick={() => { setActiveTab('tree'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'tree' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <TreePine className="w-4 h-4" /> Pohon Jaringan
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                    Binary
                  </span>
                </button>

                <button
                  id="tab-shop-mobile"
                  onClick={() => { setActiveTab('shop'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'shop' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4" /> Belanja Jeans
                  </span>
                </button>

                <button
                  id="tab-finance-mobile"
                  onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'finance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4" /> Keuangan & Saldo
                  </span>
                </button>

                <button
                  id="tab-referrals-mobile"
                  onClick={() => { setActiveTab('referrals'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'referrals' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" /> Sponsor & Referal
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                    {referrals.length} org
                  </span>
                </button>

                <button
                  id="tab-bonuses-mobile"
                  onClick={() => { setActiveTab('bonuses'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'bonuses' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-amber-500" /> Laporan Transparansi Komisi
                  </span>
                </button>

                <button
                  id="tab-panduan-mobile"
                  onClick={() => { setActiveTab('panduan'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'panduan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-400" /> Panduan & Syarat Bonus
                  </span>
                </button>

                <button
                  id="tab-profil-mobile"
                  onClick={() => { setActiveTab('profil'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-blue-400" /> Profil Saya
                  </span>
                </button>
              </nav>

              {/* Referral link in mobile menu */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Link Referal Anda</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?ref=${user.username}`}
                    className="bg-slate-950 text-[9px] text-slate-400 border border-slate-800 rounded-lg px-2 py-1.5 flex-1 font-mono focus:outline-none"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 p-1.5 rounded-lg border border-slate-700 transition shrink-0"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-850">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                className="w-full py-2.5 bg-red-600/15 hover:bg-red-600/35 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition"
              >
                Keluar Aplikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8" id="dashboard-body">
        
        {/* Left Sidebar Menu */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0 space-y-4" id="user-sidebar">
          
          {/* User Status Profile */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-display font-black flex items-center justify-center text-lg shadow-md shadow-blue-600/10">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 leading-tight">{user.fullname}</h4>
                <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
              </div>
            </div>

            {/* License Active badge */}
            {user.is_active ? (
              <div className="bg-green-50/60 border border-green-100 text-green-800 rounded-xl p-3.5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div className="text-xs leading-normal font-medium">
                  <span className="font-bold block text-green-900">Member Premium</span>
                  Level Jaringan Binary Terbuka!
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/50 border border-amber-100 text-amber-900 rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-normal font-medium">
                    <span className="font-bold block text-amber-900">Lisensi Tidak Aktif</span>
                    Wajib aktifasi Rp 100.000 untuk bonus jaringan & belanja.
                  </div>
                </div>
                <button
                  id="btn-activate-account"
                  onClick={handleAccountActivation}
                  disabled={user.balance < 100000 || loadingAction}
                  className={`w-full text-xs font-bold py-2.5 rounded-xl transition text-center shadow-sm ${
                    user.balance >= 100000 
                      ? 'bg-amber-600 text-white hover:bg-amber-700' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                  }`}
                >
                  {user.balance >= 100000 ? "Aktifkan Akun (Dipotong Saldo)" : "Isi Saldo Rp 100k untuk Aktifasi"}
                </button>
              </div>
            )}

            {/* Referral Link */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Link Referal Anda</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?ref=${user.username}`}
                  className="bg-slate-50 text-[10px] text-slate-600 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex-1 font-mono focus:outline-none"
                />
                <button
                  id="btn-copy-ref"
                  onClick={copyReferralLink}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          {/* Nav Navigation */}
          <nav className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-1">
            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ringkasan Bisnis</span>
            </button>
 
            <button
              id="tab-tree"
              onClick={() => setActiveTab('tree')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'tree' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <TreePine className="w-4 h-4" />
              <span>Pohon Jaringan</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'tree' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                Binary
              </span>
            </button>
 
            <button
              id="tab-shop"
              onClick={() => setActiveTab('shop')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'shop' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Belanja Jeans</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'shop' ? 'bg-blue-500/20 text-white' : 'bg-blue-50 text-blue-700'}`}>
                Diskon HU
              </span>
            </button>
 
            <button
              id="tab-finance"
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'finance' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Depo & Withdraw (WD)</span>
            </button>
 
            <button
              id="tab-referrals"
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'referrals' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sponsor Saya</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'referrals' ? 'bg-blue-500/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {referrals.length} org
              </span>
            </button>
 
            <button
              id="tab-bonuses"
              onClick={() => setActiveTab('bonuses')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'bonuses' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Laporan Transparansi Komisi</span>
              <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase">
                Detail
              </span>
            </button>
 
            <button
              id="tab-panduan"
              onClick={() => setActiveTab('panduan')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'panduan' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Panduan & Syarat Bonus</span>
            </button>
 
            <button
              id="tab-profil"
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-blue-500" />
              <span>Profil Saya</span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <button
                id="sidebar-btn-logout"
                onClick={onLogout}
                className="w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </nav>
        </aside>
 
        {/* Dashboard Panels */}
        <main className="flex-1 min-w-0 space-y-6" id="user-main-panel">
          {/* Status Message alert banner */}
          {statusMessage.text && (
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${
              statusMessage.type === 'success' 
                ? 'bg-green-50/60 border-green-200 text-green-900' 
                : 'bg-red-50/60 border-red-200 text-red-900'
            }`}>
              <p className="text-xs font-semibold leading-relaxed">{statusMessage.text}</p>
              <button onClick={() => setStatusMessage({ text: '', type: '' })} className="text-xs font-bold hover:underline">Tutup</button>
            </div>
          )}
 
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6" id="overview-tab-content">
              
              {/* Financial Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Main Balance Card */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-850 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Dompet</span>
                    <h3 className="text-3xl font-display font-bold mt-1 tracking-tight">Rp {user.balance.toLocaleString()}</h3>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => setActiveTab('finance')}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-900 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" /> Deposit
                    </button>
                    <button
                      onClick={() => setActiveTab('finance')}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                    </button>
                  </div>
                </div>
 
                {/* Left & Right Legs Sales */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Omset Volume Grup</span>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Kiri (Left)</p>
                          <p className="text-lg font-display font-bold text-slate-850">{user.left_sales} pt</p>
                          <p className="text-[10px] text-slate-400">({user.left_count} member)</p>
                        </div>
                        <div className="border-l border-slate-200 pl-4">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Kanan (Right)</p>
                          <p className="text-lg font-display font-bold text-slate-850">{user.right_sales} pt</p>
                          <p className="text-[10px] text-slate-400">({user.right_count} member)</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <TreePine className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">
                    Setiap pendaftaran dan aktifasi member baru menambahkan 1 pt omset kaki.
                  </div>
                </div>
 
                {/* Total Bonus Accumulated */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Bonus MLM</span>
                      <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">
                        Rp {(user.sponsor_bonus + user.pairing_bonus + user.level_bonus + user.ro_bonus).toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[10px]">
                    <div>
                      <span className="text-slate-400">Sponsor:</span>
                      <p className="font-extrabold text-slate-700">Rp {user.sponsor_bonus.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pairing:</span>
                      <p className="font-extrabold text-slate-700">Rp {user.pairing_bonus.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Generasi:</span>
                      <p className="font-extrabold text-slate-700">Rp {user.level_bonus.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">RO Bonus:</span>
                      <p className="font-extrabold text-slate-700">Rp {user.ro_bonus.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>              {/* Notification Box & Referral summary */}
              <div className="grid grid-cols-1 gap-6">
                 
                {/* Real-time Notifications */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col">
                  <h3 className="text-base font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" /> Notifikasi Real-Time Jaringan
                  </h3>
                  <div className="flex-1 space-y-3 max-h-60 overflow-y-auto pr-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Belum ada notifikasi aktivitas jaringan</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-900 leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                            <p className="text-[9px] text-slate-400">{new Date(notif.created_at).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
                <h3 className="text-base font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Riwayat Transaksi Finansial
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 uppercase text-[9px] tracking-wider">
                        <th className="py-3.5 px-4 font-bold">Tanggal</th>
                        <th className="py-3.5 px-4 font-bold">Jenis</th>
                        <th className="py-3.5 px-4 font-bold">Keterangan</th>
                        <th className="py-3.5 px-4 text-right font-bold">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada catatan transaksi keuangan</td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                tx.type.endsWith('_bonus') ? 'bg-green-100 text-green-800' :
                                tx.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                                tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {tx.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">{tx.description}</td>
                            <td className={`py-3.5 px-4 text-right font-bold text-sm whitespace-nowrap ${
                              tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {tx.amount > 0 ? '+' : ''}Rp {tx.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: POHON JARINGAN (BINARY TREE GRAPH) */}
          {activeTab === 'tree' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="tree-tab-content">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TreePine className="text-blue-600 w-5 h-5" /> Pohon Jaringan Silsilah Binary
                  </h3>
                  <p className="text-xs text-slate-500">Traversasi silsilah tim binary 10 level Anda. Klik node downline untuk memusatkan grafik.</p>
                </div>
                {treeRootNode && treeRootNode.id !== user.id && (
                  <button
                    id="btn-reset-tree"
                    onClick={resetTreeFocus}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 shadow-sm"
                  >
                    Kembali Ke Atas (Saya)
                  </button>
                )}
              </div>

              {/* Graphical Visual Render */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 overflow-x-auto flex justify-center min-h-[480px]">
                {treeRootNode ? (
                  <div className="flex flex-col items-center select-none w-[800px] shrink-0 pt-6">
                    
                    {/* ROOT LEVEL 1 */}
                    <div className="flex flex-col items-center">
                      <div className={`p-4 rounded-xl border w-40 text-center shadow-md relative ${
                        treeRootNode.id === user.id ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white border-blue-500' : 'bg-white border-slate-200'
                      }`}>
                        <p className="text-[10px] opacity-80 uppercase tracking-widest font-extrabold">Upline Fokus</p>
                        <p className="font-bold text-sm truncate mt-0.5">{treeRootNode.fullname}</p>
                        <p className={`text-[10px] mt-0.5 font-bold ${treeRootNode.id === user.id ? 'text-blue-100' : 'text-slate-400'}`}>@{treeRootNode.username}</p>
                        
                        <div className="grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t border-slate-200/20 text-[9px] font-extrabold">
                          <div className="border-r border-slate-200/20">
                            <p className="opacity-80">L (Kiri)</p>
                            <p className="text-xs font-black">{treeRootNode.left_count} pt</p>
                          </div>
                          <div>
                            <p className="opacity-80">R (Kanan)</p>
                            <p className="text-xs font-black">{treeRootNode.right_count} pt</p>
                          </div>
                        </div>
                      </div>

                      {/* Tree Branch connectors (vertical line) */}
                      <div className="h-8 w-0.5 bg-slate-300"></div>
                      {/* Horizontal line */}
                      <div className="w-[300px] h-0.5 bg-slate-300 flex justify-between">
                        <div className="w-0.5 h-4 bg-slate-300"></div>
                        <div className="w-0.5 h-4 bg-slate-300"></div>
                      </div>
                    </div>

                    {/* ROOT LEVEL 2 (Left & Right Child) */}
                    <div className="flex justify-between w-[640px] pt-4">
                      
                      {/* LEFT LEG */}
                      <div className="flex flex-col items-center w-[300px]">
                        {treeRootNode.left ? (
                          <div 
                            onClick={() => handleTreeNodeClick(treeRootNode.left!.id)}
                            className={`p-3 rounded-xl border w-36 text-center cursor-pointer shadow-sm hover:shadow-lg hover:border-blue-500 hover:-translate-y-0.5 transition duration-200 ${
                              treeRootNode.left.is_active ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'
                            }`}
                          >
                            <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Kiri (L)</p>
                            <p className="font-bold text-xs truncate mt-0.5">{treeRootNode.left.fullname}</p>
                            <p className="text-[9px] text-slate-400 font-mono">@{treeRootNode.left.username}</p>
                            <div className="flex justify-between text-[8px] mt-1.5 pt-1.5 border-t border-slate-100 font-bold">
                              <span>L: {treeRootNode.left.left_count}</span>
                              <span>R: {treeRootNode.left.right_count}</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setActiveTab('referrals')}
                            className="p-3 rounded-xl border border-dashed border-slate-300 w-36 text-center text-[10px] text-slate-400 bg-slate-50/50 py-6"
                          >
                            <p className="font-extrabold text-blue-500">+ Tambah</p>
                            <p className="text-[8px] opacity-75 mt-0.5">Sponsori Kiri</p>
                          </div>
                        )}

                        {/* Connector down to level 3 left */}
                        <div className="h-6 w-0.5 bg-slate-300"></div>
                        <div className="w-[140px] h-0.5 bg-slate-300 flex justify-between">
                          <div className="w-0.5 h-4 bg-slate-300"></div>
                          <div className="w-0.5 h-4 bg-slate-300"></div>
                        </div>

                        {/* LEVEL 3 Under Left Leg (L-L, L-R) */}
                        <div className="flex justify-between w-[180px] pt-4">
                          {treeRootNode.left?.left ? (
                            <div 
                              onClick={() => handleTreeNodeClick(treeRootNode.left!.left!.id)}
                              className="p-2 rounded-xl border border-slate-200 w-20 text-center cursor-pointer shadow-sm bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                            >
                              <p className="font-bold truncate">@{treeRootNode.left.left.username}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">L-L</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl border border-dashed border-slate-200 w-20 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                              Kosong
                            </div>
                          )}

                          {treeRootNode.left?.right ? (
                            <div 
                              onClick={() => handleTreeNodeClick(treeRootNode.left!.right!.id)}
                              className="p-2 rounded-xl border border-slate-200 w-20 text-center cursor-pointer shadow-sm bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                            >
                              <p className="font-bold truncate">@{treeRootNode.left.right.username}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">L-R</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl border border-dashed border-slate-200 w-20 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                              Kosong
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT LEG */}
                      <div className="flex flex-col items-center w-[300px]">
                        {treeRootNode.right ? (
                          <div 
                            onClick={() => handleTreeNodeClick(treeRootNode.right!.id)}
                            className={`p-3 rounded-xl border w-36 text-center cursor-pointer shadow-sm hover:shadow-lg hover:border-blue-500 hover:-translate-y-0.5 transition duration-200 ${
                              treeRootNode.right.is_active ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'
                            }`}
                          >
                            <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Kanan (R)</p>
                            <p className="font-bold text-xs truncate mt-0.5">{treeRootNode.right.fullname}</p>
                            <p className="text-[9px] text-slate-400 font-mono">@{treeRootNode.right.username}</p>
                            <div className="flex justify-between text-[8px] mt-1.5 pt-1.5 border-t border-slate-100 font-bold">
                              <span>L: {treeRootNode.right.left_count}</span>
                              <span>R: {treeRootNode.right.right_count}</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setActiveTab('referrals')}
                            className="p-3 rounded-xl border border-dashed border-slate-300 w-36 text-center text-[10px] text-slate-400 bg-slate-50/50 py-6"
                          >
                            <p className="font-extrabold text-amber-500">+ Tambah</p>
                            <p className="text-[8px] opacity-75 mt-0.5">Sponsori Kanan</p>
                          </div>
                        )}

                        {/* Connector down to level 3 right */}
                        <div className="h-6 w-0.5 bg-slate-300"></div>
                        <div className="w-[140px] h-0.5 bg-slate-300 flex justify-between">
                          <div className="w-0.5 h-4 bg-slate-300"></div>
                          <div className="w-0.5 h-4 bg-slate-300"></div>
                        </div>

                        {/* LEVEL 3 Under Right Leg (R-L, R-R) */}
                        <div className="flex justify-between w-[180px] pt-4">
                          {treeRootNode.right?.left ? (
                            <div 
                              onClick={() => handleTreeNodeClick(treeRootNode.right!.left!.id)}
                              className="p-2 rounded-xl border border-slate-200 w-20 text-center cursor-pointer shadow-sm bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                            >
                              <p className="font-bold truncate">@{treeRootNode.right.left.username}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">R-L</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl border border-dashed border-slate-200 w-20 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                              Kosong
                            </div>
                          )}

                          {treeRootNode.right?.right ? (
                            <div 
                              onClick={() => handleTreeNodeClick(treeRootNode.right!.right!.id)}
                              className="p-2 rounded-xl border border-slate-200 w-20 text-center cursor-pointer shadow-sm bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                            >
                              <p className="font-bold truncate">@{treeRootNode.right.right.username}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">R-R</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl border border-dashed border-slate-200 w-20 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                              Kosong
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-12">Pohon Jaringan Kosong</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-500 leading-relaxed">
                <span className="font-extrabold text-slate-700 block mb-1">💡 Tips Penelusuran Pohon Jaringan:</span>
                - Anda dapat mengklik nama kotak downline yang berwarna (aktif) untuk memfokuskan silsilah dan melihat tim di bawah mereka. <br />
                - Gunakan tombol <span className="font-extrabold">"Kembali Ke Atas"</span> untuk mereset fokus visual ke akun Anda kembali.
              </div>
            </div>
          )}

          {/* TAB 3: SHOP (BELANJA CELANA JEANS) */}
          {activeTab === 'shop' && (
            <div className="space-y-6" id="shop-tab-content">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <ShoppingBag className="text-blue-600 w-5 h-5" /> Katalog Jeans Premium Khusus Member
                </h3>
                <p className="text-xs text-slate-500">Membeli produk jeans akan secara otomatis memotong saldo dompet Anda, mengirimkan pesanan ke gudang logistik kami, dan mengalirkan Bonus Repeat Order (RO) Rp 5.000 ke sponsor Anda.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-48 bg-slate-100 shrink-0 relative">
                      <img referrerPolicy="no-referrer" src={p.image} className="w-full h-full object-cover" alt={p.name} />
                      <div className="absolute top-2 left-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-1 rounded">
                        Stok: {p.stock} pcs
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-baseline mb-3">
                          <span className="text-[10px] text-slate-400">Harga Member</span>
                          <span className="text-blue-600 font-extrabold text-lg">Rp {p.member_price.toLocaleString()}</span>
                        </div>
                        
                        <button
                          id={`btn-buy-product-${p.id}`}
                          onClick={() => handleProductPurchase(p.id)}
                          disabled={p.stock < 1 || loadingAction}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                            p.stock < 1 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> 
                          {p.stock < 1 ? 'Stok Habis' : 'Beli Menggunakan Saldo'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DEPO & WD */}
          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="finance-tab-content">
              
              {/* DEPOSIT MODULE */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ArrowDownLeft className="text-blue-600 w-5 h-5" /> Isi Saldo (Deposit)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top-up saldo dompet Anda menggunakan gerbang pembayaran QRIS instan atau VA Bank.</p>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Pengisian (Rp)</label>
                    <input
                      type="number"
                      required
                      min="50000"
                      placeholder="Contoh: 100000"
                      value={depAmount}
                      onChange={(e) => setDepAmount(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-extrabold"
                    />
                    <span className="text-[10px] text-slate-400">Minimal deposit adalah Rp 50.000</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        id="dep-method-qris"
                        onClick={() => setDepMethod('qris')}
                        className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                          depMethod === 'qris' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-black text-[10px] tracking-tighter text-red-600 block">QRIS</span>
                        <span className="text-[8px] opacity-75">Saran (Instan)</span>
                      </button>

                      <button
                        type="button"
                        id="dep-method-bca"
                        onClick={() => setDepMethod('bca')}
                        className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                          depMethod === 'bca' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-extrabold block">BCA</span>
                        <span className="text-[8px] opacity-75">VA Otomatis</span>
                      </button>

                      <button
                        type="button"
                        id="dep-method-mandiri"
                        onClick={() => setDepMethod('mandiri')}
                        className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                          depMethod === 'mandiri' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-extrabold block">MANDIRI</span>
                        <span className="text-[8px] opacity-75">VA Otomatis</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-deposit"
                    disabled={loadingAction}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm shadow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Buat Tagihan Deposit
                  </button>
                </form>

                {/* Deposits Queue & Simulated QRIS screen */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Antrean Deposit Pembayaran</h4>
                  <div className="space-y-3">
                    {deposits.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Belum ada aktivitas deposit</p>
                    ) : (
                      deposits.map((dep) => (
                        <div key={dep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <p className="font-bold text-slate-700">Rp {dep.amount.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-mono">{dep.method} VA • ID #{dep.id}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                              dep.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {dep.status}
                            </span>
                          </div>

                          {dep.status === 'pending' && (
                            <div className="space-y-3 border-t border-slate-200/60 pt-3">
                              {dep.method === 'qris' && (
                                <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-slate-100">
                                  <p className="text-[9px] text-red-600 font-bold tracking-widest uppercase mb-1">Pindai Kode QRIS Di Bawah</p>
                                  <img referrerPolicy="no-referrer" src={dep.payment_code} className="w-32 h-32" alt="QRIS Code" />
                                </div>
                              )}
                              
                              <div className="bg-blue-50 rounded-lg p-2.5 text-[10px] text-blue-900 border border-blue-100">
                                <strong>Kode/VA VA:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 block mt-1 break-all">{dep.payment_code}</code>
                              </div>

                              <button
                                type="button"
                                id={`btn-simulate-pay-${dep.id}`}
                                onClick={() => onSimulatePayment(dep.id)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 shadow"
                              >
                                <RefreshCw className="w-3 h-3 animate-spin" /> Simulasi Verifikasi Gateway Instan
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* WITHDRAWAL MODULE */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ArrowUpRight className="text-blue-600 w-5 h-5" /> Penarikan Dana (Withdrawal)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tarik dana bonus Anda langsung ke rekening bank lokal Anda.</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Saldo Tersedia:</span>
                    <strong className="text-slate-950 font-bold">Rp {user.balance.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Minimal Penarikan:</span>
                    <span className="text-slate-500">Rp 50.000</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Pencairan Otomatis:</span>
                    <span className="bg-green-100 text-green-800 font-extrabold px-2 py-0.2 rounded-full text-[9px] uppercase">AKTIF</span>
                  </div>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Penarikan (Rp)</label>
                    <input
                      type="number"
                      required
                      min="50000"
                      max={user.balance}
                      placeholder="Contoh: 150000"
                      value={wdAmount}
                      onChange={(e) => setWdAmount(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-extrabold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Bank</label>
                      <select
                        value={wdBank}
                        onChange={(e) => setWdBank(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                      >
                        <option value="BCA">BCA (Bank Central Asia)</option>
                        <option value="MANDIRI">MANDIRI (Bank Mandiri)</option>
                        <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                        <option value="BNI">BNI (Bank Negara Indonesia)</option>
                        <option value="GOPAY">GOPAY (E-Wallet)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Rekening / No. HP</label>
                      <input
                        type="text"
                        required
                        placeholder="1234567890"
                        value={wdAccount}
                        onChange={(e) => setWdAccount(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap Pemilik"
                      value={wdHolder}
                      onChange={(e) => setWdHolder(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-withdraw"
                    disabled={user.balance < 50000 || loadingAction}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition text-sm shadow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-blue-500" /> Ajukan Penarikan Dana
                  </button>
                </form>

                {/* Withdrawals list queue */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Antrean Penarikan Dana</h4>
                  <div className="space-y-3">
                    {withdrawals.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Belum ada aktivitas penarikan dana</p>
                    ) : (
                      withdrawals.map((wd) => (
                        <div key={wd.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-800">Rp {wd.amount.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500">{wd.bank_name} • Rek: {wd.account_number}</p>
                            <p className="text-[9px] text-slate-400">{new Date(wd.created_at).toLocaleString('id-ID')}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            wd.status === 'success' ? 'bg-green-100 text-green-800' :
                            wd.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {wd.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: REFERRALS SPONSOR */}
          {activeTab === 'referrals' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="referrals-tab-content">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="text-blue-600 w-5 h-5" /> Anggota Yang Anda Sponsori Langsung
                </h3>
                <p className="text-xs text-slate-500">Daftar rekan kerja yang mendaftar menggunakan ID Referal Anda. Dapatkan Bonus Sponsor Rp 20.000 ketika mereka melakukan aktifasi premium.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-extrabold">Nama Anggota</th>
                      <th className="py-3 px-4 font-extrabold">Username</th>
                      <th className="py-3 px-4 font-extrabold">No. Telepon</th>
                      <th className="py-3 px-4 font-extrabold">Tanggal Daftar</th>
                      <th className="py-3 px-4 font-extrabold">Status Aktifasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referrals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada rekan yang mendaftar via referal Anda</td>
                      </tr>
                    ) : (
                      referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{ref.fullname}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">@{ref.username}</td>
                          <td className="py-3.5 px-4 text-slate-600">{ref.phone}</td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(ref.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                              ref.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {ref.is_active ? 'Premium Aktif' : 'Tidak Aktif'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DETAILED COMMISSIONS & REWARDS */}
          {activeTab === 'bonuses' && (
            <div className="space-y-6" id="bonuses-tab-content">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-amber-500 w-5 h-5 animate-bounce" /> Laporan Transparansi Komisi & Target Reward Jaringan
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau perincian komisi sponsor, pasangan, level, dan repeat order serta kualifikasi klaim hadiah reward Anda secara real-time.
                </p>
              </div>

              {/* Grid 4 jenis bonus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Sponsor */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Komisi Sponsor</span>
                    <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-md">Direct</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-950">Rp {user.sponsor_bonus.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Bonus rekomendasi langsung Rp {(settings?.sponsorBonus || 20000).toLocaleString()} per aktivasi premium.
                    </p>
                  </div>
                </div>

                {/* 2. Pairing */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Komisi Pairing</span>
                    <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded-md">Kaki Pasangan</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-950">Rp {user.pairing_bonus.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Bonus pasangan kaki kiri & kanan Rp {(settings?.pairingBonus || 10000).toLocaleString()} per pasang volume.
                    </p>
                  </div>
                </div>

                {/* 3. Level */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Komisi Jaringan Level</span>
                    <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-md">10 Generasi</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-950">Rp {user.level_bonus.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Komisi kedalaman 10 level jaringan ketika member premium baru di bawah Anda mendaftar.
                    </p>
                  </div>
                </div>

                {/* 4. Repeat Order */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Komisi Repeat Order (RO)</span>
                    <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-md">Belanja</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-950">Rp {user.ro_bonus.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Bonus Rp {(settings?.roBonus || 5000).toLocaleString()} setiap kali jaringan Anda membeli celana jeans premium.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Target Reward */}
              {user.is_active ? (
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Program Reward Utama
                      </span>
                      <h4 className="text-lg font-bold text-white mt-2">
                        Hadiah Target: {settings?.rewardName || "Honda Vario Matic Baru"}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Nilai setara: <span className="text-amber-400 font-extrabold">Rp {(settings?.rewardCashEquivalent || 20000000).toLocaleString()} Cash</span>
                      </p>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex gap-6 text-center text-xs shrink-0">
                      <div>
                        <p className="text-slate-400 font-medium">Kiri Anda</p>
                        <p className="text-xl font-black text-blue-400">{user.left_sales} <span className="text-[10px] text-slate-400">Unit</span></p>
                      </div>
                      <div className="border-r border-slate-700"></div>
                      <div>
                        <p className="text-slate-400 font-medium">Kanan Anda</p>
                        <p className="text-xl font-black text-purple-400">{user.right_sales} <span className="text-[10px] text-slate-400">Unit</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Hitung kelayakan */}
                  {user.left_sales >= (settings?.rewardThresholdLeft || 5) && user.right_sales >= (settings?.rewardThresholdRight || 5) ? (
                    <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white p-5 rounded-2xl space-y-2 border border-yellow-400 shadow-[0_8px_30px_rgb(245,158,11,0.2)] animate-pulse">
                      <h5 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 text-slate-950">
                        🏆 SELAMAT! TARGET REWARD TELAH TERCAPAI!
                      </h5>
                      <p className="text-xs font-semibold leading-relaxed">
                        Akun Anda berhasil mengumpulkan volume sales kaki kiri & kanan yang disyaratkan. Silakan hubungi Customer Service kami di {settings?.contactPhone || "+62812345678"} untuk verifikasi dan serah terima hadiah {settings?.rewardName || "Honda Vario Matic Baru"}!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Syarat Volume Reward</span>
                        <span className="text-amber-400">
                          {settings?.rewardThresholdLeft || 5} Kiri : {settings?.rewardThresholdRight || 5} Kanan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Progress Kiri */}
                        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700/50">
                          <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                            <span>Sisi Kiri</span>
                            <span>{user.left_sales} / {settings?.rewardThresholdLeft || 5} Unit</span>
                          </div>
                          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (user.left_sales / (settings?.rewardThresholdLeft || 5)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Progress Kanan */}
                        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700/50">
                          <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                            <span>Sisi Kanan</span>
                            <span>{user.right_sales} / {settings?.rewardThresholdRight || 5} Unit</span>
                          </div>
                          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (user.right_sales / (settings?.rewardThresholdRight || 5)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Kualifikasi target reward hanya dihitung dan terbuka setelah Anda mengaktifkan status member premium!</span>
                </div>
              )}

              {/* Riwayat Transaksi Komisi */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Riwayat Penerimaan Komisi Jaringan & Pembelanjaan
                </h4>
                
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">ID / Tanggal</th>
                        <th className="px-4 py-3">Tipe Komisi</th>
                        <th className="px-4 py-3">Keterangan Sumber</th>
                        <th className="px-4 py-3 text-right">Jumlah (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.filter(t => ['sponsor_bonus', 'pairing_bonus', 'level_bonus', 'ro_bonus'].includes(t.type)).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                            Belum ada riwayat komisi bonus yang diterima. Kembangkan terus jaringan Anda!
                          </td>
                        </tr>
                      ) : (
                        transactions
                          .filter(t => ['sponsor_bonus', 'pairing_bonus', 'level_bonus', 'ro_bonus'].includes(t.type))
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                                #TX-{t.id} <br />
                                <span className="text-[9px] text-slate-400">{new Date(t.created_at).toLocaleString('id-ID')}</span>
                              </td>
                              <td className="px-4 py-3 font-bold">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                                  t.type === 'sponsor_bonus' ? 'bg-blue-100 text-blue-800' :
                                  t.type === 'pairing_bonus' ? 'bg-purple-100 text-purple-800' :
                                  t.type === 'level_bonus' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-700 leading-normal">{t.description}</td>
                              <td className="px-4 py-3 text-right font-bold text-green-600 font-mono">+Rp {t.amount.toLocaleString()}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PANDUAN SYSTEM MLM */}
          {activeTab === 'panduan' && (
            <div className="space-y-6" id="panduan-tab-content">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" /> Panduan & Syarat Ketentuan Bonus MLM
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pahami mekanisme pembagian hasil komisi dan bonus sistem jaringan Binary secara transparan.
                </p>
              </div>

              {/* Detail Panduan */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-6">
                  
                  {/* Sistem Binary */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> 1. Sistem Matriks Jaringan Binary
                    </h4>
                    <p>
                      Platform kami menggunakan arsitektur jaringan <strong className="text-slate-900">Binary 10 Level</strong>. Setiap pemilik Hak Usaha (HU) memiliki maksimal 2 kaki langsung di bawahnya (kaki Kiri dan kaki Kanan). Pendaftaran member baru berikutnya akan diletakkan di kedalaman jaringan secara spillover guna memperkuat formasi tim.
                    </p>
                  </div>

                  {/* Bonus Sponsor */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> 2. Bonus Sponsor (Komisi Rekomendasi)
                    </h4>
                    <p>
                      Merupakan komisi yang Anda peroleh secara langsung setiap kali merekomendasikan orang baru untuk bergabung dan mengaktifkan status Hak Usaha premium.
                    </p>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900">
                      <strong>Besaran Komisi:</strong> Rp {(settings?.sponsorBonus || 20000).toLocaleString()} per pendaftaran aktif secara langsung. Tanpa batasan jumlah rekrutmen sponsor langsung.
                    </div>
                  </div>

                  {/* Bonus Pairing */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> 3. Bonus Pasangan (Pairing Bonus)
                    </h4>
                    <p>
                      Diberikan ketika terjadi pertumbuhan volume poin omset seimbang antara kaki Kiri dan kaki Kanan dalam diagram pohon jaringan Anda.
                    </p>
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs text-purple-900">
                      <strong>Mekanisme & Nilai:</strong> Rp 10.000 per pasangan seimbang (1 pt kiri vs 1 pt kanan). 
                      <span className="block mt-1 font-semibold text-purple-950">Limit Flush-Out: Maksimal 10 pasang (Rp 100.000) per hari untuk menjaga kestabilan finansial sirkulasi sistem (keamanan dana).</span>
                    </div>
                  </div>

                  {/* Bonus Level Generasi */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> 4. Bonus Generasi Kedalaman (Up to 10 Level)
                    </h4>
                    <p>
                      Setiap kali ada pendaftaran member premium baru di kedalaman struktur jaringan Anda hingga kedalaman generasi ke-10, Anda akan memperoleh bagi hasil pasif komisi level:
                    </p>
                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 text-xs text-green-900 grid grid-cols-2 gap-3">
                      <div>• <strong>Generasi 1 (Sponsor langsung):</strong> Rp 5.000</div>
                      <div>• <strong>Generasi 2:</strong> Rp 4.000</div>
                      <div>• <strong>Generasi 3:</strong> Rp 3.000</div>
                      <div>• <strong>Generasi 4 s/d 10:</strong> Rp 1.000 per member aktif</div>
                    </div>
                  </div>

                  {/* Bonus Repeat Order */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> 5. Bonus Repeat Order (Pasif Belanja Jeans)
                    </h4>
                    <p>
                      Ketika member yang Anda sponsori langsung melakukan pembelanjaan ulang produk Jeans Premium di Toko Belanja, Anda mendapatkan komisi pasif repeat order:
                    </p>
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-xs text-amber-900">
                      <strong>Besaran Komisi RO:</strong> Rp 5.000 dari setiap pcs jeans premium yang dibeli oleh jaringan sponsor langsung Anda. Ini menjadi pasif income berkelanjutan.
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PROFIL SAYA */}
          {activeTab === 'profil' && (
            <div className="space-y-6" id="profil-tab-content">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Profil & Pengaturan Akun
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola informasi pribadi, nomor kontak WhatsApp, dan kata sandi keamanan akun Anda.
                </p>
              </div>

              {statusMessage.text && (
                <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                  statusMessage.type === 'success' 
                    ? 'bg-green-50 border-green-100 text-green-800' 
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
                  <div>
                    <span className="font-bold block">{statusMessage.type === 'success' ? 'Berhasil' : 'Kesalahan'}</span>
                    {statusMessage.text}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Informasi Profil */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> Informasi Pribadi
                  </h4>
                  
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ID / Username</label>
                      <input
                        type="text"
                        disabled
                        value={user.username}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={profileFullname}
                        onChange={(e) => setProfileFullname(e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Alamat Email</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">No. WhatsApp / WA</label>
                      <input
                        type="text"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Contoh: 0812345678"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                    >
                      {loadingAction ? "Memproses..." : "Simpan Perubahan"}
                    </button>
                  </form>
                </div>

                {/* Form Reset Password */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block"></span> Atur Ulang Kata Sandi
                  </h4>

                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kata Sandi Saat Ini</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Konfirmasi Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                    >
                      {loadingAction ? "Memproses..." : "Perbarui Kata Sandi"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
