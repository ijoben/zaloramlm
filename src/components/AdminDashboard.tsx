import React, { useState } from "react";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest } from "../types";
import { 
  Shield, Users, DollarSign, Package, TrendingUp, HelpCircle, 
  CheckCircle, XCircle, Settings, ToggleLeft, ToggleRight, Edit, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, BarChart2, Search, Percent,
  Globe, PlusCircle, Check, X, ArrowDown, CreditCard, Menu, User, Lock, LogOut, Upload, Trash2, Eye, Sparkles
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
  onUpdateProduct?: (product: Product) => Promise<boolean>;
  onDeleteProduct?: (productId: number) => Promise<boolean>;
  onProcessWithdrawal: (wdId: number, action: 'approve' | 'reject') => Promise<void>;
  onProcessDeposit?: (depositId: number, action: 'approve' | 'reject') => Promise<void>;
  onAddProduct?: (prodData: Omit<Product, "id">) => Promise<boolean>;
  onUpdateProfile?: (data: { 
    fullname: string; 
    email: string; 
    phone: string; 
    whatsapp?: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder?: string;
    address?: string;
    city?: string;
    password?: string 
  }) => Promise<boolean>;
  onResetPassword?: (currentPass: string, newPass: string) => Promise<boolean>;
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
  onUpdateProduct,
  onDeleteProduct,
  onProcessWithdrawal,
  onProcessDeposit,
  onAddProduct,
  onUpdateProfile,
  onResetPassword,
  onToggleAutoPayout,
  settings,
  onUpdateSettings,
  onRefreshProducts
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'financials' | 'withdrawals' | 'deposits' | 'members' | 'products' | 'settings' | 'landing-editor' | 'profil'>('financials');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Product edit & modal states
  const [editingModalProduct, setEditingModalProduct] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // User search query
  const [searchQuery, setSearchQuery] = useState('');

  // Status logs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Web and MLM configuration states
  const [formWebName, setFormWebName] = useState(settings?.webName || 'Hedtro Jeans Official');
  const [formLogoText, setFormLogoText] = useState(settings?.logoText || 'HEDTRO.JEANS');
  const [formMemberIdPrefix, setFormMemberIdPrefix] = useState(settings?.memberIdPrefix || 'HDT-');
  const [formLogoUrl, setFormLogoUrl] = useState(settings?.logoUrl || '');
  const [formIconUrl, setFormIconUrl] = useState(settings?.iconUrl || '');
  const [formSlogan, setFormSlogan] = useState(settings?.slogan || 'OFFICIAL STORE & AFILIASI RESELLER');
  const [formSiteDescription, setFormSiteDescription] = useState(settings?.siteDescription || 'Pusat Toko Official Celana Jeans Denim Premium & Sistem Bisnis Afiliasi Reseller Terpercaya.');
  const [formEnableMlmBonus, setFormEnableMlmBonus] = useState(settings?.enableMlmBonus ?? true);
  const [formEnableLevelBonus, setFormEnableLevelBonus] = useState(settings?.enableLevelBonus ?? true);
  const [formEnableRewardBonus, setFormEnableRewardBonus] = useState(settings?.enableRewardBonus ?? true);
  const [formContactPhone, setFormContactPhone] = useState(settings?.contactPhone || '');
  const [formContactEmail, setFormContactEmail] = useState(settings?.contactEmail || '');

  // Landing Page CMS Content states
  const [formHeroBadge, setFormHeroBadge] = useState(settings?.heroBadge || 'PORTAL MEMBER & RESELLER RESMI');
  const [formHeroTitle, setFormHeroTitle] = useState(settings?.heroTitle || 'Celana Jeans Premium HEDTRO JEANS Dengan System Afiliasi Terbaik');
  const [formHeroSubtitle, setFormHeroSubtitle] = useState(settings?.heroSubtitle || 'Dapatkan komisi sponsor, komisi pasangan, bonus kedalaman level generasi, dan repeat order secara otomatis dengan bergabung sebagai member resmi.');
  const [formHeroCtaText, setFormHeroCtaText] = useState(settings?.heroCtaText || 'DAFTAR SEKARANG - RP 550.000');
  const [formPromoTitle, setFormPromoTitle] = useState(settings?.promoTitle || 'Daftar Member Rp 550.000, Gratis 1 Pcs Jeans Perdana!');
  const [formPromoSubtitle, setFormPromoSubtitle] = useState(settings?.promoSubtitle || 'Tanpa biaya tersembunyi. Langsung dapat produk jeans kualitas export senilai Rp 550.000 dan akun portal afiliasi aktif.');
  const [formFeaturesTitle, setFormFeaturesTitle] = useState(settings?.featuresTitle || 'Keunggulan Sistem Afiliasi Hedtro Jeans');
  const [formFeaturesSubtitle, setFormFeaturesSubtitle] = useState(settings?.featuresSubtitle || 'Didesain transparan, cepat, dan menguntungkan untuk seluruh reseller dan jaringan member.');
  const [formAboutTitle, setFormAboutTitle] = useState(settings?.aboutTitle || 'Mengapa Bergabung Dengan HEDTRO JEANS?');
  const [formAboutContent, setFormAboutContent] = useState(settings?.aboutContent || 'Kami memproduksi celana jeans denim kualitas terbaik dengan bahan premium stretch comfort dan jahitan presisi standar ekspor.');
  const [formCatalogTitle, setFormCatalogTitle] = useState(settings?.catalogTitle || 'Katalog Produk Pilihan Hedtro Jeans');
  const [formCatalogSubtitle, setFormCatalogSubtitle] = useState(settings?.catalogSubtitle || 'Produk fashion jeans pria & wanita paling laris untuk Repeat Order (RO).');
  const [formFaqTitle, setFormFaqTitle] = useState(settings?.faqTitle || 'Pertanyaan Yang Sering Diajukan (FAQ)');
  const [formFooterAbout, setFormFooterAbout] = useState(settings?.footerAbout || 'Hedtro Jeans adalah brand fashion jeans lokal kualitas premium yang mengusung sistem bisnis afiliasi dan reseller berjenjang secara adil dan transparan.');

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
  const [formAdminNotifEmail, setFormAdminNotifEmail] = useState(settings?.adminNotifEmail || 'admin@hedtrojeans.com');
  const [formSmtpHost, setFormSmtpHost] = useState(settings?.smtpHost || 'smtp.gmail.com');
  const [formSmtpPort, setFormSmtpPort] = useState(settings?.smtpPort || 587);
  const [formSmtpUser, setFormSmtpUser] = useState(settings?.smtpUser || 'notifikasi@hedtrojeans.com');
  const [formSmtpPass, setFormSmtpPass] = useState(settings?.smtpPass || 'app-password-1234');
  const [formEmailSenderName, setFormEmailSenderName] = useState(settings?.emailSenderName || 'Hedtro Jeans Official');
  const [formWelcomeEmailTemplate, setFormWelcomeEmailTemplate] = useState(settings?.welcomeEmailTemplate || '');

  // Admin Profile & Password Form states
  const [profileFullname, setProfileFullname] = useState(user?.fullname || 'Admin Utama');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@hedtrojeans.com');
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
      setFormLogoUrl(settings.logoUrl || '');
      setFormIconUrl(settings.iconUrl || '');
      setFormSlogan(settings.slogan || 'OFFICIAL STORE & MLM BINARY PREMIER');
      setFormSiteDescription(settings.siteDescription || 'Pusat Toko Official Celana Jeans Denim Premium & Sistem Bisnis MLM Binary 10 Level Terpercaya.');
      setFormEnableMlmBonus(settings.enableMlmBonus ?? true);
      setFormEnableLevelBonus(settings.enableLevelBonus ?? true);
      setFormEnableRewardBonus(settings.enableRewardBonus ?? true);
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
      setFormAdminNotifEmail(settings.adminNotifEmail || 'admin@hedtrojeans.com');
      setFormSmtpHost(settings.smtpHost || 'smtp.gmail.com');
      setFormSmtpPort(settings.smtpPort ?? 587);
      setFormSmtpUser(settings.smtpUser || 'notifikasi@hedtrojeans.com');
      setFormSmtpPass(settings.smtpPass || 'app-password-1234');
      setFormEmailSenderName(settings.emailSenderName || 'HEDTRO JEANS Official');
      setFormWelcomeEmailTemplate(settings.welcomeEmailTemplate || '');

      setFormHeroBadge(settings.heroBadge || 'PORTAL MEMBER & RESELLER RESMI');
      setFormHeroTitle(settings.heroTitle || 'Celana Jeans Premium HEDTRO JEANS Dengan System Afiliasi Terbaik');
      setFormHeroSubtitle(settings.heroSubtitle || 'Dapatkan komisi sponsor, komisi pasangan, bonus kedalaman level generasi, dan repeat order secara otomatis dengan bergabung sebagai member resmi.');
      setFormHeroCtaText(settings.heroCtaText || 'DAFTAR SEKARANG - RP 550.000');
      setFormPromoTitle(settings.promoTitle || 'Daftar Member Rp 550.000, Gratis 1 Pcs Jeans Perdana!');
      setFormPromoSubtitle(settings.promoSubtitle || 'Tanpa biaya tersembunyi. Langsung dapat produk jeans kualitas export senilai Rp 550.000 dan akun portal afiliasi aktif.');
      setFormFeaturesTitle(settings.featuresTitle || 'Keunggulan Sistem Afiliasi Hedtro Jeans');
      setFormFeaturesSubtitle(settings.featuresSubtitle || 'Didesain transparan, cepat, dan menguntungkan untuk seluruh reseller dan jaringan member.');
      setFormAboutTitle(settings.aboutTitle || 'Mengapa Bergabung Dengan HEDTRO JEANS?');
      setFormAboutContent(settings.aboutContent || 'Kami memproduksi celana jeans denim kualitas terbaik dengan bahan premium stretch comfort dan jahitan presisi standar ekspor.');
      setFormCatalogTitle(settings.catalogTitle || 'Katalog Produk Pilihan Hedtro Jeans');
      setFormCatalogSubtitle(settings.catalogSubtitle || 'Produk fashion jeans pria & wanita paling laris untuk Repeat Order (RO).');
      setFormFaqTitle(settings.faqTitle || 'Pertanyaan Yang Sering Diajukan (FAQ)');
      setFormFooterAbout(settings.footerAbout || 'Hedtro Jeans adalah brand fashion jeans lokal kualitas premium yang mengusung sistem bisnis afiliasi dan reseller berjenjang secara adil dan transparan.');
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
      if (onProcessDeposit) {
        await onProcessDeposit(depositId, action);
        setMessage({ text: "Berhasil memproses deposit!", type: "success" });
        onRefresh();
      } else {
        const res = await fetch("/api/admin/deposit/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ depositId, action })
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          setMessage({ text: "Berhasil memproses deposit!", type: "success" });
          onRefresh();
        } else {
          setMessage({ text: "Deposit diproses!", type: "success" });
          onRefresh();
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal memproses deposit", type: "error" });
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
      const prodData = {
        name: newProdName,
        image: newProdImage,
        price: Number(newProdPrice),
        member_price: Number(newProdMemberPrice),
        stock: Number(newProdStock),
        description: newProdDescription
      };

      if (onAddProduct) {
        await onAddProduct(prodData);
        setMessage({ text: "Produk baru berhasil ditambahkan!", type: "success" });
        setNewProdName('');
        setNewProdPrice(150000);
        setNewProdMemberPrice(120000);
        setNewProdStock(100);
        setIsAddProductModalOpen(false);
        if (onRefreshProducts) onRefreshProducts();
        onRefresh();
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prodData)
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          setMessage({ text: "Produk baru berhasil ditambahkan!", type: "success" });
          setNewProdName('');
          setIsAddProductModalOpen(false);
          if (onRefreshProducts) onRefreshProducts();
          onRefresh();
        } else {
          setMessage({ text: "Produk berhasil ditambahkan ke database!", type: "success" });
          setIsAddProductModalOpen(false);
          if (onRefreshProducts) onRefreshProducts();
          onRefresh();
        }
      }
    } catch (err) {
      setMessage({ text: "Gagal menyambung ke server", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Ukuran file maksimal 3MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSettings) return;
    setLoading(true);
    const success = await onUpdateSettings({
      webName: formWebName,
      logoText: formLogoText,
      memberIdPrefix: formMemberIdPrefix,
      logoUrl: formLogoUrl,
      iconUrl: formIconUrl,
      slogan: formSlogan,
      siteDescription: formSiteDescription,
      enableMlmBonus: formEnableMlmBonus,
      enableLevelBonus: formEnableLevelBonus,
      enableRewardBonus: formEnableRewardBonus,
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
      welcomeEmailTemplate: formWelcomeEmailTemplate,
      heroBadge: formHeroBadge,
      heroTitle: formHeroTitle,
      heroSubtitle: formHeroSubtitle,
      heroCtaText: formHeroCtaText,
      promoTitle: formPromoTitle,
      promoSubtitle: formPromoSubtitle,
      featuresTitle: formFeaturesTitle,
      featuresSubtitle: formFeaturesSubtitle,
      aboutTitle: formAboutTitle,
      aboutContent: formAboutContent,
      catalogTitle: formCatalogTitle,
      catalogSubtitle: formCatalogSubtitle,
      faqTitle: formFaqTitle,
      footerAbout: formFooterAbout
    });
    if (success) {
      setMessage({ text: "Semua konfigurasi Web, skema bonus MLM, kredensial Midtrans, notifikasi email, dan konten Landing Page berhasil disimpan!", type: "success" });
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
      if (onUpdateProfile) {
        await onUpdateProfile({
          fullname: profileFullname,
          email: profileEmail,
          phone: profilePhone,
          ...(profilePassword ? { password: profilePassword } : {})
        });
        setProfilePassword('');
        setMessage({ text: "Profil Anda berhasil diperbarui!", type: "success" });
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
          setMessage({ text: "Profil Anda berhasil diperbarui!", type: "success" });
          onRefresh();
        } else {
          setMessage({ text: "Profil Anda berhasil diperbarui!", type: "success" });
        }
      }
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
      if (onResetPassword) {
        await onResetPassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setMessage({ text: "Kata sandi Anda berhasil diperbarui!", type: "success" });
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
          setMessage({ text: "Kata sandi Anda berhasil diperbarui!", type: "success" });
          onRefresh();
        } else {
          setMessage({ text: "Kata sandi Anda berhasil diperbarui!", type: "success" });
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mereset kata sandi", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleProductEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingModalProduct) return;
    setLoading(true);
    try {
      if (onUpdateProduct) {
        await onUpdateProduct(editingModalProduct);
      } else {
        await onUpdateProductStock(editingModalProduct.id, editingModalProduct.stock, editingModalProduct.price, editingModalProduct.member_price);
      }
      setEditingModalProduct(null);
      setMessage({ text: "Detail produk dan stok berhasil diperbarui di database!", type: "success" });
      if (onRefreshProducts) onRefreshProducts();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mengupdate produk", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProductSubmit = async () => {
    if (!deletingProduct) return;
    setLoading(true);
    try {
      if (onDeleteProduct) {
        await onDeleteProduct(deletingProduct.id);
        setMessage({ text: `Produk "${deletingProduct.name}" berhasil dihapus dari katalog!`, type: "success" });
      } else {
        setMessage({ text: "Fitur hapus tidak tersedia di server ini.", type: "error" });
      }
      setDeletingProduct(null);
      if (onRefreshProducts) onRefreshProducts();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus produk", type: "error" });
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

  const memberUsers = (users || []).filter(u => (u.username || '').toLowerCase() !== 'admin' && Number(u.id) !== 1);
  const displayList = memberUsers.length > 0 ? memberUsers : (users || []);

  const filteredUsers = displayList.filter(u => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    const un = (u.username || '').toLowerCase();
    const fn = (u.fullname || '').toLowerCase();
    const em = (u.email || '').toLowerCase();
    const ph = (u.phone || '').toLowerCase();
    return un.includes(q) || fn.includes(q) || em.includes(q) || ph.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900" id="admin-dashboard-root">
      {/* Brand Header */}
      <header className="bg-[#111111] text-white h-16 px-4 sm:px-6 flex items-center justify-between shadow-lg sticky top-0 z-40 border-b border-neutral-800" id="admin-header">
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings?.webName || "Logo"} className="h-8 max-w-[160px] object-contain shrink-0" />
          ) : (
            <div className="bg-[#C41230] text-white font-black font-display text-sm sm:text-base tracking-tighter px-3 py-1 rounded-b-md shadow-md uppercase border-t-2 border-red-800 shrink-0">
              {settings?.logoText || "HEDTRO.JEANS"}
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-widest text-neutral-300">
            ADMIN PORTAL
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="p-1.5 bg-[#C41230]/20 text-red-400 border border-[#C41230]/30">
              <Shield className="w-4 h-4" />
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-neutral-100 leading-none">Sistem Admin</p>
              <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-wider font-semibold">ADMINISTRATOR PERUSAHAAN</p>
            </div>
          </div>
          <button 
            id="admin-btn-logout"
            onClick={onLogout} 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#C41230]/20 hover:bg-[#C41230]/30 text-red-400 border border-[#C41230]/30 rounded-none transition font-black text-xs uppercase tracking-wider"
            title="Keluar dari Aplikasi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
          
          <button 
            id="admin-burger-btn"
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
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
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt={settings?.webName || "Logo"} className="h-8 max-w-[160px] object-contain shrink-0" />
                  ) : (
                    <span className="text-lg font-display font-black tracking-tight text-white">
                      {settings?.logoText || "HEDTRO"}<span className="text-blue-500 font-light">.ADMIN</span>
                    </span>
                  )}
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
                  id="admin-tab-landing-editor-mobile"
                  onClick={() => { setActiveTab('landing-editor'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'landing-editor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Edit className="w-4 h-4" /> Edit Tulisan Landing Page
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
          <nav className="bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-xl space-y-1">
            <button
              id="admin-tab-financials"
              onClick={() => setActiveTab('financials')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'financials' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Laporan Laba Rugi</span>
            </button>

            <button
              id="admin-tab-withdrawals"
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'members' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Manajemen Jaringan</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeTab === 'members' ? 'bg-blue-500/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {metrics.totalMembers} org
              </span>
            </button>

            <button
              id="admin-tab-products"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'products' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Gudang & Stok Jeans</span>
            </button>

            <button
              id="admin-tab-landing-editor"
              onClick={() => setActiveTab('landing-editor')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'landing-editor' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Edit className="w-4 h-4" />
              <span>Edit Tulisan Landing Page</span>
            </button>

            <button
              id="admin-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Seting Web & MLM Bonus</span>
            </button>

            <button
              id="admin-tab-profil"
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil Saya & Sandi</span>
            </button>

            <div className="pt-2 border-t border-slate-800">
              <button
                id="admin-sidebar-btn-logout"
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
                    <strong className="text-white">Rp {(metrics.activeMembers * 550000).toLocaleString()}</strong>
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
                          <td className="py-3 px-4 font-bold text-slate-800">{tx.username.replace(/^@/, '')}</td>
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
                          <td className="py-3.5 px-4 font-bold text-slate-800">{wd.username.replace(/^@/, '')}</td>
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
                      <th className="py-3 px-4">Upline & Sponsor</th>
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
                        <td colSpan={9} className="py-8 text-center text-slate-400">Tidak ada data anggota ditemukan</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const totalBonus = (u.sponsor_bonus || 0) + (u.pairing_bonus || 0) + (u.level_bonus || 0) + (u.ro_bonus || 0);
                        const uplineUser = (users || []).find(x => Number(x.id) === Number(u.upline_id));
                        const sponsorUser = (users || []).find(x => Number(x.id) === Number(u.sponsor_id));
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-mono text-slate-400">#{u.id}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900 leading-tight">
                              {u.fullname || u.username}
                              <span className="block text-[9px] text-slate-400 font-normal">Daftar: {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}</span>
                            </td>
                            <td className="py-3.5 px-4 leading-normal">
                              <span className="font-bold text-blue-600 block">{u.username.replace(/^@/, '')}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{u.phone || '-'}</span>
                            </td>
                            <td className="py-3.5 px-4 leading-normal">
                              <div className="text-[10px] text-slate-700 font-medium">
                                <span className="font-bold text-slate-900 block">
                                  Upline: {uplineUser ? uplineUser.username.replace(/^@/, '') : 'Root'} <span className="text-blue-600 font-extrabold">({u.position || 'L'})</span>
                                </span>
                                <span className="text-slate-500 block">
                                  Sponsor: {sponsorUser ? sponsorUser.username.replace(/^@/, '') : '-'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {u.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700">
                              {u.left_count || 0} L / {u.right_count || 0} R
                            </td>
                            <td className="py-3.5 px-4 text-center font-black font-mono text-slate-900">
                              {u.left_sales || 0} L / {u.right_sales || 0} R
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-950">
                              Rp {(u.balance || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-green-600">
                              Rp {totalBonus.toLocaleString('id-ID')}
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

          {/* TAB 4: WAREHOUSE & STOCK CONTROLS (COMPACT TABLE & POPUP CRUD) */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="admin-products-panel">
              {/* Header & Quick Action */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="text-blue-600 w-5 h-5" /> Manajemen Stok Gudang & Katalog Produk
                  </h3>
                  <p className="text-xs text-slate-500">Tampilan ringkas & cepat untuk kelola inventoris, harga retail, harga khusus member premium, dan stok barang.</p>
                </div>
                
                <button
                  id="btn-open-add-product-modal"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Produk Baru
                </button>
              </div>

              {/* Summary Metrics & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Variasi</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{products.length} Tipe Varian</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Stok Fisik</p>
                  <p className="text-lg font-black text-blue-600 mt-0.5">{products.reduce((a, b) => a + (b.stock || 0), 0)} Pcs</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama produk..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full h-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Compact Product Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Produk & Model</th>
                      <th className="py-3 px-4 text-right">Harga Retail</th>
                      <th className="py-3 px-4 text-right">Harga Member</th>
                      <th className="py-3 px-4 text-center">Stok Gudang</th>
                      <th className="py-3 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter(p => !productSearchQuery || p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img referrerPolicy="no-referrer" src={p.image} className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100" alt={p.name} />
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-900 truncate max-w-[220px]">{p.name}</h4>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-[250px]">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            Rp {p.price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-blue-600">
                            Rp {p.member_price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.stock > 10 ? 'bg-green-100 text-green-800 border border-green-200' :
                              p.stock > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {p.stock > 0 ? `${p.stock} Pcs` : 'Stok Habis'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                id={`btn-edit-popup-product-${p.id}`}
                                onClick={() => setEditingModalProduct({ ...p })}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg transition border border-slate-200 cursor-pointer"
                                title="Edit Produk (Popup)"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-popup-product-${p.id}`}
                                onClick={() => setDeletingProduct(p)}
                                className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg transition border border-slate-200 cursor-pointer"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada data produk di gudang.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                            <p className="font-bold text-slate-950">{dep.username.replace(/^@/, '')}</p>
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

                  {/* Logo Depan Upload / URL */}
                  <div className="space-y-1.5 md:col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-extrabold uppercase text-slate-600 block">Logo Depan Website (Gambar Logo)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {formLogoUrl && (
                        <div className="w-16 h-12 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0">
                          <img src={formLogoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Tempel URL Logo (https://...) atau upload file di samping"
                        value={formLogoUrl}
                        onChange={(e) => setFormLogoUrl(e.target.value)}
                        className="flex-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 bg-white"
                      />
                      <label className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, setFormLogoUrl)}
                        />
                      </label>
                      {formLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormLogoUrl('')}
                          className="text-red-500 text-xs font-bold hover:underline shrink-0"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Icon / Favicon Upload / URL */}
                  <div className="space-y-1.5 md:col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-extrabold uppercase text-slate-600 block">Favicon / Icon Aplikasi</label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {formIconUrl && (
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0">
                          <img src={formIconUrl} alt="Icon Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Tempel URL Icon (https://...) atau upload file di samping"
                        value={formIconUrl}
                        onChange={(e) => setFormIconUrl(e.target.value)}
                        className="flex-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 bg-white"
                      />
                      <label className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, setFormIconUrl)}
                        />
                      </label>
                      {formIconUrl && (
                        <button
                          type="button"
                          onClick={() => setFormIconUrl('')}
                          className="text-red-500 text-xs font-bold hover:underline shrink-0"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slogan / Tagline */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Tag Slogan Depan</label>
                    <input
                      type="text"
                      required
                      value={formSlogan}
                      onChange={(e) => setFormSlogan(e.target.value)}
                      placeholder="Contoh: OFFICIAL STORE & MLM BINARY PREMIER"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Site Description */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Deskripsi Singkat Website / Toko</label>
                    <textarea
                      rows={2}
                      value={formSiteDescription}
                      onChange={(e) => setFormSiteDescription(e.target.value)}
                      placeholder="Jelaskan deskripsi resmi toko dan bisnis MLM Anda..."
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Prefix Awalan ID Member</label>
                    <input
                      type="text"
                      required
                      value={formMemberIdPrefix}
                      onChange={(e) => setFormMemberIdPrefix(e.target.value.toUpperCase().trim())}
                      placeholder="Contoh: HDT-, ZLR-, MBR-"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-emerald-600 bg-emerald-50/20"
                    />
                    <span className="text-[9px] text-slate-400">Digunakan untuk format otomatis ID Anggota (misal: HDT-000001)</span>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Percent className="text-blue-600 w-4.5 h-4.5" /> Konfigurasi Persentase & Tarif MLM Bonus
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sakelar utama untuk Mengaktifkan / Mematikan pembagian seluruh bonus MLM (Sponsor, Pairing, Level 10 Tier).
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        formEnableMlmBonus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {formEnableMlmBonus ? 'BONUS AKTIF' : 'BONUS NON-AKTIF'}
                      </span>
                      <button
                        type="button"
                        id="btn-toggle-mlm-bonus"
                        onClick={() => setFormEnableMlmBonus(!formEnableMlmBonus)}
                        className="transition text-slate-700 hover:text-blue-600"
                        title={formEnableMlmBonus ? "Matikan Bonus MLM" : "Aktifkan Bonus MLM"}
                      >
                        {formEnableMlmBonus ? (
                          <ToggleRight className="w-12 h-8 text-green-600 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="w-12 h-8 text-slate-400 cursor-pointer" />
                        )}
                      </button>
                    </div>
                  </div>

                  {!formEnableMlmBonus && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      <span>Sistem Pembagian Bonus MLM saat ini <strong>NON-AKTIF</strong>. Transaksi/aktifasi baru tidak akan menghasilkan komisi ke sponsor atau upline hingga dinyalakan kembali.</span>
                    </div>
                  )}
                  
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
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Komisi Level Generasi Jaringan (10 Level)</p>
                        <p className="text-[11px] text-slate-400">Sakelar pembagian bonus otomatis generasi 1 sampai 10</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          formEnableLevelBonus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {formEnableLevelBonus ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                        <button
                          type="button"
                          id="btn-toggle-level-bonus"
                          onClick={() => setFormEnableLevelBonus(!formEnableLevelBonus)}
                          className="transition text-slate-700 hover:text-blue-600"
                          title={formEnableLevelBonus ? "Matikan Bonus Level" : "Aktifkan Bonus Level"}
                        >
                          {formEnableLevelBonus ? (
                            <ToggleRight className="w-10 h-7 text-green-600 cursor-pointer" />
                          ) : (
                            <ToggleLeft className="w-10 h-7 text-slate-400 cursor-pointer" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 transition-opacity ${!formEnableLevelBonus ? 'opacity-40 pointer-events-none' : ''}`}>
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
                    <div className="flex items-center justify-between gap-3 border-b border-blue-100 pb-2">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Skema Pencapaian Target Reward Jaringan</p>
                        <p className="text-[11px] text-slate-500">Sakelar perhitungan & klaim reward pencapaian jaringan Kiri / Kanan</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          formEnableRewardBonus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {formEnableRewardBonus ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                        <button
                          type="button"
                          id="btn-toggle-reward-bonus"
                          onClick={() => setFormEnableRewardBonus(!formEnableRewardBonus)}
                          className="transition text-slate-700 hover:text-blue-600"
                          title={formEnableRewardBonus ? "Matikan Reward Jaringan" : "Aktifkan Reward Jaringan"}
                        >
                          {formEnableRewardBonus ? (
                            <ToggleRight className="w-10 h-7 text-green-600 cursor-pointer" />
                          ) : (
                            <ToggleLeft className="w-10 h-7 text-slate-400 cursor-pointer" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 transition-opacity ${!formEnableRewardBonus ? 'opacity-40 pointer-events-none' : ''}`}>
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
                              placeholder="Hedtro Jeans Official"
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

          {/* TAB: LANDING PAGE CMS EDITOR */}
          {activeTab === 'landing-editor' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Edit className="text-blue-600 w-6 h-6" /> Edit Semua Tulisan Landing Page
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Ubah teks banner hero, judul promo, deskripsi fitur, tentang brand, katalog, FAQ, dan footer secara real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettingsSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 self-start md:self-center shrink-0 cursor-pointer"
                >
                  💾 Simpan Perubahan Teks
                </button>
              </div>

              <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
                
                {/* 1. HERO HEADER BANNER */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" /> 1. Hero Header Banner (Tampilan Utama Belanja)
                    </h4>
                    <p className="text-xs text-slate-400">Tulisan banner paling atas saat pengunjung membuka web HEDTRO JEANS</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Badge / Label Atas Hero</label>
                      <input
                        type="text"
                        value={formHeroBadge}
                        onChange={(e) => setFormHeroBadge(e.target.value)}
                        placeholder="Contoh: PORTAL MEMBER & RESELLER RESMI"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Teks Tombol CTA Hero</label>
                      <input
                        type="text"
                        value={formHeroCtaText}
                        onChange={(e) => setFormHeroCtaText(e.target.value)}
                        placeholder="Contoh: DAFTAR SEKARANG - RP 550.000"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block">Judul Utama Hero (Heading 1)</label>
                      <input
                        type="text"
                        value={formHeroTitle}
                        onChange={(e) => setFormHeroTitle(e.target.value)}
                        placeholder="Contoh: Celana Jeans Premium HEDTRO JEANS Dengan System Afiliasi Terbaik"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block">Sub-Judul / Deskripsi Hero</label>
                      <textarea
                        rows={2}
                        value={formHeroSubtitle}
                        onChange={(e) => setFormHeroSubtitle(e.target.value)}
                        placeholder="Deskripsi singkat promo hero..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. PROMO & PAKET PERDANA */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" /> 2. Banner Promo & Lisensi Perdana
                    </h4>
                    <p className="text-xs text-slate-400">Penjelasan lisensi Rp 550.000 dan bonus 1 Pcs Jeans gratis</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Judul Promo Perdana</label>
                      <input
                        type="text"
                        value={formPromoTitle}
                        onChange={(e) => setFormPromoTitle(e.target.value)}
                        placeholder="Contoh: Daftar Member Rp 550.000, Gratis 1 Pcs Jeans Perdana!"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Deskripsi Promo Perdana</label>
                      <textarea
                        rows={2}
                        value={formPromoSubtitle}
                        onChange={(e) => setFormPromoSubtitle(e.target.value)}
                        placeholder="Penjelasan promo perdana..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. FITUR & KEUNGGULAN BISNIS */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" /> 3. Section Keunggulan Bisnis & System
                    </h4>
                    <p className="text-xs text-slate-400">Judul dan sub-judul section 4 pilar keunggulan bisnis</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Judul Section Keunggulan</label>
                      <input
                        type="text"
                        value={formFeaturesTitle}
                        onChange={(e) => setFormFeaturesTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Sub-Judul Keunggulan</label>
                      <input
                        type="text"
                        value={formFeaturesSubtitle}
                        onChange={(e) => setFormFeaturesSubtitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. TENTANG BRAND & TENTANG KAMI */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" /> 4. Section Tentang Kami & Kualitas Denim
                    </h4>
                    <p className="text-xs text-slate-400">Penjelasan profil brand, jaminan produk otentik, dan kualitas bahan</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Judul Tentang Kami</label>
                      <input
                        type="text"
                        value={formAboutTitle}
                        onChange={(e) => setFormAboutTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Konten Teks Tentang Kami</label>
                      <textarea
                        rows={3}
                        value={formAboutContent}
                        onChange={(e) => setFormAboutContent(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. KATALOG, FAQ & FOOTER */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-600" /> 5. Judul Katalog, FAQ & Deskripsi Footer
                    </h4>
                    <p className="text-xs text-slate-400">Pengaturan teks section katalog produk, FAQ, dan copyright footer</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Judul Section Katalog</label>
                      <input
                        type="text"
                        value={formCatalogTitle}
                        onChange={(e) => setFormCatalogTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Sub-Judul Katalog</label>
                      <input
                        type="text"
                        value={formCatalogSubtitle}
                        onChange={(e) => setFormCatalogSubtitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block">Judul Section FAQ</label>
                      <input
                        type="text"
                        value={formFaqTitle}
                        onChange={(e) => setFormFaqTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block">Deskripsi Footer (Atas Copyright)</label>
                      <textarea
                        rows={2}
                        value={formFooterAbout}
                        onChange={(e) => setFormFooterAbout(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-8 rounded-xl transition text-xs shadow-lg tracking-wider uppercase cursor-pointer"
                  >
                    💾 SIMPAN SEMUA TULISAN LANDING PAGE
                  </button>
                </div>

              </form>
            </div>
          )}

      {/* MODAL POPUP 1: EDIT PRODUCT */}
      {editingModalProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" /> Edit Detail Produk & Stok
              </h3>
              <button onClick={() => setEditingModalProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductEditSubmit} className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <img referrerPolicy="no-referrer" src={editingModalProduct.image} className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-white" alt="Preview" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Preview Gambar</p>
                  <input
                    type="text"
                    value={editingModalProduct.image}
                    onChange={(e) => setEditingModalProduct({ ...editingModalProduct, image: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 mt-1 bg-white font-mono"
                    placeholder="URL Gambar Produk"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nama Produk Celana Jeans</label>
                <input
                  type="text"
                  required
                  value={editingModalProduct.name}
                  onChange={(e) => setEditingModalProduct({ ...editingModalProduct, name: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Harga Retail (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingModalProduct.price}
                    onChange={(e) => setEditingModalProduct({ ...editingModalProduct, price: Number(e.target.value) })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-blue-600 block mb-1">Harga Member (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingModalProduct.member_price}
                    onChange={(e) => setEditingModalProduct({ ...editingModalProduct, member_price: Number(e.target.value) })}
                    className="w-full text-xs font-bold border border-blue-200 text-blue-600 rounded-xl px-3 py-2 bg-blue-50/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stok Gudang (Pcs)</label>
                  <input
                    type="number"
                    required
                    value={editingModalProduct.stock}
                    onChange={(e) => setEditingModalProduct({ ...editingModalProduct, stock: Number(e.target.value) })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={editingModalProduct.description}
                  onChange={(e) => setEditingModalProduct({ ...editingModalProduct, description: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POPUP 2: ADD PRODUCT */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" /> Tambah Produk Celana Jeans Baru
              </h3>
              <button onClick={() => setIsAddProductModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nama Model Celana Jeans</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jeans Slim Fit Vintage Blue"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">URL Gambar Produk</label>
                <input
                  type="text"
                  required
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Harga Retail</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-blue-600 block mb-1">Harga Member</label>
                  <input
                    type="number"
                    required
                    value={newProdMemberPrice}
                    onChange={(e) => setNewProdMemberPrice(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-blue-200 text-blue-600 rounded-xl px-3 py-2 bg-blue-50/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  required
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {loading ? "Menambahkan..." : "Tambah Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POPUP 3: CONFIRM DELETE PRODUCT */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Produk Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>"{deletingProduct.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteProductSubmit}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10 cursor-pointer"
              >
                {loading ? "Menghapus..." : "Ya, Hapus Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
    </div>
  );
}
