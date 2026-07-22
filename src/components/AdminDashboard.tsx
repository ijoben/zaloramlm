import React, { useState } from "react";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest } from "../types";
import { 
  Shield, Users, DollarSign, Package, TrendingUp, HelpCircle, 
  CheckCircle, XCircle, Settings, ToggleLeft, ToggleRight, Edit, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, BarChart2, Search, Percent,
  Globe, PlusCircle, Check, X, ArrowDown, CreditCard, Menu, User, Lock
} from "lucide-react";

interface AdminDashboardProps {
  user?: MLMUser;
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
  products: Product[];
  onRefresh: () => void;
  onLogout: () => void;
  onUpdateProductStock: (productId: number, stock: number, price: number, memberPrice: number) => Promise<void>;
  onProcessWithdrawal: (wdId: number, action: 'approve' | 'reject') => Promise<void>;
  onToggleAutoPayout: (autoPayout: boolean) => Promise<void>;
  settings?: any;
  onUpdateSettings?: (newSettings: any) => Promise<boolean>;
  onRefreshProducts?: () => void;
}

export default function AdminDashboard({
  user,
  metrics,
  users,
  withdrawals,
  deposits,
  transactions,
  products,
  onRefresh,
  onLogout,
  onUpdateProductStock,
  onProcessWithdrawal,
  onToggleAutoPayout,
  settings,
  onUpdateSettings,
  onRefreshProducts
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'financials' | 'withdrawals' | 'deposits' | 'members' | 'products' | 'settings' | 'profil'>('financials');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Product edit states
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [editMemberPrice, setEditMemberPrice] = useState(0);

  // User search query
  const [searchQuery, setSearchQuery] = useState('');

  // Status logs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Web and MLM configuration states
  const [formWebName, setFormWebName] = useState(settings?.webName || '');
  const [formLogoText, setFormLogoText] = useState(settings?.logoText || '');
  const [formContactPhone, setFormContactPhone] = useState(settings?.contactPhone || '');
  const [formContactEmail, setFormContactEmail] = useState(settings?.contactEmail || '');

  const [formSponsorBonus, setFormSponsorBonus] = useState(settings?.sponsorBonus || 20000);
  const [formPairingBonus, setFormPairingBonus] = useState(settings?.pairingBonus || 10000);
  const [formRoBonus, setFormRoBonus] = useState(settings?.roBonus || 5000);
  const [formLevelBonusG1, setFormLevelBonusG1] = useState(settings?.levelBonusG1 || 5000);
  const [formLevelBonusG2, setFormLevelBonusG2] = useState(settings?.levelBonusG2 || 4000);
  const [formLevelBonusG3, setFormLevelBonusG3] = useState(settings?.levelBonusG3 || 3000);
  const [formLevelBonusG4, setFormLevelBonusG4] = useState(settings?.levelBonusG4 || 1000);
  const [formLevelBonusG5, setFormLevelBonusG5] = useState(settings?.levelBonusG5 || 1000);
  const [formLevelBonusG6, setFormLevelBonusG6] = useState(settings?.levelBonusG6 || 1000);
  const [formLevelBonusG7, setFormLevelBonusG7] = useState(settings?.levelBonusG7 || 1000);
  const [formLevelBonusG8, setFormLevelBonusG8] = useState(settings?.levelBonusG8 || 1000);
  const [formLevelBonusG9, setFormLevelBonusG9] = useState(settings?.levelBonusG9 || 1000);
  const [formLevelBonusG10, setFormLevelBonusG10] = useState(settings?.levelBonusG10 || 1000);

  const [formRewardThresholdLeft, setFormRewardThresholdLeft] = useState(settings?.rewardThresholdLeft || 5);
  const [formRewardThresholdRight, setFormRewardThresholdRight] = useState(settings?.rewardThresholdRight || 5);
  const [formRewardName, setFormRewardName] = useState(settings?.rewardName || "Honda Vario Matic Baru");
  const [formRewardCashEquivalent, setFormRewardCashEquivalent] = useState(settings?.rewardCashEquivalent || 20000000);

  // Midtrans configuration states
  const [formMidtransMerchantId, setFormMidtransMerchantId] = useState(settings?.midtransMerchantId || '');
  const [formMidtransClientKey, setFormMidtransClientKey] = useState(settings?.midtransClientKey || '');
  const [formMidtransServerKey, setFormMidtransServerKey] = useState(settings?.midtransServerKey || '');
  const [formMidtransIsProduction, setFormMidtransIsProduction] = useState(settings?.midtransIsProduction || false);

  // Email Notification configuration states
  const [formEmailNotifAdminActive, setFormEmailNotifAdminActive] = useState(settings?.emailNotifRegisterAdminActive ?? true);
  const [formEmailNotifSponsorActive, setFormEmailNotifSponsorActive] = useState(settings?.emailNotifRegisterSponsorActive ?? true);
  const [formAdminNotifEmail, setFormAdminNotifEmail] = useState(settings?.adminNotifEmail || 'admin@zaloradenim.com');
  const [formSmtpHost, setFormSmtpHost] = useState(settings?.smtpHost || 'smtp.gmail.com');
  const [formSmtpPort, setFormSmtpPort] = useState(settings?.smtpPort || 587);
  const [formSmtpUser, setFormSmtpUser] = useState(settings?.smtpUser || 'notifikasi@zaloradenim.com');
  const [formSmtpPass, setFormSmtpPass] = useState(settings?.smtpPass || 'app-password-1234');
  const [formEmailSenderName, setFormEmailSenderName] = useState(settings?.emailSenderName || 'Zalora Denim Premium MLM');
  const [formWelcomeEmailTemplate, setFormWelcomeEmailTemplate] = useState(settings?.welcomeEmailTemplate || '');

  // Admin Profile & Password Form states
  const [profileFullname, setProfileFullname] = useState(user?.fullname || 'Admin Utama');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@zaloradenim.com');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '081234567890');
  const [profilePassword, setProfilePassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Sync profile when user updates
  React.useEffect(() => {
    if (user) {
      setProfileFullname(user.fullname);
      setProfileEmail(user.email);
      setProfilePhone(user.phone);
    }
  }, [user]);

  // Sync state if settings prop changes (e.g. on load)
  React.useEffect(() => {
    if (settings) {
      setFormWebName(settings.webName || '');
      setFormLogoText(settings.logoText || '');
      setFormContactPhone(settings.contactPhone || '');
      setFormContactEmail(settings.contactEmail || '');
      setFormSponsorBonus(settings.sponsorBonus ?? 20000);
      setFormPairingBonus(settings.pairingBonus ?? 10000);
      setFormRoBonus(settings.roBonus ?? 5000);
      setFormLevelBonusG1(settings.levelBonusG1 ?? 5000);
      setFormLevelBonusG2(settings.levelBonusG2 ?? 4000);
      setFormLevelBonusG3(settings.levelBonusG3 ?? 3000);
      setFormLevelBonusG4(settings.levelBonusG4 ?? 1000);
      setFormLevelBonusG5(settings.levelBonusG5 ?? 1000);
      setFormLevelBonusG6(settings.levelBonusG6 ?? 1000);
      setFormLevelBonusG7(settings.levelBonusG7 ?? 1000);
      setFormLevelBonusG8(settings.levelBonusG8 ?? 1000);
      setFormLevelBonusG9(settings.levelBonusG9 ?? 1000);
      setFormLevelBonusG10(settings.levelBonusG10 ?? 1000);
      setFormRewardThresholdLeft(settings.rewardThresholdLeft ?? 5);
      setFormRewardThresholdRight(settings.rewardThresholdRight ?? 5);
      setFormRewardName(settings.rewardName || '');
      setFormRewardCashEquivalent(settings.rewardCashEquivalent ?? 20000000);
      setFormMidtransMerchantId(settings.midtransMerchantId || '');
      setFormMidtransClientKey(settings.midtransClientKey || '');
      setFormMidtransServerKey(settings.midtransServerKey || '');
      setFormMidtransIsProduction(settings.midtransIsProduction ?? false);

      setFormEmailNotifAdminActive(settings.emailNotifRegisterAdminActive ?? true);
      setFormEmailNotifSponsorActive(settings.emailNotifRegisterSponsorActive ?? true);
      setFormAdminNotifEmail(settings.adminNotifEmail || 'admin@zaloradenim.com');
      setFormSmtpHost(settings.smtpHost || 'smtp.gmail.com');
      setFormSmtpPort(settings.smtpPort ?? 587);
      setFormSmtpUser(settings.smtpUser || 'notifikasi@zaloradenim.com');
      setFormSmtpPass(settings.smtpPass || 'app-password-1234');
      setFormEmailSenderName(settings.emailSenderName || 'Zalora Denim Premium MLM');
      setFormWelcomeEmailTemplate(settings.welcomeEmailTemplate || '');
    }
  }, [settings]);

  // Product addition states
  const [newProdName, setNewProdName] = useState('');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80');
  const [newProdPrice, setNewProdPrice] = useState(150000);
  const [newProdMemberPrice, setNewProdMemberPrice] = useState(120000);
  const [newProdStock, setNewProdStock] = useState(100);
  const [newProdDescription, setNewProdDescription] = useState('Bahan denim premium 12oz, jahitan kuat dan presisi, nyaman dipakai sehari-hari.');

  const handleProcessDeposit = async (depositId: number, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deposit/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId, action })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Berhasil memproses deposit manual!", type: "success" });
        onRefresh();
      } else {
        setMessage({ text: data.message || "Gagal memproses deposit", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: "Koneksi terputus saat memproses deposit", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) {
      alert("Harap masukkan nama produk");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProdName,
          image: newProdImage,
          price: Number(newProdPrice),
          member_price: Number(newProdMemberPrice),
          stock: Number(newProdStock),
          description: newProdDescription
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Produk baru berhasil ditambahkan!", type: "success" });
        setNewProdName('');
        setNewProdPrice(150000);
        setNewProdMemberPrice(120000);
        setNewProdStock(100);
        if (onRefreshProducts) onRefreshProducts();
        onRefresh();
      } else {
        setMessage({ text: data.message || "Gagal menambahkan produk", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Gagal menyambung ke server", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSettings) return;
    setLoading(true);
    const success = await onUpdateSettings({
      webName: formWebName,
      logoText: formLogoText,
      contactPhone: formContactPhone,
      contactEmail: formContactEmail,
      sponsorBonus: Number(formSponsorBonus),
      pairingBonus: Number(formPairingBonus),
      roBonus: Number(formRoBonus),
      levelBonusG1: Number(formLevelBonusG1),
      levelBonusG2: Number(formLevelBonusG2),
      levelBonusG3: Number(formLevelBonusG3),
      levelBonusG4: Number(formLevelBonusG4),
      levelBonusG5: Number(formLevelBonusG5),
      levelBonusG6: Number(formLevelBonusG6),
      levelBonusG7: Number(formLevelBonusG7),
      levelBonusG8: Number(formLevelBonusG8),
      levelBonusG9: Number(formLevelBonusG9),
      levelBonusG10: Number(formLevelBonusG10),
      rewardThresholdLeft: Number(formRewardThresholdLeft),
      rewardThresholdRight: Number(formRewardThresholdRight),
      rewardName: formRewardName,
      rewardCashEquivalent: Number(formRewardCashEquivalent),
      midtransMerchantId: formMidtransMerchantId,
      midtransClientKey: formMidtransClientKey,
      midtransServerKey: formMidtransServerKey,
      midtransIsProduction: formMidtransIsProduction,
      emailNotifRegisterAdminActive: formEmailNotifAdminActive,
      emailNotifRegisterSponsorActive: formEmailNotifSponsorActive,
      adminNotifEmail: formAdminNotifEmail,
      smtpHost: formSmtpHost,
      smtpPort: Number(formSmtpPort),
      smtpUser: formSmtpUser,
      smtpPass: formSmtpPass,
      emailSenderName: formEmailSenderName,
      welcomeEmailTemplate: formWelcomeEmailTemplate
    });
    if (success) {
      setMessage({ text: "Semua konfigurasi Web, skema bonus MLM, kredensial Midtrans, dan notifikasi email berhasil disimpan ke server!", type: "success" });
    }
    setLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullname || !profileEmail || !profilePhone) {
      alert("Nama Lengkap, Email, dan No. WA harus diisi!");
      return;
    }
    if (!user) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui profil");
      setProfilePassword('');
      setMessage({ text: "Profil Anda berhasil diperbarui!", type: "success" });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal memperbarui profil", type: "error" });
    } finally {
      setLoading(false);
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
    if (!user) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/user/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mereset kata sandi");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setMessage({ text: "Kata sandi Anda berhasil diperbarui!", type: "success" });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mereset kata sandi", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleProductEditSubmit = async (productId: number) => {
    setLoading(true);
    try {
      await onUpdateProductStock(productId, editStock, editPrice, editMemberPrice);
      setEditingProductId(null);
      setMessage({ text: "Detail produk dan stok berhasil diperbarui di database!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mengupdate produk", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleWDApproval = async (wdId: number, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      await onProcessWithdrawal(wdId, action);
      setMessage({ text: `Permintaan penarikan berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}.`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal memproses penarikan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayoutMode = async () => {
    setLoading(true);
    try {
      await onToggleAutoPayout(!metrics.isAutoPayout);
      setMessage({ text: `Sistem pencairan otomatis berhasil ${!metrics.isAutoPayout ? 'diaktifkan' : 'dinonaktifkan'}.`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal merubah seting pencairan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900" id="admin-dashboard-root">
      {/* Brand Header */}
      <header className="bg-slate-950 text-white h-16 px-4 sm:px-6 flex items-center justify-between shadow-lg sticky top-0 z-40" id="admin-header">
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
          <span className="text-sm sm:text-xl font-display font-black tracking-tight text-white truncate max-w-[160px] sm:max-w-none">
            {settings?.logoText || "ZALORA"}
            <span className="text-blue-500 font-light">.ADMIN</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 pl-4">
            <span className="p-1 bg-blue-500/10 text-blue-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </span>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-200 leading-none">Sistem Admin</p>
              <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">ADMINISTRATOR PERUSAHAAN</p>
            </div>
            <button 
              id="admin-btn-logout"
              onClick={onLogout} 
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition ml-2 font-bold text-xs flex items-center gap-1"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button 
            id="admin-burger-btn"
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Slide-in Menu (Right Slide) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fade-in" id="admin-mobile-menu">
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
                    {settings?.logoText || "ZALORA"}<span className="text-blue-500 font-light">.ADMIN</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Admin Profile Details */}
              <div className="bg-slate-900 p-4 rounded-xl flex items-center gap-3 border border-slate-800">
                <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Sistem Admin</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">ADMINISTRATOR</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1.5">
                <button
                  id="admin-tab-financials-mobile"
                  onClick={() => { setActiveTab('financials'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'financials' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <BarChart2 className="w-4 h-4" /> Laporan Laba Rugi
                  </span>
                </button>

                <button
                  id="admin-tab-withdrawals-mobile"
                  onClick={() => { setActiveTab('withdrawals'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ArrowUpRight className="w-4 h-4" /> Pencairan Bonus (WD)
                  </span>
                  {metrics.pendingWDCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                      {metrics.pendingWDCount}
                    </span>
                  )}
                </button>

                <button
                  id="admin-tab-deposits-mobile"
                  onClick={() => { setActiveTab('deposits'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ArrowDownLeft className="w-4 h-4" /> Validasi Deposit Manual
                  </span>
                  {deposits.filter(d => d.status === 'pending').length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                      {deposits.filter(d => d.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  id="admin-tab-members-mobile"
                  onClick={() => { setActiveTab('members'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'members' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" /> Manajemen Jaringan
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                    {metrics.totalMembers}
                  </span>
                </button>

                <button
                  id="admin-tab-products-mobile"
                  onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" /> Gudang & Stok Jeans
                  </span>
                </button>

                <button
                  id="admin-tab-settings-mobile"
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" /> Seting Web & MLM Bonus
                  </span>
                </button>

                <button
                  id="admin-tab-profil-mobile"
                  onClick={() => { setActiveTab('profil'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4" /> Profil Saya & Sandi
                  </span>
                </button>
              </nav>
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

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8" id="admin-body">
        
        {/* Admin Navigation rail */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0 space-y-4" id="admin-sidebar">
          
          {/* Nav Navigation */}
          <nav className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-1">
            <button
              id="admin-tab-financials"
              onClick={() => setActiveTab('financials')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'financials' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Laporan Laba Rugi</span>
            </button>

            <button
              id="admin-tab-withdrawals"
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Pencairan Bonus (WD)</span>
              {metrics.pendingWDCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {metrics.pendingWDCount}
                </span>
              )}
            </button>

            <button
              id="admin-tab-deposits"
              onClick={() => setActiveTab('deposits')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Validasi Deposit Manual</span>
              {deposits.filter(d => d.status === 'pending').length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {deposits.filter(d => d.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              id="admin-tab-members"
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'members' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manajemen Jaringan</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'members' ? 'bg-blue-500/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {metrics.totalMembers} org
              </span>
            </button>

            <button
              id="admin-tab-products"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'products' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Gudang & Stok Jeans</span>
            </button>

            <button
              id="admin-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Seting Web & MLM Bonus</span>
            </button>

            <button
              id="admin-tab-profil"
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil Saya & Sandi</span>
            </button>
          </nav>
        </aside>

        {/* Dashboard Panels */}
        <main className="flex-1 min-w-0 space-y-6" id="admin-main-panel">
          
          {/* Status Message Alert */}
          {message.text && (
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${
              message.type === 'success' 
                ? 'bg-green-50/60 border-green-200 text-green-900' 
                : 'bg-red-50/60 border-red-200 text-red-900'
            }`}>
              <p className="text-xs font-semibold leading-relaxed">{message.text}</p>
              <button onClick={() => setMessage({ text: '', type: '' })} className="text-xs font-bold hover:underline">Tutup</button>
            </div>
          )}

          {/* TAB 1: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-6" id="admin-financials-panel">
              
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Total Turnover Cashflow */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-850 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Omset Kotor Perusahaan</span>
                      <h3 className="text-2xl sm:text-3xl font-display font-bold mt-1 tracking-tight">Rp {metrics.totalTurnover.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-3 mt-5 flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Omset Aktifasi Member:</span>
                    <strong className="text-white">Rp {(metrics.activeMembers * 100000).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Total MLM Commissions Paid */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Beban Komisi Terbayar</span>
                      <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-950 mt-1 tracking-tight">Rp {metrics.totalBonusesPaid.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-5 flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Rasio Beban MLM:</span>
                    <span className="font-extrabold text-red-600">
                      {metrics.totalTurnover > 0 ? Math.round((metrics.totalBonusesPaid / metrics.totalTurnover) * 100) : 0}% dari Omset
                    </span>
                  </div>
                </div>

                {/* Profit Cash */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Kas Bersih Perusahaan (Profit)</span>
                      <h3 className="text-2xl sm:text-3xl font-black text-green-600 mt-1">
                        Rp {(metrics.totalTurnover - metrics.totalBonusesPaid).toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-5 flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Arus Kas Bersih:</span>
                    <span className="font-extrabold text-green-600">Surplus Kas</span>
                  </div>
                </div>
              </div>

              {/* Monthly Visual Sales Chart Simulator */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Perkembangan Kas Bulanan (Simulasi Buku Besar)</h4>
                  <p className="text-xs text-slate-500">Representasi grafis bulanan dari omset masuk dan komisi keluar MLM.</p>
                </div>

                <div className="h-60 flex items-end justify-between gap-4 pt-10 px-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                  
                  {/* Grid lines helper */}
                  <div className="absolute inset-x-0 top-10 border-t border-slate-200/50"></div>
                  <div className="absolute inset-x-0 top-24 border-t border-slate-200/50"></div>
                  <div className="absolute inset-x-0 top-38 border-t border-slate-200/50"></div>

                  <div className="flex flex-col items-center flex-1 z-10">
                    <div className="flex gap-1.5 items-end justify-center w-full h-32">
                      <div className="w-6 sm:w-10 bg-blue-600 rounded-t h-[40%]" title="Omset Mei: Rp 3.200.000"></div>
                      <div className="w-6 sm:w-10 bg-red-400 rounded-t h-[25%]" title="Beban Mei: Rp 1.100.000"></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 mt-2">Mei 2026</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 z-10">
                    <div className="flex gap-1.5 items-end justify-center w-full h-32">
                      <div className="w-6 sm:w-10 bg-blue-600 rounded-t h-[65%]" title="Omset Juni: Rp 5.800.000"></div>
                      <div className="w-6 sm:w-10 bg-red-400 rounded-t h-[35%]" title="Beban Juni: Rp 2.400.000"></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 mt-2">Juni 2026</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 z-10">
                    <div className="flex gap-1.5 items-end justify-center w-full h-32">
                      <div className="w-6 sm:w-10 bg-blue-600 rounded-t h-[95%]" title="Omset Juli: Rp 8.400.000"></div>
                      <div className="w-6 sm:w-10 bg-red-400 rounded-t h-[45%]" title="Beban Juli: Rp 3.900.000"></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 mt-2">Juli 2026 (Berjalan)</span>
                  </div>

                  {/* Chart Legend */}
                  <div className="absolute top-3 right-4 flex gap-4 text-[9px] font-bold">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> <span className="text-slate-600">Omset Masuk (HU + Produk)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-red-400 rounded"></span> <span className="text-slate-600">Komisi MLM Keluar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions log ledger */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Semua Aliran Kas Transaksi Sistem</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold">
                        <th className="py-2.5 px-4">Tanggal</th>
                        <th className="py-2.5 px-4">Pengguna</th>
                        <th className="py-2.5 px-4">Jenis</th>
                        <th className="py-2.5 px-4">Keterangan</th>
                        <th className="py-2.5 px-4 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice().reverse().map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">@{tx.username}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                              tx.type.endsWith('_bonus') ? 'bg-green-100 text-green-800' :
                              tx.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                              tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{tx.description}</td>
                          <td className={`py-3 px-4 text-right font-bold text-sm whitespace-nowrap ${
                            tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.amount > 0 ? '+' : ''}Rp {tx.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: WITHDRAWAL PROCESSING */}
          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="admin-withdrawals-panel">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="text-blue-600 w-5 h-5" /> Verifikasi Pembayaran Bonus (Withdrawal)
                </h3>
                <p className="text-xs text-slate-500">Kelola permintaan pencairan saldo komisi MLM member. Anda dapat mengaktifkan sistem "Otomatis" di sidebar untuk bypass verifikasi manual.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Penerima & Rekening</th>
                      <th className="py-3 px-4">Jumlah Penarikan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada aktivitas penarikan dana (Withdrawal)</td>
                      </tr>
                    ) : (
                      withdrawals.slice().reverse().map((wd) => (
                        <tr key={wd.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(wd.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">@{wd.username}</td>
                          <td className="py-3.5 px-4 leading-normal">
                            <span className="font-extrabold block text-slate-900">{wd.account_holder}</span>
                            <span className="text-[10px] text-slate-500 font-mono uppercase">{wd.bank_name} • {wd.account_number}</span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-sm text-slate-950">
                            Rp {wd.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                              wd.status === 'success' ? 'bg-green-100 text-green-800' :
                              wd.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {wd.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {wd.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  id={`btn-approve-wd-${wd.id}`}
                                  onClick={() => handleWDApproval(wd.id, 'approve')}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition shadow flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Setujui
                                </button>
                                <button
                                  id={`btn-reject-wd-${wd.id}`}
                                  onClick={() => handleWDApproval(wd.id, 'reject')}
                                  disabled={loading}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition border border-red-200 flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Selesai divalidasi</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS DATABASE */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="admin-members-panel">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-blue-600 w-5 h-5" /> Struktur Jaringan & Database Anggota
                  </h3>
                  <p className="text-xs text-slate-500">Berikut adalah database seluruh pengguna MLM terdaftar di sistem binary Anda.</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Username & Telp</th>
                      <th className="py-3 px-4 text-center">Lisensi</th>
                      <th className="py-3 px-4 text-center">Tim L/R</th>
                      <th className="py-3 px-4 text-center">Omset L/R</th>
                      <th className="py-3 px-4 text-right">Sisa Saldo</th>
                      <th className="py-3 px-4 text-right">Total Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">Tidak ada data anggota ditemukan</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const totalBonus = u.sponsor_bonus + u.pairing_bonus + u.level_bonus + u.ro_bonus;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-mono text-slate-400">#{u.id}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900 leading-tight">
                              {u.fullname}
                              <span className="block text-[9px] text-slate-400 font-normal">Daftar: {new Date(u.created_at).toLocaleDateString('id-ID')}</span>
                            </td>
                            <td className="py-3.5 px-4 leading-normal">
                              <span className="font-bold text-blue-600 block">@{u.username}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{u.phone}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {u.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700">
                              {u.left_count} L / {u.right_count} R
                            </td>
                            <td className="py-3.5 px-4 text-center font-black font-mono text-slate-900">
                              {u.left_sales} L / {u.right_sales} R
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-950">
                              Rp {u.balance.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-green-600">
                              Rp {totalBonus.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: WAREHOUSE & STOCK CONTROLS */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="admin-products-panel">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Package className="text-blue-600 w-5 h-5" /> Manajemen Gudang & Stok Celana Jeans Premium
                </h3>
                <p className="text-xs text-slate-500">Pantau dan ubah jumlah persediaan celana jeans premium, sesuaikan harga umum retail, serta harga khusus member premium MLM.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {products.map((p) => {
                  const isEditing = editingProductId === p.id;
                  return (
                    <div key={p.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <img referrerPolicy="no-referrer" src={p.image} className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0" alt={p.name} />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950">{p.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.description}</p>
                          <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-600">
                            <span>Stok Gudang: <strong className="text-slate-900 font-extrabold">{p.stock} pcs</strong></span>
                            <span>Harga Retail: <strong className="text-slate-900 font-extrabold">Rp {p.price.toLocaleString()}</strong></span>
                            <span>Harga Member: <strong className="text-blue-600 font-black">Rp {p.member_price.toLocaleString()}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Editing Forms */}
                      {isEditing ? (
                        <div className="w-full md:w-auto bg-white p-4 border border-slate-200 rounded-xl space-y-3 shrink-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Edit Data Produk</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase">Stok pcs</label>
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase">Harga Retail</label>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase">Harga Member</label>
                              <input
                                type="number"
                                value={editMemberPrice}
                                onChange={(e) => setEditMemberPrice(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold text-blue-600"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              id={`btn-save-product-${p.id}`}
                              onClick={() => handleProductEditSubmit(p.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1 rounded text-[10px] transition shadow"
                            >
                              Simpan
                            </button>
                            <button
                              id={`btn-cancel-product-${p.id}`}
                              onClick={() => setEditingProductId(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1 rounded text-[10px] border border-slate-200"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          id={`btn-edit-product-${p.id}`}
                          onClick={() => {
                            setEditingProductId(p.id);
                            setEditStock(p.stock);
                            setEditPrice(p.price);
                            setEditMemberPrice(p.member_price);
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs border border-slate-200 transition shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                          <Edit className="w-3.5 h-3.5" /> Atur Stok & Harga
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: DEPOSITS VALIDATION */}
          {activeTab === 'deposits' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownLeft className="text-amber-500 w-5 h-5" /> Validasi Deposit Transfer Manual
                </h3>
                <p className="text-xs text-slate-500">
                  Periksa bukti transfer dan setujui atau tolak transaksi deposit manual yang diajukan oleh para member.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">ID / Tanggal</th>
                      <th className="px-4 py-3">Username / Nama</th>
                      <th className="px-4 py-3">Metode / Detail</th>
                      <th className="px-4 py-3 text-right">Jumlah (IDR)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {deposits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">Tidak ada riwayat deposit</td>
                      </tr>
                    ) : (
                      deposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-800 font-mono">#DEP-{dep.id}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(dep.created_at).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-950">@{dep.username}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{dep.method.startsWith('manual') ? "Transfer Manual" : "Payment Gateway"}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              {dep.method.toUpperCase()}
                            </span>
                            {dep.method.startsWith('manual') && (
                              <p className="text-[10px] text-amber-600 font-semibold mt-1 font-sans">Menunggu validasi transfer bank manual</p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-900">
                            Rp {dep.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              dep.status === 'success' ? 'bg-green-100 text-green-800' :
                              dep.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {dep.status === 'success' ? 'SUCCESS' :
                               dep.status === 'failed' ? 'FAILED' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {dep.status === 'pending' ? (
                              <div className="flex gap-2 justify-center">
                                <button
                                  id={`btn-approve-dep-${dep.id}`}
                                  disabled={loading}
                                  onClick={() => handleProcessDeposit(dep.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded-lg transition shadow-sm flex items-center gap-1 text-[10px] cursor-pointer"
                                  title="Approve & Tambah Saldo"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  id={`btn-reject-dep-${dep.id}`}
                                  disabled={loading}
                                  onClick={() => handleProcessDeposit(dep.id, 'reject')}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold p-1.5 rounded-lg transition shadow-sm flex items-center gap-1 text-[10px] cursor-pointer"
                                  title="Tolak Request"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold text-[10px] uppercase">Terproses</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS & ADD PRODUCT */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* AUTOMATIC PAYOUT TOGGLE CARD */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ToggleRight className="text-blue-600 w-5 h-5 animate-pulse" /> Otomatisasi WD & Pencairan Bonus Instan
                    </h3>
                    <p className="text-xs text-slate-500">Kendalikan sistem persetujuan dan transfer dana hasil bonus pencairan (Withdrawal) member secara otomatis.</p>
                  </div>
                  <button
                    id="settings-toggle-auto-wd"
                    type="button"
                    onClick={handleTogglePayoutMode}
                    disabled={loading}
                    className="text-slate-750 transition self-start sm:self-center shrink-0"
                    title={metrics.isAutoPayout ? "Nonaktifkan WD Otomatis" : "Aktifkan WD Otomatis"}
                  >
                    {metrics.isAutoPayout ? (
                      <ToggleRight className="w-14 h-9 text-blue-600 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-14 h-9 text-slate-300 cursor-pointer" />
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${metrics.isAutoPayout ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {metrics.isAutoPayout ? "AKTIF" : "MANUAL"}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {metrics.isAutoPayout ? (
                      <span>Sistem pencairan bonus saat ini dalam mode <strong>OTOMATIS (Instant Payout)</strong>. Setiap permintaan penarikan (WD) dari member premium yang diajukan akan divalidasi oleh gerbang bank/gateway dan dana dikirim langsung ke rekening mereka secara real-time.</span>
                    ) : (
                      <span>Sistem pencairan bonus saat ini dalam mode <strong>MANUAL (Persetujuan Admin)</strong>. Setiap permintaan penarikan (WD) akan masuk ke tab antrean "Pencairan Bonus (WD)" dan memerlukan persetujuan serta transfer manual dari pihak Admin.</span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* BRANDING CONFIGURATION FORM */}
              <form onSubmit={handleSaveSettingsSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="text-blue-600 w-5 h-5" /> Pengaturan Identitas Web & Kontak
                  </h3>
                  <p className="text-xs text-slate-500">Ubah nama branding web, logo navigasi, serta tautan kontak layanan member premium.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Nama Situs MLM</label>
                    <input
                      type="text"
                      required
                      value={formWebName}
                      onChange={(e) => setFormWebName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Logo Text Navigasi</label>
                    <input
                      type="text"
                      required
                      value={formLogoText}
                      onChange={(e) => setFormLogoText(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Nomor HP Kontak Admin (WA)</label>
                    <input
                      type="text"
                      required
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Email Layanan Pelanggan</label>
                    <input
                      type="email"
                      required
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* MIDTRANS CONFIGURATION */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                    <CreditCard className="text-blue-600 w-4.5 h-4.5" /> Integrasi API Gateway Midtrans (Otomatis)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Koneksikan akun Midtrans Anda agar sistem mendeteksi pembayaran QRIS & VA secara otomatis. Jika Server Key kosong, sistem akan menggunakan simulator otomatis.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Midtrans Merchant ID</label>
                      <input
                        type="text"
                        placeholder="Contoh: M123456"
                        value={formMidtransMerchantId}
                        onChange={(e) => setFormMidtransMerchantId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Midtrans Client Key</label>
                      <input
                        type="text"
                        placeholder="Contoh: SB-Mid-client-..."
                        value={formMidtransClientKey}
                        onChange={(e) => setFormMidtransClientKey(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Midtrans Server Key</label>
                      <input
                        type="password"
                        placeholder="Contoh: SB-Mid-server-..."
                        value={formMidtransServerKey}
                        onChange={(e) => setFormMidtransServerKey(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Environment Mode</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="midtransMode"
                            checked={!formMidtransIsProduction}
                            onChange={() => setFormMidtransIsProduction(false)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Sandbox (Testing / Development)
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="midtransMode"
                            checked={formMidtransIsProduction}
                            onChange={() => setFormMidtransIsProduction(true)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Production (Live Payments)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                    <Percent className="text-blue-600 w-4.5 h-4.5" /> Konfigurasi Persentase & Tarif MLM Bonus
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Atur tarif rupiah seluruh komisi sponsor, pasangan binary, repeat order, dan level jaringan 10 tingkat.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Bonus Sponsor langsung (IDR)</label>
                      <input
                        type="number"
                        required
                        value={formSponsorBonus}
                        onChange={(e) => setFormSponsorBonus(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Bonus Pairing Kaki (IDR)</label>
                      <input
                        type="number"
                        required
                        value={formPairingBonus}
                        onChange={(e) => setFormPairingBonus(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Bonus Repeat Order (RO) (IDR)</label>
                      <input
                        type="number"
                        required
                        value={formRoBonus}
                        onChange={(e) => setFormRoBonus(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Level Bonuses */}
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Komisi Level Generasi Jaringan (10 Level)</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 1 (G1)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG1}
                          onChange={(e) => setFormLevelBonusG1(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 2 (G2)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG2}
                          onChange={(e) => setFormLevelBonusG2(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 3 (G3)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG3}
                          onChange={(e) => setFormLevelBonusG3(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 4 (G4)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG4}
                          onChange={(e) => setFormLevelBonusG4(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 5 (G5)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG5}
                          onChange={(e) => setFormLevelBonusG5(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 6 (G6)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG6}
                          onChange={(e) => setFormLevelBonusG6(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 7 (G7)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG7}
                          onChange={(e) => setFormLevelBonusG7(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 8 (G8)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG8}
                          onChange={(e) => setFormLevelBonusG8(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 9 (G9)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG9}
                          onChange={(e) => setFormLevelBonusG9(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Gen 10 (G10)</label>
                        <input
                          type="number"
                          required
                          value={formLevelBonusG10}
                          onChange={(e) => setFormLevelBonusG10(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* REWARD TARGET */}
                  <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Skema Pencapaian Target Reward Jaringan</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Target Kiri (Unit)</label>
                        <input
                          type="number"
                          required
                          value={formRewardThresholdLeft}
                          onChange={(e) => setFormRewardThresholdLeft(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Target Kanan (Unit)</label>
                        <input
                          type="number"
                          required
                          value={formRewardThresholdRight}
                          onChange={(e) => setFormRewardThresholdRight(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[9px] font-bold text-slate-500 block">Nama Hadiah Reward</label>
                        <input
                          type="text"
                          required
                          value={formRewardName}
                          onChange={(e) => setFormRewardName(e.target.value)}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[9px] font-bold text-slate-500 block">Nilai Equivalen Hadiah (Rupiah Cash)</label>
                        <input
                          type="number"
                          required
                          value={formRewardCashEquivalent}
                          onChange={(e) => setFormRewardCashEquivalent(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONFIGURATION: EMAIL REGISTER NOTIFICATION */}
                  <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Settings className="text-blue-600 w-5 h-5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pengaturan Notifikasi Email Pendaftaran Member</p>
                        <p className="text-[10px] text-slate-400 font-medium">Aktifkan notifikasi pendaftaran instan via email & konfigurasi server SMTP pengirim.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active Status Switches */}
                      <div className="space-y-3 p-3 bg-white border border-slate-100 rounded-xl">
                        <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Aktivasi Notifikasi</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-700">Kirim Email ke Administrator</p>
                            <p className="text-[9px] text-slate-400">Notifikasi pendaftaran setiap kali ada member baru mendaftar.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormEmailNotifAdminActive(!formEmailNotifAdminActive)}
                            className="text-xs font-bold text-slate-600 focus:outline-none"
                          >
                            {formEmailNotifAdminActive ? (
                              <ToggleRight className="w-11 h-7 text-blue-600 cursor-pointer" />
                            ) : (
                              <ToggleLeft className="w-11 h-7 text-slate-300 cursor-pointer" />
                            )}
                          </button>
                        </div>

                        {formEmailNotifAdminActive && (
                          <div className="space-y-1 pt-1.5 border-t border-slate-100">
                            <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Alamat Email Administrator</label>
                            <input
                              type="email"
                              required={formEmailNotifAdminActive}
                              value={formAdminNotifEmail}
                              onChange={(e) => setFormAdminNotifEmail(e.target.value)}
                              placeholder="admin@example.com"
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-3 bg-white border border-slate-100 rounded-xl">
                        <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Aktivasi Notifikasi Sponsor</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-700">Kirim Email ke Sponsor</p>
                            <p className="text-[9px] text-slate-400">Notifikasi langsung ke sponsor bahwa referral barunya terdaftar.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormEmailNotifSponsorActive(!formEmailNotifSponsorActive)}
                            className="text-xs font-bold text-slate-600 focus:outline-none"
                          >
                            {formEmailNotifSponsorActive ? (
                              <ToggleRight className="w-11 h-7 text-blue-600 cursor-pointer" />
                            ) : (
                              <ToggleLeft className="w-11 h-7 text-slate-300 cursor-pointer" />
                            )}
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          Email akan dikirim secara otomatis ke alamat email yang terdaftar di akun sponsor masing-masing.
                        </p>
                      </div>

                      {/* SMTP Configuration Credentials */}
                      <div className="md:col-span-2 space-y-3 p-4 bg-white border border-slate-100 rounded-xl">
                        <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Kredensial Server Pengirim (SMTP Server)</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 block">SMTP Host</label>
                            <input
                              type="text"
                              required
                              value={formSmtpHost}
                              onChange={(e) => setFormSmtpHost(e.target.value)}
                              placeholder="smtp.gmail.com"
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 block">SMTP Port</label>
                            <input
                              type="number"
                              required
                              value={formSmtpPort}
                              onChange={(e) => setFormSmtpPort(Number(e.target.value))}
                              placeholder="587"
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 block">Nama Pengirim (Sender Name)</label>
                            <input
                              type="text"
                              required
                              value={formEmailSenderName}
                              onChange={(e) => setFormEmailSenderName(e.target.value)}
                              placeholder="Zalora Denim Premium MLM"
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-500 block">Username / Email SMTP</label>
                            <input
                              type="text"
                              required
                              value={formSmtpUser}
                              onChange={(e) => setFormSmtpUser(e.target.value)}
                              placeholder="notifikasi@example.com"
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 block">Sandi / App Password SMTP</label>
                            <input
                              type="password"
                              required
                              value={formSmtpPass}
                              onChange={(e) => setFormSmtpPass(e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Welcome Register Email Template */}
                      <div className="md:col-span-2 space-y-3 p-4 bg-white border border-slate-100 rounded-xl">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Kerangka Email Pembuka (Welcome Email Template)</p>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">Format HTML Diizinkan</span>
                        </div>
                        <div className="space-y-1.5">
                          <textarea
                            rows={5}
                            value={formWelcomeEmailTemplate}
                            onChange={(e) => setFormWelcomeEmailTemplate(e.target.value)}
                            placeholder="Halo [NAME], Selamat datang di [WEB_NAME]! Akun Anda [USERNAME] berhasil didaftarkan..."
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] text-slate-500 font-bold">Variabel Dinamis:</span>
                            {['[NAME]', '[USERNAME]', '[SPONSOR]', '[WEB_NAME]', '[WA_CONTACT]'].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setFormWelcomeEmailTemplate(formWelcomeEmailTemplate + ' ' + v)}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    id="btn-submit-save-settings"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition text-xs shadow-md cursor-pointer"
                  >
                    💾 Simpan Semua Pengaturan Sistem
                  </button>
                </div>
              </form>

              {/* PRODUCT ADDITION SECTION */}
              <form onSubmit={handleAddProductSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PlusCircle className="text-green-600 w-5 h-5" /> Tambah Produk Celana Jeans Baru & Bonusnya
                  </h3>
                  <p className="text-xs text-slate-500">Mendaftarkan tipe produk celana jeans baru ke dalam daftar e-commerce dan seting bonus yang didapatkan dari pembelanjaannya.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Nama Model Produk Jeans</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Jeans Slim Fit Vintage Blue"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">URL Gambar Produk</label>
                    <input
                      type="text"
                      required
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Harga Umum Retail (IDR)</label>
                      <input
                        type="number"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Harga Member Premium (IDR)</label>
                      <input
                        type="number"
                        required
                        value={newProdMemberPrice}
                        onChange={(e) => setNewProdMemberPrice(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none text-blue-600 font-extrabold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Stok Awal Gudang (Pcs)</label>
                      <input
                        type="number"
                        required
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Deskripsi Produk Celana Jeans</label>
                    <textarea
                      rows={2}
                      required
                      value={newProdDescription}
                      onChange={(e) => setNewProdDescription(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    id="btn-submit-add-product"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition text-xs shadow-md cursor-pointer"
                  >
                    ➕ Tambah Produk & Publikasikan
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB: PROFILE MENU */}
          {activeTab === 'profil' && (
            <div className="space-y-6" id="admin-profile-panel">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="text-blue-600 w-5 h-5" /> Pengaturan Profil Admin
                  </h3>
                  <p className="text-xs text-slate-500">Kelola informasi nama lengkap, email resmi, nomor WA, serta verifikasi profil administrator Anda.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Nama Lengkap Admin</label>
                      <input
                        type="text"
                        required
                        value={profileFullname}
                        onChange={(e) => setProfileFullname(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Alamat Email Resmi</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Nomor HP / WhatsApp</label>
                      <input
                        type="text"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-blue-600"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Verifikasi Kata Sandi Saat Ini</label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan sandi Anda saat ini untuk menyimpan perubahan profil"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full max-w-md border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono bg-white"
                    />
                    <p className="text-[10px] text-slate-400">Keamanan ekstra: Diperlukan kata sandi aktif untuk mengubah parameter profil utama admin.</p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      id="btn-submit-save-profile"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md cursor-pointer"
                    >
                      💾 Simpan Profil Admin
                    </button>
                  </div>
                </form>
              </div>

              {/* PASSWORD RESET FORM */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="text-red-600 w-5 h-5" /> Reset Kata Sandi Baru
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Lakukan penggantian kata sandi secara periodik untuk menjaga integritas dan keamanan dashboard admin.</p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kata Sandi Lama / Saat Ini</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Konfirmasi Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ulangi sandi baru"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      id="btn-submit-reset-password"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md cursor-pointer"
                    >
                      🔒 Perbarui Kata Sandi Admin
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
