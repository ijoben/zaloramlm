import React, { useState, useRef } from "react";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, Order, OrderStep, HeroSlide } from "../types";
import { 
  Shield, Users, DollarSign, Package, TrendingUp, HelpCircle, 
  CheckCircle, XCircle, Settings, ToggleLeft, ToggleRight, Edit, Edit3,
  ArrowUpRight, ArrowDownLeft, RefreshCw, BarChart2, Search, Percent,
  Globe, PlusCircle, Plus, Check, X, ArrowDown, CreditCard, Menu, User, UserPlus, Lock, LogOut, Upload, Trash2, Eye, Sparkles, Truck, FileText, ChevronLeft, ChevronRight, AlertTriangle, Ban, Download, Camera
} from "lucide-react";
import WorkflowModal from "./WorkflowModal";

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
  orders?: Order[];
  onUpdateOrder?: (order: Order) => Promise<boolean>;
  onCreateOrder?: (orderData: Partial<Order>) => Promise<boolean>;
  onDeleteOrder?: (id: number | string) => Promise<boolean>;
  onRefresh: () => void;
  onLogout: () => void;
  onUpdateProductStock: (productId: number, stock: number, price: number, memberPrice: number) => Promise<void>;
  onUpdateProduct?: (product: Product) => Promise<boolean>;
  onDeleteProduct?: (productId: number) => Promise<boolean>;
  onProcessWithdrawal: (wdId: number, action: 'approve' | 'reject') => Promise<void>;
  onProcessDeposit?: (depositId: number, action: 'approve' | 'reject') => Promise<void>;
  onDeleteDeposit?: (depositId: number | string) => Promise<boolean>;
  onDeleteWithdrawal?: (wdId: number | string) => Promise<boolean>;
  onAddProduct?: (prodData: Omit<Product, "id">) => Promise<boolean>;
  onAddUser?: (userData: Partial<MLMUser>) => Promise<boolean>;
  onUpdateUserAdmin?: (userId: number, updateData: Partial<MLMUser>) => Promise<boolean>;
  onDeleteUserAdmin?: (userId: number) => Promise<boolean>;
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
  onResetCategory?: (category: 'members' | 'web_settings' | 'mlm_network' | 'sales') => Promise<boolean>;
  onRestoreCategory?: (category: 'members' | 'web_settings' | 'mlm_network' | 'sales', data: any) => Promise<boolean>;
}

const PaginationControls = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-4 border-t border-slate-200/80 text-xs text-slate-600">
      <div className="text-[11px] font-medium text-slate-500">
        Menampilkan <strong className="font-bold text-slate-900">{startItem} - {endItem}</strong> dari <strong className="font-bold text-slate-900">{totalItems}</strong> data
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="px-3 py-1 font-extrabold text-blue-600 bg-blue-50 border border-blue-200/80 rounded-lg text-xs font-mono">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard({
  user,
  metrics,
  users,
  withdrawals,
  deposits,
  transactions,
  products,
  orders = [],
  onUpdateOrder,
  onCreateOrder,
  onDeleteOrder,
  onRefresh,
  onLogout,
  onUpdateProductStock,
  onUpdateProduct,
  onDeleteProduct,
  onProcessWithdrawal,
  onProcessDeposit,
  onDeleteDeposit,
  onDeleteWithdrawal,
  onAddProduct,
  onAddUser,
  onUpdateUserAdmin,
  onDeleteUserAdmin,
  onUpdateProfile,
  onResetPassword,
  onToggleAutoPayout,
  settings,
  onUpdateSettings,
  onRefreshProducts,
  onResetCategory,
  onRestoreCategory
}: AdminDashboardProps) {
  const getInitialAdminTab = (): 'financials' | 'withdrawals' | 'deposits' | 'members' | 'products' | 'orders' | 'settings' | 'landing-editor' | 'profil' => {
    try {
      const validTabs = ['financials', 'withdrawals', 'deposits', 'members', 'products', 'orders', 'settings', 'landing-editor', 'profil'];
      const rawHash = window.location.hash || '';
      const cleanHash = rawHash.replace(/^[#/]+/, '').split('?')[0].split('/')[0].trim();
      if (cleanHash && validTabs.includes(cleanHash)) {
        return cleanHash as any;
      }
      const saved = localStorage.getItem('admin_active_tab');
      if (saved && validTabs.includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'financials';
  };

  const getInitialSettingsSubTab = (): 'web' | 'mlm' | 'midtrans' | 'email' | 'backup' => {
    try {
      const saved = localStorage.getItem('admin_settings_sub_tab');
      if (saved && ['web', 'mlm', 'midtrans', 'email', 'backup'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'web';
  };

  const [activeTab, setActiveTab] = useState(getInitialAdminTab);
  const [settingsSubTab, setSettingsSubTab] = useState<'web' | 'mlm' | 'midtrans' | 'email' | 'backup'>(getInitialSettingsSubTab);

  React.useEffect(() => {
    try {
      localStorage.setItem('admin_active_tab', activeTab);
      if (window.location.hash !== `#${activeTab}`) {
        window.location.hash = activeTab;
      }
    } catch {}
  }, [activeTab]);

  React.useEffect(() => {
    try {
      localStorage.setItem('admin_settings_sub_tab', settingsSubTab);
    } catch {}
  }, [settingsSubTab]);

  React.useEffect(() => {
    const handleHashChange = () => {
      try {
        const validTabs = ['financials', 'withdrawals', 'deposits', 'members', 'products', 'orders', 'settings', 'landing-editor', 'profil'];
        const rawHash = window.location.hash || '';
        const cleanHash = rawHash.replace(/^[#/]+/, '').split('?')[0].split('/')[0].trim();
        if (cleanHash && validTabs.includes(cleanHash)) {
          setActiveTab(cleanHash as any);
        }
      } catch {}
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<MLMUser | null>(null);
  const [viewAdminProofImage, setViewAdminProofImage] = useState<string | null>(null);

  // Member CRUD states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MLMUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<MLMUser | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: 'password123',
    sponsor_username: '',
    upline_username: '',
    position: 'L' as 'L' | 'R',
    ktp: '',
    bank_name: 'BCA',
    bank_account: '',
    bank_holder: '',
    address: '',
    city: ''
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [editUserForm, setEditUserForm] = useState<Partial<MLMUser>>({});
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const [isDeletingUserLoading, setIsDeletingUserLoading] = useState(false);

  React.useEffect(() => {
    if (editingUser) {
      setEditUserForm({ ...editingUser });
    }
  }, [editingUser]);

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.fullname.trim()) {
      alert("Username dan Nama Lengkap wajib diisi!");
      return;
    }
    if (!onAddUser) {
      alert("Fitur tambah member tidak tersedia. Hubungi developer.");
      return;
    }
    setIsSubmittingUser(true);
    try {
      const ok = await onAddUser(newUserForm);
      if (ok) {
        setIsAddUserModalOpen(false);
        setNewUserForm({
          username: '',
          fullname: '',
          email: '',
          phone: '',
          whatsapp: '',
          password: 'password123',
          sponsor_username: '',
          upline_username: '',
          position: 'L',
          ktp: '',
          bank_name: 'BCA',
          bank_account: '',
          bank_holder: '',
          address: '',
          city: ''
        });
      }
      // If ok === false, alert is already shown by handleAddUserAdmin in App.tsx
    } catch (err: any) {
      alert(`Gagal menambah member: ${err.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSubmittingUser(false);
    }
  };


  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      if (onUpdateUserAdmin) {
        const ok = await onUpdateUserAdmin(editingUser.id, editUserForm);
        if (ok) {
          setEditingUser(null);
        } else {
          alert("Gagal memperbarui data user!");
        }
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return;
    setIsDeletingUserLoading(true);
    try {
      if (onDeleteUserAdmin) {
        const ok = await onDeleteUserAdmin(deletingUser.id);
        if (ok) {
          setDeletingUser(null);
        } else {
          alert("Gagal menghapus user!");
        }
      }
    } finally {
      setIsDeletingUserLoading(false);
    }
  };
  
  // Product edit & modal states
  const [editingModalProduct, setEditingModalProduct] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Order management states
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'DIPROSES' | 'DIKIRIM' | 'TERIMA' | 'BATAL'>('ALL');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | string | null>(null);

  // New Order Form
  const [newOrderUsername, setNewOrderUsername] = useState('');
  const [newOrderFullname, setNewOrderFullname] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderProduct, setNewOrderProduct] = useState('Hedtro Jeans Raw Denim Premium');
  const [newOrderAmount, setNewOrderAmount] = useState(550000);
  const [newOrderCourier, setNewOrderCourier] = useState('JNE REGULER');
  const [newOrderTracking, setNewOrderTracking] = useState('');

  // Edit Order Form
  const [editOrderCourier, setEditOrderCourier] = useState('JNE REGULER');
  const [editOrderTracking, setEditOrderTracking] = useState('');
  const [editOrderStatus, setEditOrderStatus] = useState<Order['status']>('DIPROSES');
  const [editOrderNotes, setEditOrderNotes] = useState('');
  const [editOrderSteps, setEditOrderSteps] = useState<OrderStep[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');

  // User search query
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDepositQuery, setSearchDepositQuery] = useState('');

  // Pagination states (10 items per page)
  const [pageTransactions, setPageTransactions] = useState(1);
  const [pageWithdrawals, setPageWithdrawals] = useState(1);
  const [pageMembers, setPageMembers] = useState(1);
  const [pageProducts, setPageProducts] = useState(1);
  const [pageDeposits, setPageDeposits] = useState(1);
  const [pageOrders, setPageOrders] = useState(1);

  // Status logs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  const finCardsRef = useRef<HTMLDivElement>(null);

  const scrollFinLeft = () => {
    if (finCardsRef.current) {
      finCardsRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollFinRight = () => {
    if (finCardsRef.current) {
      finCardsRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

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
  const DEFAULT_HERO_SLIDES: HeroSlide[] = [
    {
      id: 1,
      title: settings?.heroTitle || "501® ORIGINAL DENIM",
      subtitle: settings?.heroSubtitle || "IKONIK SEJAK 1873. POTONGAN LURUS DENGAN RAW DENIM 14OZ PREMUM.",
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1600&auto=format&fit=crop",
      badge: settings?.heroBadge || "KOLEKSI IKONIK",
      cta: settings?.heroCtaText || "BELANJA KOLEKSI 501®",
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

  const [formHeroSliders, setFormHeroSliders] = useState<HeroSlide[]>(
    settings?.heroSliders && Array.isArray(settings.heroSliders) && settings.heroSliders.length > 0
      ? settings.heroSliders
      : DEFAULT_HERO_SLIDES
  );

  React.useEffect(() => {
    if (settings && settings.heroSliders && Array.isArray(settings.heroSliders) && settings.heroSliders.length > 0) {
      setFormHeroSliders(settings.heroSliders);
    }
  }, [settings]);

  // Modal & Form states for Slide CRUD
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isAddSlideModalOpen, setIsAddSlideModalOpen] = useState(false);
  
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBadge, setSlideBadge] = useState('PROMO UNGGULAN');
  const [slideCta, setSlideCta] = useState('BELANJA SEKARANG');
  const [slideCategory, setSlideCategory] = useState('pria');
  const [slideImage, setSlideImage] = useState('');
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Ukuran file gambar maksimal 3MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSlideImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddSlideModal = () => {
    setSlideTitle('');
    setSlideSubtitle('');
    setSlideBadge('PROMO UNGGULAN');
    setSlideCta('BELANJA SEKARANG');
    setSlideCategory('pria');
    setSlideImage('');
    setIsAddSlideModalOpen(true);
  };

  const handleOpenEditSlideModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle);
    setSlideBadge(slide.badge || '');
    setSlideCta(slide.cta || '');
    setSlideCategory(slide.categoryTarget || 'pria');
    setSlideImage(slide.image);
  };

  const handleAddSlideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTitle || !slideImage) {
      alert("Judul slide dan Foto/Gambar slide wajib diisi!");
      return;
    }
    const newSlide: HeroSlide = {
      id: Date.now(),
      title: slideTitle,
      subtitle: slideSubtitle,
      badge: slideBadge,
      cta: slideCta,
      categoryTarget: slideCategory,
      image: slideImage
    };
    setFormHeroSliders(prev => {
      const updated = [...prev, newSlide];
      if (onUpdateSettings) {
        onUpdateSettings({ heroSliders: updated });
      }
      return updated;
    });
    setIsAddSlideModalOpen(false);
    setMessage({ text: "Slide banner baru berhasil ditambahkan!", type: "success" });
  };

  const handleEditSlideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || !slideTitle || !slideImage) {
      alert("Judul slide dan Foto/Gambar slide wajib diisi!");
      return;
    }
    setFormHeroSliders(prev => {
      const updated = prev.map(s => s.id === editingSlide.id ? {
        ...s,
        title: slideTitle,
        subtitle: slideSubtitle,
        badge: slideBadge,
        cta: slideCta,
        categoryTarget: slideCategory,
        image: slideImage
      } : s);
      if (onUpdateSettings) {
        onUpdateSettings({ heroSliders: updated });
      }
      return updated;
    });
    setEditingSlide(null);
    setMessage({ text: "Slide banner berhasil diperbarui!", type: "success" });
  };

  const handleDeleteSlide = (slideId: number) => {
    if (formHeroSliders.length <= 1) {
      alert("Minimal harus ada 1 slider banner utama!");
      return;
    }
    if (confirm("Apakah Anda yakin ingin menghapus slide banner ini?")) {
      setFormHeroSliders(prev => {
        const updated = prev.filter(s => s.id !== slideId);
        if (onUpdateSettings) {
          onUpdateSettings({ heroSliders: updated });
        }
        return updated;
      });
      setMessage({ text: "Slide banner berhasil dihapus!", type: "success" });
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const newSliders = [...formHeroSliders];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSliders.length) return;
    const temp = newSliders[index];
    newSliders[index] = newSliders[targetIndex];
    newSliders[targetIndex] = temp;
    setFormHeroSliders(newSliders);
    if (onUpdateSettings) {
      onUpdateSettings({ heroSliders: newSliders });
    }
    setMessage({ text: "Urutan slide banner berhasil diubah!", type: "success" });
  };

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
  const [formEnableMidtrans, setFormEnableMidtrans] = useState(settings?.enableMidtrans ?? true);
  const [formMidtransMerchantId, setFormMidtransMerchantId] = useState(settings?.midtransMerchantId || '');
  const [formMidtransClientKey, setFormMidtransClientKey] = useState(settings?.midtransClientKey || '');
  const [formMidtransServerKey, setFormMidtransServerKey] = useState(settings?.midtransServerKey || '');
  const [formMidtransIsProduction, setFormMidtransIsProduction] = useState(settings?.midtransIsProduction || false);

  // Company Bank Accounts states for RO
  const [formCompanyBankName, setFormCompanyBankName] = useState(settings?.companyBankName || 'BCA');
  const [formCompanyBankAccount, setFormCompanyBankAccount] = useState(settings?.companyBankAccount || '1234-5678-90');
  const [formCompanyBankHolder, setFormCompanyBankHolder] = useState(settings?.companyBankHolder || 'PT HEDTRO JEANS INDONESIA');
  const [formCompanyBank2Name, setFormCompanyBank2Name] = useState(settings?.companyBank2Name || 'MANDIRI');
  const [formCompanyBank2Account, setFormCompanyBank2Account] = useState(settings?.companyBank2Account || '0987-6543-21');
  const [formCompanyBank2Holder, setFormCompanyBank2Holder] = useState(settings?.companyBank2Holder || 'PT HEDTRO JEANS INDONESIA');
  const [formCompanyBank3Name, setFormCompanyBank3Name] = useState(settings?.companyBank3Name || 'BRI');
  const [formCompanyBank3Account, setFormCompanyBank3Account] = useState(settings?.companyBank3Account || '5544-3322-11');
  const [formCompanyBank3Holder, setFormCompanyBank3Holder] = useState(settings?.companyBank3Holder || 'PT HEDTRO JEANS INDONESIA');
  const [formCompanyBankInstruction, setFormCompanyBankInstruction] = useState(settings?.companyBankInstruction || 'Harap transfer sesuai nominal tepat dan cantumkan Username pada berita transfer.');

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
      setFormEnableMidtrans(settings.enableMidtrans ?? true);
      setFormMidtransMerchantId(settings.midtransMerchantId || '');
      setFormMidtransClientKey(settings.midtransClientKey || '');
      setFormMidtransServerKey(settings.midtransServerKey || '');
      setFormMidtransIsProduction(settings.midtransIsProduction ?? false);

      setFormCompanyBankName(settings.companyBankName || 'BCA');
      setFormCompanyBankAccount(settings.companyBankAccount || '1234-5678-90');
      setFormCompanyBankHolder(settings.companyBankHolder || 'PT HEDTRO JEANS INDONESIA');
      setFormCompanyBank2Name(settings.companyBank2Name || 'MANDIRI');
      setFormCompanyBank2Account(settings.companyBank2Account || '0987-6543-21');
      setFormCompanyBank2Holder(settings.companyBank2Holder || 'PT HEDTRO JEANS INDONESIA');
      setFormCompanyBank3Name(settings.companyBank3Name || 'BRI');
      setFormCompanyBank3Account(settings.companyBank3Account || '5544-3322-11');
      setFormCompanyBank3Holder(settings.companyBank3Holder || 'PT HEDTRO JEANS INDONESIA');
      setFormCompanyBankInstruction(settings.companyBankInstruction || 'Harap transfer sesuai nominal tepat dan cantumkan Username pada berita transfer.');

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
  const [newProdSizesStr, setNewProdSizesStr] = useState('28, 29, 30, 31, 32, 33, 34, 35, 36');
  const [newProdColorsStr, setNewProdColorsStr] = useState('Deep Indigo Blue, Jet Black, Light Blue, Retro Wash');
  const [newProdBadge, setNewProdBadge] = useState('');

  // File input refs & file reader handler for uploading product photos
  const newProductFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);

  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file foto terlalu besar (maksimal 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        if (target === 'new') {
          setNewProdImage(base64Data);
        } else if (target === 'edit' && editingModalProduct) {
          setEditingModalProduct({ ...editingModalProduct, image: base64Data });
        }
      }
    };
    reader.readAsDataURL(file);
  };

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

  const handleDeleteDeposit = async (depositId: number) => {
    if (!window.confirm(`Yakin ingin menghapus data deposit ID #${depositId}? Data akan dihapus dari database.`)) return;
    setLoading(true);
    try {
      if (onDeleteDeposit) {
        await onDeleteDeposit(depositId);
      } else {
        await fetch("/api/admin/deposits/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: depositId })
        });
      }
      setMessage({ text: `Data deposit #${depositId} berhasil dihapus dari database!`, type: "success" });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus deposit", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWithdrawal = async (wdId: number) => {
    if (!window.confirm(`Yakin ingin menghapus data penarikan WD ID #${wdId}? Data akan dihapus dari database.`)) return;
    setLoading(true);
    try {
      if (onDeleteWithdrawal) {
        await onDeleteWithdrawal(wdId);
      } else {
        await fetch("/api/admin/withdrawals/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: wdId })
        });
      }
      setMessage({ text: `Data penarikan (WD) #${wdId} berhasil dihapus dari database!`, type: "success" });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus WD", type: "error" });
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
      const sizesArr = newProdSizesStr.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArr = newProdColorsStr.split(',').map(c => c.trim()).filter(Boolean);

      const prodData = {
        name: newProdName,
        image: newProdImage,
        price: Number(newProdPrice),
        member_price: Number(newProdMemberPrice),
        stock: Number(newProdStock),
        description: newProdDescription,
        sizes: sizesArr.length > 0 ? sizesArr : ["28", "29", "30", "31", "32", "33", "34", "35", "36"],
        colors: colorsArr.length > 0 ? colorsArr : ["Deep Indigo Blue", "Jet Black", "Light Wash"],
        badge: newProdBadge.trim() ? newProdBadge.trim() : undefined
      };

      if (onAddProduct) {
        await onAddProduct(prodData);
        setMessage({ text: "Produk baru berhasil ditambahkan!", type: "success" });
        setNewProdName('');
        setNewProdPrice(150000);
        setNewProdMemberPrice(120000);
        setNewProdStock(100);
        setNewProdBadge('');
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

  // Order Handlers
  const handleOpenEditOrderModal = (ord: Order) => {
    setEditingOrder(ord);
    setEditOrderCourier(ord.courier || 'JNE REGULER');
    setEditOrderTracking(ord.tracking_number || '');
    setEditOrderStatus(ord.status || 'DIPROSES');
    setEditOrderNotes(ord.notes || '');
    setEditOrderSteps(ord.steps ? [...ord.steps] : []);
  };

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setLoading(true);

    const updatedOrder: Order = {
      ...editingOrder,
      courier: editOrderCourier,
      tracking_number: editOrderTracking,
      status: editOrderStatus,
      notes: editOrderNotes,
      updated_at: new Date().toISOString(),
      steps: editOrderSteps
    };

    try {
      if (onUpdateOrder) {
        await onUpdateOrder(updatedOrder);
      }
      setMessage({ text: `Status & Resi order ${editingOrder.invoice_no} berhasil diperbarui!`, type: "success" });
      setEditingOrder(null);
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal memperbarui order", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncShippingApi = async (ord: Order) => {
    setLoading(true);
    try {
      const res = await fetch("/api/shipping/sync-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: ord.id,
          courier: ord.courier,
          trackingNumber: ord.tracking_number,
          apiKey: settings?.shippingApiKey || ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal sinkronisasi resi");
      
      setMessage({ text: data.message, type: "success" });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal sinkronisasi resi", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShippingMode = async (mode: 'AUTO_API' | 'MANUAL', apiKeyInput?: string) => {
    setLoading(true);
    try {
      const payload = {
        shippingTrackingMode: mode,
        ...(apiKeyInput !== undefined ? { shippingApiKey: apiKeyInput } : {})
      };
      if (onUpdateSettings) {
        await onUpdateSettings(payload);
      } else {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      setMessage({ 
        text: mode === 'AUTO_API' 
          ? "✅ Mode Pengiriman diubah ke API Otomatis (Gratis / Binderbyte API)" 
          : "✅ Mode Pengiriman diubah ke Mode Manual (Input Admin)", 
        type: "success" 
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menyimpan mode pengiriman", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderFullname || !newOrderPhone || !newOrderAddress) {
      alert("Harap lengkapi nama, nomor telepon, dan alamat kirim!");
      return;
    }
    setLoading(true);
    try {
      if (onCreateOrder) {
        await onCreateOrder({
          username: newOrderUsername || "guest",
          fullname: newOrderFullname,
          phone: newOrderPhone,
          address: newOrderAddress,
          product_name: newOrderProduct,
          amount: newOrderAmount,
          courier: newOrderCourier,
          tracking_number: newOrderTracking || `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`,
          status: "DIPROSES"
        });
      }
      setMessage({ text: "Order pesanan manual baru berhasil dibuat!", type: "success" });
      setIsAddOrderModalOpen(false);
      setNewOrderUsername('');
      setNewOrderFullname('');
      setNewOrderPhone('');
      setNewOrderAddress('');
      setNewOrderTracking('');
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membuat order baru", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrderConfirm = async () => {
    if (!deletingOrderId) return;
    setLoading(true);
    try {
      if (onDeleteOrder) {
        await onDeleteOrder(deletingOrderId);
      }
      setMessage({ text: "Order berhasil dihapus!", type: "success" });
      setDeletingOrderId(null);
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus order", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStepToOrder = () => {
    if (!newStepTitle) return;
    const newStep: OrderStep = {
      title: newStepTitle,
      time: new Date().toLocaleString("id-ID"),
      done: true,
      description: newStepDesc || "Proses diperbarui oleh admin"
    };
    setEditOrderSteps(prev => [...prev, newStep]);
    setNewStepTitle('');
    setNewStepDesc('');
  };

  const handleToggleStepDone = (idx: number) => {
    setEditOrderSteps(prev => prev.map((s, i) => i === idx ? { ...s, done: !s.done } : s));
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

  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage({ text: `File backup ${filename} berhasil diunduh!`, type: "success" });
  };

  const handleBackupRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>, category: 'members' | 'web_settings' | 'mlm_network' | 'sales') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (onRestoreCategory) {
          setLoading(true);
          const ok = await onRestoreCategory(category, parsed);
          if (ok) {
            setMessage({ text: `Berhasil merestore data ${category}!`, type: 'success' });
            if (onRefresh) onRefresh();
          } else {
            setMessage({ text: `Gagal merestore data ${category}`, type: 'error' });
          }
        }
      } catch (err) {
        setMessage({ text: "Format file JSON tidak valid!", type: 'error' });
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async (category: 'members' | 'web_settings' | 'mlm_network' | 'sales', categoryName: string) => {
    if (window.confirm(`PERINGATAN SANGAT PENTING!\n\nApakah Anda yakin ingin MERESET ${categoryName.toUpperCase()}?\nData yang telah dihapus tidak dapat dikembalikan kecuali Anda memiliki file backup.`)) {
      if (onResetCategory) {
        setLoading(true);
        const ok = await onResetCategory(category);
        if (ok) {
          setMessage({ text: `Berhasil mereset data ${categoryName}!`, type: 'success' });
          if (onRefresh) onRefresh();
        } else {
          setMessage({ text: `Gagal mereset data ${categoryName}`, type: 'error' });
        }
        setLoading(false);
      }
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
      enableMidtrans: formEnableMidtrans,
      midtransMerchantId: formMidtransMerchantId,
      midtransClientKey: formMidtransClientKey,
      midtransServerKey: formMidtransServerKey,
      midtransIsProduction: formMidtransIsProduction,
      companyBankName: formCompanyBankName,
      companyBankAccount: formCompanyBankAccount,
      companyBankHolder: formCompanyBankHolder,
      companyBank2Name: formCompanyBank2Name,
      companyBank2Account: formCompanyBank2Account,
      companyBank2Holder: formCompanyBank2Holder,
      companyBank3Name: formCompanyBank3Name,
      companyBank3Account: formCompanyBank3Account,
      companyBank3Holder: formCompanyBank3Holder,
      companyBankInstruction: formCompanyBankInstruction,
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
      footerAbout: formFooterAbout,
      heroSliders: formHeroSliders
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
          <button
            onClick={() => setIsWorkflowModalOpen(true)}
            className="bg-[#C41230] hover:bg-[#A00E26] text-white px-2.5 py-1.5 rounded text-xs font-black uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
            title="Bagan Alur Kerja & Unduh PDF"
          >
            <FileText className="w-3.5 h-3.5" /> <span className="hidden xs:inline">ALUR KERJA (PDF)</span>
          </button>

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
                  id="admin-tab-orders-mobile"
                  onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-left">
                    <Truck className="w-4 h-4 shrink-0" /> Pengiriman & Resi Pesanan
                  </span>
                  {orders.length > 0 && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                      {orders.length} order
                    </span>
                  )}
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

                <button
                  id="admin-tab-workflow-mobile"
                  onClick={() => { setIsWorkflowModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition text-amber-400 hover:bg-slate-800 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" /> Bagan Alur Kerja (PDF)
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded font-black uppercase">PDF</span>
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
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'financials' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Laporan Laba Rugi</span>
            </button>

            <button
              id="admin-tab-withdrawals"
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Pencairan Bonus (WD)</span>
              {metrics.pendingWDCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                  {metrics.pendingWDCount}
                </span>
              )}
            </button>

            <button
              id="admin-tab-deposits"
              onClick={() => setActiveTab('deposits')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Validasi Deposit Manual</span>
              {deposits.filter(d => d.status === 'pending').length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
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
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'products' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Gudang & Stok Jeans</span>
            </button>

            <button
              id="admin-tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Pengiriman & Resi</span>
              {orders.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeTab === 'orders' ? 'bg-blue-500/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {orders.length}
                </span>
              )}
            </button>

            <button
              id="admin-tab-landing-editor"
              onClick={() => setActiveTab('landing-editor')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'landing-editor' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Edit className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Edit Tulisan Landing Page</span>
            </button>

            <button
              id="admin-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Seting Web & MLM Bonus</span>
            </button>

            <button
              id="admin-tab-profil"
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Profil Saya & Sandi</span>
            </button>

            <button
              id="admin-tab-workflow"
              onClick={() => setIsWorkflowModalOpen(true)}
              className="w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left text-amber-400 hover:bg-slate-800 hover:text-white"
            >
              <FileText className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="flex-1 text-left">Bagan Alur Kerja (PDF)</span>
            </button>

            <div className="pt-2 border-t border-slate-800">
              <button
                id="admin-sidebar-btn-logout"
                onClick={onLogout}
                className="w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/50 hover:text-red-300 transition text-left"
              >
                <LogOut className="w-4 h-4 shrink-0 text-red-400" />
                <span className="flex-1 text-left">Keluar (Logout)</span>
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
              
              {/* Financial Metrics Cards - Mobile Horizontal Slide Carousel & PC Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    📊 Ringkasan Laporan Laba Rugi & Kas
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={scrollFinLeft}
                      className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 active:scale-90 transition border border-slate-200 shadow-2xs cursor-pointer flex items-center justify-center"
                      title="Geser Kiri"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-800" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollFinRight}
                      className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white active:scale-90 transition shadow-xs cursor-pointer flex items-center justify-center"
                      title="Geser Kanan"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div 
                  ref={finCardsRef}
                  className="flex sm:grid sm:grid-cols-3 gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
                >
                  
                  {/* Card 1: Total Turnover Cashflow */}
                  <div className="w-[82vw] xs:w-[310px] sm:w-auto shrink-0 snap-center sm:shrink bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute -right-10 -top-10 w-36 h-36 bg-blue-600/15 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest block">Omset Kotor Perusahaan</span>
                          <p className="text-[11px] font-bold text-slate-300">Total Akumulasi Masuk</p>
                        </div>
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white leading-tight">
                          <span className="text-blue-400 text-sm sm:text-base font-sans mr-1">Rp</span>
                          {metrics.totalTurnover.toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2.5 mt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>Omset Aktivasi ({metrics.activeMembers}):</span>
                      <strong className="text-emerald-400 font-mono">Rp {(metrics.activeMembers * 550000).toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Card 2: Total MLM Commissions Paid */}
                  <div className="w-[82vw] xs:w-[310px] sm:w-auto shrink-0 snap-center sm:shrink bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-red-600 font-extrabold uppercase tracking-widest block">Beban Komisi Terbayar</span>
                          <p className="text-[11px] font-bold text-slate-900">Total Bonus Member</p>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-950 tracking-tight leading-tight">
                          <span className="text-red-500 text-sm sm:text-base font-sans mr-1">Rp</span>
                          {metrics.totalBonusesPaid.toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 mt-3 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                      <span>Rasio Beban Bonus:</span>
                      <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        {metrics.totalTurnover > 0 ? Math.round((metrics.totalBonusesPaid / metrics.totalTurnover) * 100) : 0}% dari Omset
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Profit Cash */}
                  <div className="w-[82vw] xs:w-[310px] sm:w-auto shrink-0 snap-center sm:shrink bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-900/40 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">Kas Bersih Perusahaan (Profit)</span>
                          <p className="text-[11px] font-bold text-slate-300">Surplus Bersih Admin</p>
                        </div>
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-display font-black text-emerald-400 tracking-tight leading-tight">
                          <span className="text-emerald-500 text-sm sm:text-base font-sans mr-1">Rp</span>
                          {(metrics.totalTurnover - metrics.totalBonusesPaid).toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2.5 mt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>Status Arus Kas:</span>
                      <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        SURPLUS POSITIF
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Monthly Visual Sales Chart Simulator */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
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
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> <span className="text-slate-600">Omset Masuk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-red-400 rounded"></span> <span className="text-slate-600">Komisi MLM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions log ledger */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Semua Aliran Kas Transaksi Sistem</h4>

                {/* Mobile View: 1 Column per Row */}
                <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                  {transactions
                    .slice()
                    .reverse()
                    .slice((pageTransactions - 1) * 10, pageTransactions * 10)
                    .map((tx) => (
                    <div key={tx.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-xs space-y-1.5">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-slate-900 truncate text-xs">{tx.username.replace(/^@/, '')}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                            tx.type.endsWith('_bonus') ? 'bg-green-100 text-green-800' :
                            tx.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                            tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">{tx.description}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">{new Date(tx.created_at).toLocaleDateString('id-ID')}</span>
                        <span className={`font-black font-mono text-xs ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}Rp {tx.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs">Belum ada transaksi recorded.</div>
                  )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden sm:block overflow-x-auto">
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
                      {transactions
                        .slice()
                        .reverse()
                        .slice((pageTransactions - 1) * 10, pageTransactions * 10)
                        .map((tx) => (
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
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada transaksi recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <PaginationControls
                  currentPage={pageTransactions}
                  totalItems={transactions.length}
                  itemsPerPage={10}
                  onPageChange={setPageTransactions}
                />
              </div>

            </div>
          )}

          {/* TAB 2: WITHDRAWAL PROCESSING */}
          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6" id="admin-withdrawals-panel">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="text-blue-600 w-5 h-5" /> Verifikasi Pembayaran Bonus (Withdrawal)
                </h3>
                <p className="text-xs text-slate-500">Kelola permintaan pencairan saldo komisi MLM member. Anda dapat mengaktifkan sistem "Otomatis" di sidebar untuk bypass verifikasi manual.</p>
              </div>

              {/* Mobile View: 1 Column per Row */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {withdrawals.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    Belum ada aktivitas penarikan dana (Withdrawal)
                  </div>
                ) : (
                  withdrawals
                    .slice()
                    .reverse()
                    .slice((pageWithdrawals - 1) * 10, pageWithdrawals * 10)
                    .map((wd) => (
                    <div key={wd.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-slate-900 truncate text-xs">{wd.username.replace(/^@/, '')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                            wd.status === 'success' ? 'bg-green-100 text-green-800' :
                            wd.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {wd.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs truncate">{wd.account_holder}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase truncate">{wd.bank_name} • {wd.account_number}</p>
                        <p className="text-sm font-black text-slate-950 mt-1">Rp {wd.amount.toLocaleString()}</p>
                      </div>

                      <div>
                        {wd.status === 'pending' ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              id={`btn-approve-wd-mob-${wd.id}`}
                              onClick={() => handleWDApproval(wd.id, 'approve')}
                              disabled={loading}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold py-1.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Setujui
                            </button>
                            <button
                              id={`btn-reject-wd-mob-${wd.id}`}
                              onClick={() => handleWDApproval(wd.id, 'reject')}
                              disabled={loading}
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold py-1.5 rounded-lg text-xs transition border border-red-200 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="block text-center text-[10px] text-slate-400 font-extrabold uppercase pt-1.5 border-t border-slate-200/60">
                            Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto">
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
                      withdrawals
                        .slice()
                        .reverse()
                        .slice((pageWithdrawals - 1) * 10, pageWithdrawals * 10)
                        .map((wd) => (
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
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWithdrawal(wd.id)}
                                  disabled={loading}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold p-1.5 rounded-lg text-[10px] transition border border-red-200 flex items-center gap-1 cursor-pointer"
                                  title="Hapus Data WD"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Selesai divalidasi</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWithdrawal(wd.id)}
                                  disabled={loading}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold p-1.5 rounded-lg text-[10px] transition border border-red-200 flex items-center gap-1 cursor-pointer"
                                  title="Hapus Data WD"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={pageWithdrawals}
                totalItems={withdrawals.length}
                itemsPerPage={10}
                onPageChange={setPageWithdrawals}
              />
            </div>
          )}

          {/* TAB 3: MEMBERS DATABASE */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6" id="admin-members-panel">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-blue-600 w-5 h-5" /> Struktur Jaringan & Database Anggota
                  </h3>
                  <p className="text-xs text-slate-500">Berikut adalah database seluruh pengguna MLM terdaftar di sistem binary Anda.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Tambah Member Baru
                  </button>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-56">
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
              </div>

              {/* Mobile View: 1 Column per Row */}
              <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                {filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    Tidak ada data anggota ditemukan
                  </div>
                ) : (
                  filteredUsers
                    .slice((pageMembers - 1) * 10, pageMembers * 10)
                    .map((u, index) => {
                    const rowNo = index + 1 + (pageMembers - 1) * 10;
                    const totalBonus = (u.sponsor_bonus || 0) + (u.pairing_bonus || 0) + (u.level_bonus || 0) + (u.ro_bonus || 0);
                    return (
                      <div key={u.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2">
                        <div>
                          {/* Row Number Header for Mobile */}
                          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/80">
                            <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md shrink-0">
                              No. {rowNo}
                            </span>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {u.is_active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {u.profile_photo ? (
                                <img
                                  src={u.profile_photo}
                                  alt={u.fullname || u.username}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0">
                                  {(u.fullname || u.username).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-extrabold text-blue-600 truncate text-xs block">@{u.username.replace(/^@/, '')}</span>
                                <p className="font-bold text-slate-900 text-xs truncate">{u.fullname || u.username}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{u.phone || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] space-y-1 pt-2 border-t border-slate-200/80 text-slate-600">
                          <div className="flex justify-between items-center">
                            <span>Anggota Tim L/R:</span>
                            <strong className="font-mono text-slate-900 font-bold">{u.left_count || 0} / {u.right_count || 0}</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Saldo Utama:</span>
                            <strong className="font-mono text-slate-900 font-bold">Rp {(u.balance || 0).toLocaleString('id-ID')}</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Bonus:</span>
                            <strong className="font-mono text-green-600 font-extrabold">Rp {totalBonus.toLocaleString('id-ID')}</strong>
                          </div>
                        </div>

                        {/* Mobile Actions: 4 Vertical Buttons (Detail, Edit, Ban, Hapus) */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200 sm:flex sm:flex-col sm:items-stretch sm:gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetail(u)}
                            className="w-full px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="w-full px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (onUpdateUserAdmin) {
                                await onUpdateUserAdmin(u.id, { is_active: !u.is_active });
                              }
                            }}
                            className={`w-full px-2.5 py-1 rounded-lg font-extrabold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer ${
                              u.is_active
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                                : 'bg-green-50 hover:bg-green-100 text-green-700'
                            }`}
                            title={u.is_active ? 'Banned / Nonaktifkan Member' : 'Aktifkan Kembali Member'}
                          >
                            {u.is_active ? (
                              <><Ban className="w-3 h-3" /> Ban</>
                            ) : (
                              <><CheckCircle className="w-3 h-3" /> Unban</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            className="w-full px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop View: Clean & Spacious Table (6 Streamlined Columns) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">
                      <th className="py-3.5 px-4 text-center w-16">NO</th>
                      <th className="py-3.5 px-4">ANGGOTA / MEMBER</th>
                      <th className="py-3.5 px-4">LISENSI & JARINGAN</th>
                      <th className="py-3.5 px-4 text-center">TIM & OMSET</th>
                      <th className="py-3.5 px-4 text-right">SALDO & BONUS</th>
                      <th className="py-3.5 px-4 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada data anggota ditemukan</td>
                      </tr>
                    ) : (
                      filteredUsers
                        .slice((pageMembers - 1) * 10, pageMembers * 10)
                        .map((u, index) => {
                        const rowNo = index + 1 + (pageMembers - 1) * 10;
                        const totalBonus = (u.sponsor_bonus || 0) + (u.pairing_bonus || 0) + (u.level_bonus || 0) + (u.ro_bonus || 0);
                        const uplineUser = (users || []).find(x => Number(x.id) === Number(u.upline_id));
                        const sponsorUser = (users || []).find(x => Number(x.id) === Number(u.sponsor_id));
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Column 1: No. Urut */}
                            <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-xs">
                              {rowNo}
                            </td>

                            {/* Column 2: Member Info (Foto, Nama, Username, Telp) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {u.profile_photo ? (
                                  <img
                                    src={u.profile_photo}
                                    alt={u.fullname || u.username}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                    {(u.fullname || u.username).charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <button
                                    onClick={() => setSelectedUserDetail(u)}
                                    className="font-extrabold text-slate-900 hover:text-blue-600 text-left transition cursor-pointer text-xs block leading-tight"
                                  >
                                    {u.fullname || u.username}
                                  </button>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                                    <span className="font-bold text-blue-600">@{u.username.replace(/^@/, '')}</span>
                                    <span>•</span>
                                    <span className="font-mono text-slate-500">{u.phone || '-'}</span>
                                  </div>
                                  <span className="block text-[9px] text-slate-400 mt-0.5">
                                    Daftar: {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Column 3: Lisensi Status & Upline/Sponsor */}
                            <td className="py-3.5 px-4 leading-normal">
                              <div className="mb-1">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                  u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {u.is_active ? '✓ Lisensi Aktif' : 'Tidak Aktif'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-600 space-y-0.5">
                                <div>
                                  <span className="font-bold text-slate-900">Upline:</span> {uplineUser ? `@${uplineUser.username.replace(/^@/, '')}` : 'Root'} <span className="text-blue-600 font-extrabold">({u.position || 'L'})</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900">Sponsor:</span> {sponsorUser ? `@${sponsorUser.username.replace(/^@/, '')}` : '-'}
                                </div>
                              </div>
                            </td>

                            {/* Column 4: Tim L/R & Omset L/R */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-block bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-left space-y-0.5">
                                <div className="text-[10px] flex justify-between gap-3">
                                  <span className="text-slate-500 font-medium">Tim:</span>
                                  <strong className="font-mono text-slate-900 font-extrabold">{u.left_count || 0}L / {u.right_count || 0}R</strong>
                                </div>
                                <div className="text-[10px] flex justify-between gap-3">
                                  <span className="text-slate-500 font-medium">Omset:</span>
                                  <strong className="font-mono text-blue-700 font-extrabold">{u.left_sales || 0}L / {u.right_sales || 0}R</strong>
                                </div>
                              </div>
                            </td>

                            {/* Column 5: Saldo & Total Bonus */}
                            <td className="py-3.5 px-4 text-right leading-tight">
                              <div className="text-xs font-black text-slate-900 font-mono">
                                <span className="text-[9px] font-normal text-slate-400 uppercase mr-1">Saldo:</span>
                                Rp {(u.balance || 0).toLocaleString('id-ID')}
                              </div>
                              <div className="text-xs font-black text-green-600 font-mono mt-1">
                                <span className="text-[9px] font-normal text-slate-400 uppercase mr-1">Bonus:</span>
                                Rp {totalBonus.toLocaleString('id-ID')}
                              </div>
                            </td>

                            {/* Column 6: Aksi (4 Vertical Buttons: Detail, Edit, Ban, Hapus) */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col items-center justify-center gap-1 w-24 mx-auto">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserDetail(u)}
                                  className="w-full px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-[10px] transition inline-flex items-center justify-center gap-1 cursor-pointer"
                                  title="Lihat Detail Lengkap"
                                >
                                  <Eye className="w-3 h-3" /> Detail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUser(u)}
                                  className="w-full px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[10px] transition inline-flex items-center justify-center gap-1 cursor-pointer"
                                  title="Edit Member"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onUpdateUserAdmin) {
                                      await onUpdateUserAdmin(u.id, { is_active: !u.is_active });
                                    }
                                  }}
                                  className={`w-full px-2.5 py-1 rounded-lg font-extrabold text-[10px] transition inline-flex items-center justify-center gap-1 cursor-pointer ${
                                    u.is_active
                                      ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                                  }`}
                                  title={u.is_active ? 'Banned / Nonaktifkan Member' : 'Aktifkan Kembali Member'}
                                >
                                  {u.is_active ? (
                                    <><Ban className="w-3 h-3" /> Ban</>
                                  ) : (
                                    <><CheckCircle className="w-3 h-3" /> Unban</>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(u)}
                                  className="w-full px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] transition inline-flex items-center justify-center gap-1 cursor-pointer"
                                  title="Hapus Member"
                                >
                                  <Trash2 className="w-3 h-3" /> Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={pageMembers}
                totalItems={filteredUsers.length}
                itemsPerPage={10}
                onPageChange={setPageMembers}
              />
            </div>
          )}

          {/* TAB 4: WAREHOUSE & STOCK CONTROLS (COMPACT TABLE & POPUP CRUD) */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6" id="admin-products-panel">
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

              {/* Mobile View: 1 Column Compact per Product */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {products
                  .filter(p => !productSearchQuery || p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                  .slice((pageProducts - 1) * 10, pageProducts * 10)
                  .map((p) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img referrerPolicy="no-referrer" src={p.image} className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-white" alt={p.name} />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            <span className="text-slate-600 font-medium">Retail: <strong>Rp {p.price.toLocaleString('id-ID')}</strong></span>
                            <span className="text-blue-600 font-extrabold">Member: Rp {p.member_price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                              p.stock > 10 ? 'bg-green-100 text-green-800' :
                              p.stock > 0 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Stok: {p.stock > 0 ? `${p.stock} Pcs` : 'Habis'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          id={`btn-edit-popup-product-mob-${p.id}`}
                          onClick={() => setEditingModalProduct({ ...p })}
                          className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg transition border border-slate-200 cursor-pointer flex items-center justify-center shadow-2xs"
                          title="Edit Produk (Popup)"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-popup-product-mob-${p.id}`}
                          onClick={() => setDeletingProduct(p)}
                          className="p-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg transition border border-slate-200 cursor-pointer flex items-center justify-center shadow-2xs"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                {products.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs">Belum ada data produk di gudang.</div>
                )}
              </div>

              {/* Desktop View: Compact Table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
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
                      .slice((pageProducts - 1) * 10, pageProducts * 10)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img referrerPolicy="no-referrer" src={p.image} className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100" alt={p.name} />
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-900 truncate max-w-[220px]">{p.name}</h4>
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  {p.sizes && p.sizes.length > 0 && (
                                    <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100">
                                      Size: {p.sizes.slice(0, 4).join(', ')}{p.sizes.length > 4 ? '+' : ''}
                                    </span>
                                  )}
                                  {p.colors && p.colors.length > 0 && (
                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                      {p.colors.length} Warna
                                    </span>
                                  )}
                                  {p.badge && (
                                    <span className="text-[9px] font-extrabold bg-red-50 text-red-600 px-1.5 py-0.2 rounded border border-red-200 uppercase">
                                      {p.badge}
                                    </span>
                                  )}
                                </div>
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

              <PaginationControls
                currentPage={pageProducts}
                totalItems={products.filter(p => !productSearchQuery || p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length}
                itemsPerPage={10}
                onPageChange={setPageProducts}
              />
            </div>
          )}

          {/* TAB: DEPOSITS VALIDATION */}
          {activeTab === 'deposits' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ArrowDownLeft className="text-amber-500 w-5 h-5" /> Validasi Deposit Transfer Manual
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periksa nominal unik transfer bank dan setujui atau tolak transaksi deposit manual yang diajukan oleh member.
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari username, kode unik, ID, Rp..."
                    value={searchDepositQuery}
                    onChange={(e) => {
                      setSearchDepositQuery(e.target.value);
                      setPageDeposits(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              {(() => {
                const filteredDeposits = deposits.filter(dep => {
                  const q = searchDepositQuery.toLowerCase().trim();
                  if (!q) return true;
                  const codeStr = String(dep.unique_code || (100 + dep.id % 899));
                  const totalTrfStr = String(dep.amount + (dep.unique_code || (100 + dep.id % 899)));
                  return (
                    dep.username.toLowerCase().includes(q) ||
                    String(dep.id).includes(q) ||
                    codeStr.includes(q) ||
                    totalTrfStr.includes(q) ||
                    String(dep.amount).includes(q) ||
                    dep.method.toLowerCase().includes(q)
                  );
                });

                return (
                  <>
                    {/* Mobile View: 1 Column per Row */}
                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                      {filteredDeposits.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs font-medium">
                          Tidak ada riwayat deposit sesuai pencarian
                        </div>
                      ) : (
                        filteredDeposits
                          .slice((pageDeposits - 1) * 10, pageDeposits * 10)
                          .map((dep) => {
                            const code = dep.unique_code || (100 + dep.id % 899);
                            const totalTrf = dep.amount + code;
                            return (
                              <div key={dep.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2">
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-extrabold text-slate-900 truncate text-xs">@{dep.username.replace(/^@/, '')}</span>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                                      dep.status === 'success' ? 'bg-green-100 text-green-800' :
                                      dep.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {dep.status === 'success' ? 'SUCCESS' : dep.status === 'failed' ? 'FAILED' : 'PENDING'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm font-mono font-black text-slate-900">
                                      Rp {totalTrf.toLocaleString('id-ID')}
                                    </p>
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-black text-[10px]">
                                      Kode Unik: #{code}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Nominal Pokok: Rp {dep.amount.toLocaleString('id-ID')}
                                  </p>
                                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Metode: {dep.method.startsWith('manual') ? "Transfer Bank Manual" : dep.method} • Ref: #DEP-{dep.id}</p>
                                </div>

                                <div>
                                  {dep.status === 'pending' ? (
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                                      <button
                                        id={`btn-approve-dep-mob-${dep.id}`}
                                        disabled={loading}
                                        onClick={() => handleProcessDeposit(dep.id, 'approve')}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold py-1.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Setujui (Acc)
                                      </button>
                                      <button
                                        id={`btn-reject-dep-mob-${dep.id}`}
                                        disabled={loading}
                                        onClick={() => handleProcessDeposit(dep.id, 'reject')}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-1.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" /> Tolak
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="block text-center text-[10px] text-slate-400 font-extrabold uppercase pt-1.5 border-t border-slate-200/60">
                                      Terproses
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-4 py-3">ID / Tanggal</th>
                            <th className="px-4 py-3">Username / Member</th>
                            <th className="px-4 py-3">Metode / Detail</th>
                            <th className="px-4 py-3">Kode Unik Verifikasi</th>
                            <th className="px-4 py-3 text-right">Total Ditransfer (IDR)</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Aksi (Validasi)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {filteredDeposits.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">Tidak ada riwayat deposit ditemukan</td>
                            </tr>
                          ) : (
                            filteredDeposits
                              .slice((pageDeposits - 1) * 10, pageDeposits * 10)
                              .map((dep) => {
                                const code = dep.unique_code || (100 + dep.id % 899);
                                const totalTrf = dep.amount + code;
                                return (
                                  <tr key={dep.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3.5">
                                      <p className="font-bold text-slate-800 font-mono">#DEP-{dep.id}</p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(dep.created_at).toLocaleString()}</p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <p className="font-extrabold text-slate-950">@{dep.username.replace(/^@/, '')}</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">{dep.method.startsWith('manual') ? "Transfer Manual" : "Payment Gateway"}</p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                        {dep.method.toUpperCase()}
                                      </span>
                                      {dep.proof_image ? (
                                        <div className="mt-1">
                                          <button
                                            type="button"
                                            onClick={() => setViewAdminProofImage(dep.proof_image || null)}
                                            className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-200 transition cursor-pointer"
                                          >
                                            <Eye className="w-3 h-3 text-emerald-700" /> Lihat Bukti Transfer
                                          </button>
                                          {dep.proof_notes && <p className="text-[9px] text-slate-500 italic mt-0.5">{dep.proof_notes}</p>}
                                        </div>
                                      ) : (
                                        dep.method.startsWith('manual') && (
                                          <p className="text-[10px] text-amber-600 font-semibold mt-1 font-sans">Belum kirim bukti</p>
                                        )
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 font-mono">
                                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-xs font-black">
                                        #{code}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono">
                                      <div className="font-black text-sm text-slate-900">
                                        Rp {totalTrf.toLocaleString('id-ID')}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        Pokok Rp {dep.amount.toLocaleString('id-ID')} + Unik Rp {code}
                                      </div>
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
                                          <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleDeleteDeposit(dep.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold p-1.5 rounded-lg border border-red-200 transition text-[10px] cursor-pointer"
                                            title="Hapus Data Deposit"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <span className="text-slate-400 font-semibold text-[10px] uppercase">Terproses</span>
                                          <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleDeleteDeposit(dep.id)}
                                            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-200 transition text-[10px] cursor-pointer"
                                            title="Hapus Data Deposit"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <PaginationControls
                      currentPage={pageDeposits}
                      totalItems={filteredDeposits.length}
                      itemsPerPage={10}
                      onPageChange={setPageDeposits}
                    />
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Top Title & Sub-tabs switcher */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Settings className="text-blue-600 w-6 h-6" /> Pengaturan Web & Sistem MLM
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Pilih kategori pengaturan di bawah untuk mengelola identitas web, komisi MLM, Midtrans, dan email server.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSettingsSubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 self-start md:self-center shrink-0 cursor-pointer"
                  >
                    💾 Simpan Perubahan
                  </button>
                </div>

                {/* Sub-Tab Navigation Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('web')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer ${
                      settingsSubTab === 'web'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Globe className="w-4 h-4" /> 1. Identitas & Web
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('mlm')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer ${
                      settingsSubTab === 'mlm'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Percent className="w-4 h-4" /> 2. MLM & Skema Bonus
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('midtrans')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer ${
                      settingsSubTab === 'midtrans'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> 3. Gateway & Rekening Bank
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('email')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer ${
                      settingsSubTab === 'email'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> 4. Notifikasi Email & SMTP
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('backup')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer ${
                      settingsSubTab === 'backup'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" /> 5. Backup & Reset Data
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
                {/* SUB-TAB 1: IDENTITAS WEB & BRANDING */}
                {settingsSubTab === 'web' && (
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
              
              {/* BRANDING CONFIGURATION CARD */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
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

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md cursor-pointer flex items-center gap-2"
                  >
                    💾 Simpan Pengaturan Web & Branding
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: MIDTRANS PAYMENT GATEWAY */}
          {settingsSubTab === 'midtrans' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                  <CreditCard className="text-blue-600 w-4.5 h-4.5" /> Integrasi API Gateway Midtrans (Otomatis)
                </h3>
                <p className="text-xs text-slate-400">
                  Koneksikan akun Midtrans Anda agar sistem mendeteksi pembayaran QRIS & VA secara otomatis. Jika Server Key kosong, sistem akan menggunakan simulator otomatis.
                </p>
              </div>

              {/* TOGGLE SAKLAR ON / OFF MIDTRANS */}
              <div className={`p-4 rounded-2xl border transition-all ${
                formEnableMidtrans 
                  ? 'bg-emerald-50/70 border-emerald-200/90' 
                  : 'bg-rose-50/70 border-rose-200/90'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        formEnableMidtrans ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {formEnableMidtrans ? '🟢 MIDTRANS ONLINE (AKTIF)' : '🔴 MIDTRANS OFFLINE (NON-AKTIF)'}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">Status Gateway User</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {formEnableMidtrans 
                        ? 'Fitur pembayaran Midtrans (QRIS/VA) saat ini AKTIF di portal user. Member dapat melakukan pembayaran otomatis.'
                        : 'Fitur pembayaran Midtrans saat ini DINONAKTIFKAN. Portal user akan otomatis mengalihkan pembayaran ke Transfer Bank Manual.'
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFormEnableMidtrans(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                        formEnableMidtrans 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      🟢 ON (Aktif)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormEnableMidtrans(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                        !formEnableMidtrans 
                          ? 'bg-rose-600 text-white shadow-xs' 
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      🔴 OFF (Mati)
                    </button>
                  </div>
                </div>
              </div>
                  
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

                  {/* REKENING BANK TRANSFER ADMIN (POPUP REPEAT ORDER) */}
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                        <CreditCard className="text-emerald-600 w-4.5 h-4.5" /> Rekening Bank Transfer Admin (Popup Repeat Order)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Input nomor rekening bank perusahaan/admin yang akan muncul di popup Repeat Order (RO) portal member.
                      </p>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Rekening Utama (Bank 1)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Nama Bank *</label>
                          <input
                            type="text"
                            placeholder="Contoh: BCA / MANDIRI / BRI"
                            value={formCompanyBankName}
                            onChange={(e) => setFormCompanyBankName(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">No. Rekening *</label>
                          <input
                            type="text"
                            placeholder="1234-5678-90"
                            value={formCompanyBankAccount}
                            onChange={(e) => setFormCompanyBankAccount(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Atas Nama Pemilik *</label>
                          <input
                            type="text"
                            placeholder="PT HEDTRO JEANS INDONESIA"
                            value={formCompanyBankHolder}
                            onChange={(e) => setFormCompanyBankHolder(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
                          />
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block pt-2 border-t border-slate-200">Rekening Tambahan (Bank 2 - Opsional)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Nama Bank 2</label>
                          <input
                            type="text"
                            placeholder="Contoh: MANDIRI"
                            value={formCompanyBank2Name}
                            onChange={(e) => setFormCompanyBank2Name(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">No. Rekening 2</label>
                          <input
                            type="text"
                            placeholder="0987-6543-21"
                            value={formCompanyBank2Account}
                            onChange={(e) => setFormCompanyBank2Account(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Atas Nama Pemilik 2</label>
                          <input
                            type="text"
                            placeholder="PT HEDTRO JEANS INDONESIA"
                            value={formCompanyBank2Holder}
                            onChange={(e) => setFormCompanyBank2Holder(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
                          />
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block pt-2 border-t border-slate-200">Rekening Tambahan (Bank 3 - Opsional)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Nama Bank 3</label>
                          <input
                            type="text"
                            placeholder="Contoh: BRI"
                            value={formCompanyBank3Name}
                            onChange={(e) => setFormCompanyBank3Name(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">No. Rekening 3</label>
                          <input
                            type="text"
                            placeholder="5544-3322-11"
                            value={formCompanyBank3Account}
                            onChange={(e) => setFormCompanyBank3Account(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Atas Nama Pemilik 3</label>
                          <input
                            type="text"
                            placeholder="PT HEDTRO JEANS INDONESIA"
                            value={formCompanyBank3Holder}
                            onChange={(e) => setFormCompanyBank3Holder(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-slate-200">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Catatan / Instruksi Transfer Untuk Member</label>
                        <textarea
                          rows={2}
                          placeholder="Petunjuk transfer untuk member..."
                          value={formCompanyBankInstruction}
                          onChange={(e) => setFormCompanyBankInstruction(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md cursor-pointer flex items-center gap-2"
                    >
                      💾 Simpan Gateway & Rekening Bank
                    </button>
                  </div>
            </div>
          )}

          {/* SUB-TAB 2: MLM & SKEMA BONUS */}
          {settingsSubTab === 'mlm' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
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

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md cursor-pointer flex items-center gap-2"
                    >
                      💾 Simpan Pengaturan MLM & Bonus
                    </button>
                  </div>
            </div>
          )}

          {/* SUB-TAB 4: NOTIFIKASI EMAIL & SMTP */}
          {settingsSubTab === 'email' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
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

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md cursor-pointer flex items-center gap-2"
                      >
                        💾 Simpan Pengaturan Email & SMTP
                      </button>
                    </div>
                  </div>
              )}

              {/* SUB-TAB 5: BACKUP, RESTORE & RESET DATA */}
              {settingsSubTab === 'backup' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
                      <RefreshCw className="text-blue-600 w-4.5 h-4.5" /> Backup, Restore & Reset Database Terpisah
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kelola pemeliharaan sistem secara terpisah untuk Member, Pengaturan Web, Jaringan MLM, dan Data Penjualan. Setiap modul dapat di-backup ke file JSON, di-restore, atau di-reset secara mandiri.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* CATEGORY 1: MEMBERS (SELAIN ADMIN) */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">Modul 1</span>
                          <span className="text-xs font-bold text-slate-500">{users.filter(u => u.role !== 'admin' && Number(u.id) !== 1).length} Member</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" /> Data Member & Anggota (Selain Admin)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Menyimpan profil member, kontak, alamat, rekening bank member, status aktivasi, serta saldo dompet.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadJSON(
                              users.filter(u => u.role !== 'admin' && Number(u.id) !== 1),
                              `backup-member-hedtro-${new Date().toISOString().slice(0,10)}.json`
                            )}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Backup Member JSON
                          </button>

                          <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center">
                            <span>📤 Restore Member</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => handleBackupRestoreUpload(e, 'members')}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmReset('members', 'Data Member (selain Admin)')}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ⚠️ Reset Semua Data Member
                        </button>
                      </div>
                    </div>

                    {/* CATEGORY 2: DATABASE PENGATURAN WEB & BRANDING */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">Modul 2</span>
                          <span className="text-xs font-bold text-slate-500">Konfigurasi & Branding</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-amber-600" /> Database Pengaturan Web & Sistem
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Menyimpan nama web, logo, running text, nomor WA admin, tarif bonus MLM, kredensial Midtrans, dan email SMTP.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadJSON(
                              settings,
                              `backup-settings-hedtro-${new Date().toISOString().slice(0,10)}.json`
                            )}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Backup Web Settings JSON
                          </button>

                          <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center">
                            <span>📤 Restore Web Settings</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => handleBackupRestoreUpload(e, 'web_settings')}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmReset('web_settings', 'Database Pengaturan Web')}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ⚠️ Reset Pengaturan Web Ke Default
                        </button>
                      </div>
                    </div>

                    {/* CATEGORY 3: STRUKTUR JARINGAN MLM & BONUSES */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">Modul 3</span>
                          <span className="text-xs font-bold text-slate-500">Pohon Binary & Omset</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Percent className="w-4 h-4 text-purple-600" /> Pohon Jaringan MLM & Rekap Komisi
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Menyimpan relasi sponsor, upline, posisi kiri/kanan, jumlah titik kaki kiri/kanan, omset, dan total akumulasi komisi.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadJSON(
                              users.map(u => ({
                                id: u.id,
                                username: u.username,
                                sponsor_id: u.sponsor_id,
                                upline_id: u.upline_id,
                                position: u.position,
                                left_count: u.left_count,
                                right_count: u.right_count,
                                left_sales: u.left_sales,
                                right_sales: u.right_sales,
                                sponsor_bonus: u.sponsor_bonus,
                                pairing_bonus: u.pairing_bonus,
                                level_bonus: u.level_bonus,
                                ro_bonus: u.ro_bonus
                              })),
                              `backup-jaringan-mlm-hedtro-${new Date().toISOString().slice(0,10)}.json`
                            )}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Backup Jaringan MLM JSON
                          </button>

                          <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center">
                            <span>📤 Restore Jaringan MLM</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => handleBackupRestoreUpload(e, 'mlm_network')}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmReset('mlm_network', 'Struktur Jaringan MLM & Komisi')}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ⚠️ Reset Pohon Jaringan & Rekap Bonus
                        </button>
                      </div>
                    </div>

                    {/* CATEGORY 4: DATA PENJUALAN, ORDER & TRANSAKSI */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Modul 4</span>
                          <span className="text-xs font-bold text-slate-500">Invoice & Transaksi</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" /> Data Penjualan, Invoice & Mutasi
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Menyimpan daftar order produk, nomor resi pengiriman, mutasi komisi, riwayat deposit, dan permintaan penarikan (WD).
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadJSON(
                              { orders: orders || [], transactions: transactions || [], deposits: deposits || [], withdrawals: withdrawals || [] },
                              `backup-penjualan-hedtro-${new Date().toISOString().slice(0,10)}.json`
                            )}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Backup Penjualan JSON
                          </button>

                          <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center">
                            <span>📤 Restore Penjualan</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => handleBackupRestoreUpload(e, 'sales')}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmReset('sales', 'Data Penjualan, Order & Transaksi')}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ⚠️ Reset Seluruh Riwayat Penjualan & Transaksi
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </form>

          </div>
        )}

          {/* TAB: PROFILE MENU */}
          {activeTab === 'profil' && (
            <div className="space-y-6" id="admin-profile-panel">
              
              {/* Admin Hero Header Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 p-1 shrink-0 shadow-lg shadow-indigo-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center font-display font-black text-2xl text-indigo-400">
                      {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'A'}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        🛡️ SYSTEM ADMINISTRATOR
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                        @{user?.username || 'admin'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                      {user?.fullname || 'Administrator Area'}
                    </h2>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 font-medium">
                      <span>Email: <strong className="text-white font-mono">{user?.email || '-'}</strong></span>
                      <span>•</span>
                      <span>WhatsApp: <strong className="text-emerald-400 font-mono">{user?.phone || '-'}</strong></span>
                    </div>

                    <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => setIsWorkflowModalOpen(true)}
                        className="bg-[#C41230] hover:bg-[#A00E26] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <FileText className="w-4 h-4" /> Unduh / Lihat Bagan Alur Kerja (PDF)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile & Security Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Form 1: Informasi Admin */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" /> Informasi Akun Admin
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">Identitas Resmi</span>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Nama Lengkap Admin</label>
                        <input
                          type="text"
                          required
                          value={profileFullname}
                          onChange={(e) => setProfileFullname(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Email Resmi Admin</label>
                          <input
                            type="email"
                            required
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">No. WA Official</label>
                          <input
                            type="text"
                            required
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-blue-600 font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Konfirmasi Kata Sandi Aktif</label>
                        <input
                          type="password"
                          required
                          placeholder="Masukkan kata sandi saat ini"
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                        />
                        <p className="text-[10px] text-slate-400">Verifikasi keamanan opsional untuk mencegah akses ilegal perubahan data master admin.</p>
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-save-profile"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {loading ? "Memproses..." : "💾 Simpan Profil Admin"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Form 2: Reset Password Admin */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-600" /> Keamanan & Kata Sandi
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">Privasi Akses System</span>
                    </div>

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Kata Sandi Saat Ini</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Kata Sandi Baru</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 Karakter"
                            className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Ulangi Sandi Baru</label>
                          <input
                            type="password"
                            required
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Samakan sandi"
                            className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-2 text-[10px] text-slate-400 italic">
                        *Ganti kata sandi secara berkala untuk menjaga kerahasiaan seluruh database member dan kas perusahaan.
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-reset-password"
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? "Memproses..." : "🔒 Perbarui Kata Sandi Admin"}
                      </button>
                    </form>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: ORDER MANAGEMENT & RESI TRACKING */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-left" id="admin-orders-panel">
              {/* Header & Action */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 text-left">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 text-left">
                    <Truck className="text-blue-600 w-5 h-5 shrink-0" /> Lacak & Kelola Resi Pesanan Pelanggan
                  </h3>
                  <p className="text-xs text-slate-500 text-left">Kelola pesanan dari pendaftaran member baru atau pembelian produk, update nomor resi ekspedisi, dan ubah status pengiriman secara real-time.</p>
                </div>
                
                <button
                  id="btn-open-add-order-modal"
                  onClick={() => setIsAddOrderModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Order Manual
                </button>
              </div>

              {/* Shipping Tracking Mode Selector (API Otomatis Gratis vs Manual) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 text-left">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block text-left">PILIHAN MODE OPERASIONAL PENGIRIMAN</span>
                    <p className="text-xs font-bold text-slate-800 text-left">
                      Mode Aktif: {settings?.shippingTrackingMode === 'MANUAL' ? '✍️ Mode Manual (Admin Input)' : '⚡ Mode API Otomatis (Gratis / Binderbyte API)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <button
                      onClick={() => handleSaveShippingMode('AUTO_API')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        settings?.shippingTrackingMode !== 'MANUAL'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⚡ API Otomatis (Gratis)
                    </button>
                    <button
                      onClick={() => handleSaveShippingMode('MANUAL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        settings?.shippingTrackingMode === 'MANUAL'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ✍️ Manual Input
                    </button>
                  </div>
                </div>

                {settings?.shippingTrackingMode !== 'MANUAL' && (
                  <div className="text-xs space-y-2 bg-white p-3 rounded-xl border border-slate-200/80 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                      <p className="text-[11px] text-slate-600 text-left">
                        <strong className="text-slate-800">Sistem API Lacak Resi:</strong> Menggunakan endpoint gratis bawaan & mendukung API Key Binderbyte (JNE, POS, J&T, SiCepat, TIKI, Wahana, Ninja, AnterAja, SPX).
                      </p>
                      <button
                        onClick={async () => {
                          setLoading(true);
                          for (const o of orders) {
                            if (o.tracking_number) {
                              await handleSyncShippingApi(o);
                            }
                          }
                          setLoading(false);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 justify-center cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Sync Semua Resi
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-left">
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap text-left">API Key Binderbyte (Opsional):</span>
                      <input
                        type="text"
                        placeholder="Masukkan API Key Binderbyte jika punya (Kosongkan jika ingin sistem lacak gratis otomatis)"
                        defaultValue={settings?.shippingApiKey || ''}
                        onBlur={(e) => handleSaveShippingMode('AUTO_API', e.target.value)}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 focus:bg-white focus:border-blue-500 w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Bar & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {(['ALL', 'DIPROSES', 'DIKIRIM', 'TERIMA', 'BATAL'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua Order' : st === 'DIPROSES' ? 'Diproses Gudang' : st === 'DIKIRIM' ? 'Dalam Pengiriman' : st === 'TERIMA' ? 'Selesai / Diterima' : 'Dibatalkan'}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari invoice, nama, resi, HP..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Orders Mobile View (1 Column) */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {orders
                  .filter(o => {
                    if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
                    if (!orderSearchQuery) return true;
                    const q = orderSearchQuery.toLowerCase();
                    const totalTrf = (o.amount || 0) + (o.unique_code || 0);
                    return (
                      (o.invoice_no && o.invoice_no.toLowerCase().includes(q)) ||
                      (o.fullname && o.fullname.toLowerCase().includes(q)) ||
                      (o.username && o.username.toLowerCase().includes(q)) ||
                      (o.tracking_number && o.tracking_number.toLowerCase().includes(q)) ||
                      (o.phone && o.phone.toLowerCase().includes(q)) ||
                      (o.unique_code && String(o.unique_code).includes(q)) ||
                      String(totalTrf).includes(q)
                    );
                  })
                  .slice((pageOrders - 1) * 10, pageOrders * 10)
                  .map((ord) => {
                    const totalTrf = (ord.amount || 0) + (ord.unique_code || 0);
                    return (
                      <div key={ord.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold font-mono text-slate-900 text-xs">{ord.invoice_no}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              ord.status === 'TERIMA' ? 'bg-green-100 text-green-800' :
                              ord.status === 'DIKIRIM' ? 'bg-blue-100 text-blue-800' :
                              ord.status === 'BATAL' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.status === 'TERIMA' ? 'SELESAI' : ord.status === 'DIKIRIM' ? 'DIKIRIM' : ord.status === 'BATAL' ? 'BATAL' : 'DIPROSES'}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 text-xs">{ord.fullname} <span className="text-blue-600 font-normal">(@{ord.username})</span></p>
                          <div className="mt-1">
                            <p className="text-[11px] text-slate-700 font-medium">{ord.product_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-black text-blue-600 font-mono">
                                Rp {totalTrf.toLocaleString('id-ID')}
                              </span>
                              {ord.unique_code ? (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-black text-[9px]">
                                  Kode Unik: #{ord.unique_code}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{ord.address}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">{ord.courier || 'JNE'}</span>
                            {ord.tracking_number ? (
                              <span className="font-mono font-bold text-blue-600 text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Resi: {ord.tracking_number}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 italic">Belum ada resi</span>
                            )}
                          </div>

                          {ord.proof_image && (
                            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <img src={ord.proof_image} alt="Bukti Transfer" className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer shrink-0" onClick={() => setViewAdminProofImage(ord.proof_image || null)} />
                                <div>
                                  <span className="text-[10px] font-extrabold text-emerald-800 block">✅ Bukti Transfer Ada</span>
                                  {ord.proof_notes && <p className="text-[9px] text-slate-600 font-mono leading-tight">{ord.proof_notes}</p>}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewAdminProofImage(ord.proof_image || null)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 shadow-2xs"
                              >
                                Lihat Foto
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          {settings?.shippingTrackingMode !== 'MANUAL' && (
                            <button
                              onClick={() => handleSyncShippingApi(ord)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Auto-Sync
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditOrderModal(ord)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingOrderId(ord.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {orders.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">Belum ada data order pesanan.</div>
                )}
              </div>

              {/* Orders Table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase font-extrabold text-[10px] text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">No. Invoice & Waktu</th>
                      <th className="px-4 py-3">Pemesan & Alamat Kirim</th>
                      <th className="px-4 py-3">Produk & Nominal</th>
                      <th className="px-4 py-3">Ekspedisi & Nomor Resi</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter(o => {
                        if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
                        if (!orderSearchQuery) return true;
                        const q = orderSearchQuery.toLowerCase();
                        const totalTrf = (o.amount || 0) + (o.unique_code || 0);
                        return (
                          (o.invoice_no && o.invoice_no.toLowerCase().includes(q)) ||
                          (o.fullname && o.fullname.toLowerCase().includes(q)) ||
                          (o.username && o.username.toLowerCase().includes(q)) ||
                          (o.tracking_number && o.tracking_number.toLowerCase().includes(q)) ||
                          (o.phone && o.phone.toLowerCase().includes(q)) ||
                          (o.unique_code && String(o.unique_code).includes(q)) ||
                          String(totalTrf).includes(q)
                        );
                      })
                      .slice((pageOrders - 1) * 10, pageOrders * 10)
                      .map((ord) => {
                        const totalTrf = (ord.amount || 0) + (ord.unique_code || 0);
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3.5 align-top">
                              <span className="font-bold text-slate-900 font-mono block">{ord.invoice_no}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(ord.created_at).toLocaleString('id-ID')}</span>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                  {ord.payment_method || 'Transfer Bank'}
                                </span>
                                {ord.proof_image ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewAdminProofImage(ord.proof_image || null)}
                                    className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded transition cursor-pointer border border-emerald-300 shadow-2xs"
                                  >
                                    <Camera className="w-3 h-3 text-emerald-700" />
                                    Bukti Ada
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                    Belum TF
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 align-top max-w-xs">
                              <p className="font-bold text-slate-900">{ord.fullname}</p>
                              <p className="text-[10px] text-blue-600 font-semibold font-mono">@{ord.username}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{ord.phone}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{ord.address}</p>
                            </td>

                            <td className="px-4 py-3.5 align-top">
                              <p className="font-bold text-slate-800 line-clamp-1">{ord.product_name}</p>
                              <p className="font-black text-blue-600 font-mono mt-1 text-xs">Rp {totalTrf.toLocaleString('id-ID')}</p>
                              {ord.unique_code ? (
                                <div className="mt-1">
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-black text-[9px] inline-block">
                                    Kode Unik: #{ord.unique_code}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-mono mt-0.5">
                                    (Pokok Rp {(ord.amount || 0).toLocaleString('id-ID')})
                                  </span>
                                </div>
                              ) : null}
                            </td>

                          <td className="px-4 py-3.5 align-top">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                              <Truck className="w-3 h-3 text-blue-600" /> {ord.courier || 'JNE REGULER'}
                            </span>
                            <div className="mt-1">
                              {ord.tracking_number ? (
                                <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                                  {ord.tracking_number}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 italic">Belum ada nomor resi</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-top text-center">
                            <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              ord.status === 'TERIMA' ? 'bg-green-100 text-green-800 border border-green-200' :
                              ord.status === 'DIKIRIM' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              ord.status === 'BATAL' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {ord.status === 'TERIMA' ? 'SELESAI' : ord.status === 'DIKIRIM' ? 'DIKIRIM' : ord.status === 'BATAL' ? 'BATAL' : 'DIPROSES'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 align-top text-center">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                              {settings?.shippingTrackingMode !== 'MANUAL' && (
                                <button
                                  onClick={() => handleSyncShippingApi(ord)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                                  title="Sinkronisasi Live API"
                                >
                                  <RefreshCw className="w-3 h-3" /> Auto-Sync
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditOrderModal(ord)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                                title="Update Resi & Status"
                              >
                                <Edit className="w-3 h-3" /> Edit Manual
                              </button>
                              <button
                                onClick={() => setDeletingOrderId(ord.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition cursor-pointer"
                                title="Hapus Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-600">Belum Ada Data Order Pesanan</p>
                          <p className="text-xs">Klik tombol "Tambah Order Manual" di atas untuk membuat order baru.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={pageOrders}
                totalItems={orders.filter(o => {
                  if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
                  if (!orderSearchQuery) return true;
                  const q = orderSearchQuery.toLowerCase();
                  return (
                    (o.invoice_no && o.invoice_no.toLowerCase().includes(q)) ||
                    (o.fullname && o.fullname.toLowerCase().includes(q)) ||
                    (o.username && o.username.toLowerCase().includes(q)) ||
                    (o.tracking_number && o.tracking_number.toLowerCase().includes(q)) ||
                    (o.phone && o.phone.toLowerCase().includes(q))
                  );
                }).length}
                itemsPerPage={10}
                onPageChange={setPageOrders}
              />
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
                
                {/* 0. KELOLA SLIDER BANNER UTAMA (HERO CAROUSEL) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> 0. Kelola Slider Utama (Hero Banner Carousel)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Tambah, edit, hapus, dan atur urutan gambar slider banner utama halaman depan.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddSlideModal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Tambah Banner Slide Baru
                    </button>
                  </div>

                  {/* List of Sliders */}
                  <div className="grid grid-cols-1 gap-3">
                    {formHeroSliders.map((slide, index) => (
                      <div key={slide.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:w-36 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                          {slide.badge && (
                            <span className="absolute top-2 left-2 bg-slate-900/80 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                              {slide.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1 text-left w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                              Slide #{index + 1}
                            </span>
                            {slide.categoryTarget && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md uppercase">
                                Target: {slide.categoryTarget}
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-xs line-clamp-1">{slide.title}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{slide.subtitle}</p>
                          {slide.cta && (
                            <p className="text-[10px] font-bold text-blue-600 font-mono">Tombol CTA: {slide.cta}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveSlide(index, 'up')}
                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Geser Ke Atas"
                          >
                            <ArrowUpRight className="w-4 h-4 rotate-[-45deg]" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formHeroSliders.length - 1}
                            onClick={() => handleMoveSlide(index, 'down')}
                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Geser Ke Bawah"
                          >
                            <ArrowDownLeft className="w-4 h-4 rotate-[-45deg]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlideModal(slide)}
                            className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition cursor-pointer"
                            title="Edit Slide"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition cursor-pointer"
                            title="Hapus Slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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

      {/* Hidden file inputs for uploading product photos */}
      <input
        type="file"
        ref={newProductFileInputRef}
        onChange={(e) => handleProductImageFileChange(e, 'new')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={editProductFileInputRef}
        onChange={(e) => handleProductImageFileChange(e, 'edit')}
        accept="image/*"
        className="hidden"
      />

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
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Foto & Gambar Produk</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center shadow-inner">
                    {editingModalProduct.image ? (
                      <img referrerPolicy="no-referrer" src={editingModalProduct.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editProductFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> {editingModalProduct.image ? 'Ganti File Foto' : 'Upload File Foto'}
                      </button>
                      {editingModalProduct.image && (
                        <button
                          type="button"
                          onClick={() => setEditingModalProduct({ ...editingModalProduct, image: '' })}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {editingModalProduct.image ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Foto produk terpasang & siap disimpan ke database!
                        </span>
                      ) : (
                        'Upload foto produk dari galeri HP/laptop untuk disimpan di database.'
                      )}
                    </p>
                  </div>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pilihan Size (pisahkan koma)</label>
                  <input
                    type="text"
                    placeholder="28, 29, 30, 31, 32, 33"
                    value={editingModalProduct.sizes ? editingModalProduct.sizes.join(', ') : ''}
                    onChange={(e) => setEditingModalProduct({
                      ...editingModalProduct,
                      sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full text-xs font-mono font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pilihan Warna (pisahkan koma)</label>
                  <input
                    type="text"
                    placeholder="Indigo, Black, Light Wash"
                    value={editingModalProduct.colors ? editingModalProduct.colors.join(', ') : ''}
                    onChange={(e) => setEditingModalProduct({
                      ...editingModalProduct,
                      colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Label / Badge Produk (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: BEST SELLER, DISKON 20%, NEW ARRIVAL, HOT ITEM (Kosongkan jika tidak ada)"
                    value={editingModalProduct.badge || ''}
                    onChange={(e) => setEditingModalProduct({ ...editingModalProduct, badge: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                  {editingModalProduct.badge && (
                    <button
                      type="button"
                      onClick={() => setEditingModalProduct({ ...editingModalProduct, badge: '' })}
                      className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl whitespace-nowrap cursor-pointer transition"
                    >
                      Hapus Badge
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  Label promo/status opsional yang akan muncul di pojok gambar produk (misal: BEST SELLER, DISKON 30%, HOT, NEW).
                </p>
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Foto & Gambar Produk Celana Jeans</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center shadow-inner">
                    {newProdImage ? (
                      <img referrerPolicy="no-referrer" src={newProdImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => newProductFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> {newProdImage ? 'Ganti File Foto' : 'Pilih File Foto'}
                      </button>
                      {newProdImage && (
                        <button
                          type="button"
                          onClick={() => setNewProdImage('')}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {newProdImage ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> File foto siap disimpan ke database!
                        </span>
                      ) : (
                        'Pilih file foto produk dari galeri HP/laptop untuk disimpan ke database.'
                      )}
                    </p>
                  </div>
                </div>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pilihan Size (pisahkan koma)</label>
                  <input
                    type="text"
                    placeholder="28, 29, 30, 31, 32, 33, 34, 35, 36"
                    value={newProdSizesStr}
                    onChange={(e) => setNewProdSizesStr(e.target.value)}
                    className="w-full text-xs font-mono font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pilihan Warna (pisahkan koma)</label>
                  <input
                    type="text"
                    placeholder="Deep Indigo Blue, Jet Black, Light Wash"
                    value={newProdColorsStr}
                    onChange={(e) => setNewProdColorsStr(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Label / Badge Produk (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BEST SELLER, DISKON 20%, NEW ARRIVAL, HOT ITEM"
                  value={newProdBadge}
                  onChange={(e) => setNewProdBadge(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
                <p className="text-[9px] text-slate-400 mt-1">
                  Boleh dikosongkan jika tidak ingin menampilkan badge promo di foto produk.
                </p>
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

      {/* MODAL POPUP 4: EDIT ORDER, RESI, STATUS & STEPS */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" /> Update Resi & Status Order: <span className="font-mono text-blue-600">{editingOrder.invoice_no}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pemesan: <strong>{editingOrder.fullname}</strong> (@{editingOrder.username})</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pilih Kurir Ekspedisi</label>
                  <select
                    value={editOrderCourier}
                    onChange={(e) => setEditOrderCourier(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                  >
                    <option value="JNE REGULER">JNE REGULER</option>
                    <option value="JNE YES">JNE YES</option>
                    <option value="J&T EXPRESS">J&T EXPRESS</option>
                    <option value="SICEPAT REG">SICEPAT REG</option>
                    <option value="POS INDONESIA">POS INDONESIA</option>
                    <option value="TIKI REG">TIKI REG</option>
                    <option value="ANTERAJA">ANTERAJA</option>
                    <option value="GOSEND / GRAB">GOSEND / GRAB</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-blue-600 block mb-1">Nomor Resi Pengiriman</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: JNE-882739182"
                    value={editOrderTracking}
                    onChange={(e) => setEditOrderTracking(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-blue-300 text-blue-700 bg-blue-50/50 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status Pengiriman Order</label>
                <select
                  value={editOrderStatus}
                  onChange={(e) => setEditOrderStatus(e.target.value as any)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="DIPROSES">DIPROSES (Gudang sedang menyiapkan produk)</option>
                  <option value="DIKIRIM">DIKIRIM (Sudah diserahkan ke kurir & jalan)</option>
                  <option value="TERIMA">TERIMA (Pesanan selesai & diterima pelanggan)</option>
                  <option value="BATAL">BATAL (Pesanan dibatalkan / direfund)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Catatan Tambahan Pengiriman</label>
                <input
                  type="text"
                  placeholder="Contoh: Paket di-drop di JNE Cabang Utama Pukul 14:00 WIB"
                  value={editOrderNotes}
                  onChange={(e) => setEditOrderNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {/* TIMELINE STEPS EDITOR */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Riwayat Tahapan Lacak Pesanan (Timeline)</label>
                
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                  {editOrderSteps.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={st.done}
                          onChange={() => handleToggleStepDone(idx)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <div>
                          <p className={`font-bold ${st.done ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{st.title}</p>
                          <p className="text-[10px] text-slate-500">{st.time} — {st.description || '-'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditOrderSteps(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ADD NEW STEP FORM */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Judul Step (cth: Tiba di Sorting Hub Jakarta)"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Keterangan singkat"
                    value={newStepDesc}
                    onChange={(e) => setNewStepDesc(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={handleAddStepToOrder}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer"
                  >
                    + Step
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Resi & Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POPUP 5: ADD MANUAL ORDER */}
      {isAddOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" /> Buat Order Pesanan Manual
              </h3>
              <button onClick={() => setIsAddOrderModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nama Lengkap Pemesan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newOrderFullname}
                  onChange={(e) => setNewOrderFullname(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Username Member (Optional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: budi"
                    value={newOrderUsername}
                    onChange={(e) => setNewOrderUsername(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    required
                    placeholder="08123456789"
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Alamat Lengkap Pengiriman</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Merdeka No. 45, Kota Surabaya, Jawa Timur"
                  value={newOrderAddress}
                  onChange={(e) => setNewOrderAddress(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nama Produk / Paket</label>
                <input
                  type="text"
                  required
                  value={newOrderProduct}
                  onChange={(e) => setNewOrderProduct(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Bayar (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newOrderAmount}
                    onChange={(e) => setNewOrderAmount(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Kurir</label>
                  <select
                    value={newOrderCourier}
                    onChange={(e) => setNewOrderCourier(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="JNE REGULER">JNE REGULER</option>
                    <option value="J&T EXPRESS">J&T EXPRESS</option>
                    <option value="SICEPAT REG">SICEPAT REG</option>
                    <option value="POS INDONESIA">POS INDONESIA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-blue-600 block mb-1">Nomor Resi (Boleh Dikosongkan Dulu)</label>
                <input
                  type="text"
                  placeholder="Otomatis dibuat jika kosong"
                  value={newOrderTracking}
                  onChange={(e) => setNewOrderTracking(e.target.value)}
                  className="w-full text-xs font-mono border border-blue-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {loading ? "Membuat..." : "Buat Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POPUP 6: CONFIRM DELETE ORDER */}
      {deletingOrderId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Order Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data order ini dari sistem?
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeletingOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteOrderConfirm}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10 cursor-pointer"
              >
                {loading ? "Menghapus..." : "Ya, Hapus Order"}
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

      {/* USER DETAIL POPUP MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                    Detail Anggota Jaringan
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    ID Member: #{selectedUserDetail.id} • Registered {selectedUserDetail.created_at ? new Date(selectedUserDetail.created_at).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* Profile Header Card with Photo */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Photo Preview */}
                <div className="relative shrink-0">
                  {selectedUserDetail.profile_photo ? (
                    <img
                      src={selectedUserDetail.profile_photo}
                      alt={selectedUserDetail.fullname || selectedUserDetail.username}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-md border-2 border-white">
                      {(selectedUserDetail.fullname || selectedUserDetail.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border-2 border-white shadow-2xs ${
                    selectedUserDetail.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {selectedUserDetail.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>

                {/* Main Metadata */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-base sm:text-lg font-black text-slate-900">{selectedUserDetail.fullname || selectedUserDetail.username}</h4>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wide">
                      {selectedUserDetail.role === 'admin' ? 'Administrator' : 'Member Premium'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-blue-600 font-mono">@{selectedUserDetail.username.replace(/^@/, '')}</p>
                  
                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start text-xs text-slate-600 font-medium">
                    <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      📧 {selectedUserDetail.email || '-'}
                    </span>
                    <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      📱 {selectedUserDetail.phone || selectedUserDetail.whatsapp || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Info Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Informasi Pribadi & Kontak */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> Informasi Diri & Kontak
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">No. KTP / NIK</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedUserDetail.ktp || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">WhatsApp</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedUserDetail.whatsapp || selectedUserDetail.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Kota / Kabupaten</span>
                      <span className="font-bold text-slate-900">{selectedUserDetail.city || '-'}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-500 font-medium block mb-0.5">Alamat Lengkap</span>
                      <span className="font-semibold text-slate-800 text-[11px] leading-snug block bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                        {selectedUserDetail.address || 'Belum melengkapi alamat.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Informasi Rekening Bank */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Bank & Rekening Pencairan
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Nama Bank</span>
                      <span className="font-bold text-slate-900 uppercase">{selectedUserDetail.bank_name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">No. Rekening</span>
                      <span className="font-bold text-blue-600 font-mono">{selectedUserDetail.bank_account || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Atas Nama</span>
                      <span className="font-bold text-slate-900">{selectedUserDetail.bank_holder || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Posisi Struktur & Sponsor */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Posisi Struktur Binary & Sponsor
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Upline Direct</span>
                      <span className="font-bold text-slate-900">
                        {(() => {
                          const uplineUser = (users || []).find(x => Number(x.id) === Number(selectedUserDetail.upline_id));
                          return uplineUser ? `@${uplineUser.username.replace(/^@/, '')}` : 'Root (Teratas)';
                        })()}
                        <span className="text-blue-600 ml-1 font-mono font-black">({selectedUserDetail.position || 'L'})</span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Sponsor Direct</span>
                      <span className="font-bold text-slate-900">
                        {(() => {
                          const sponsorUser = (users || []).find(x => Number(x.id) === Number(selectedUserDetail.sponsor_id));
                          return sponsorUser ? `@${sponsorUser.username.replace(/^@/, '')}` : (selectedUserDetail.sponsor_username || '-');
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Tim Member (L / R)</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedUserDetail.left_count || 0} Kiri / {selectedUserDetail.right_count || 0} Kanan</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Omset Poin (L / R)</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedUserDetail.left_sales || 0} Kiri / {selectedUserDetail.right_sales || 0} Kanan</span>
                    </div>
                  </div>
                </div>

                {/* 4. Rincian Saldo & Bonus Terakumulasi */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" /> Saldo & Perolehan Bonus
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Saldo Dompet Tersedia</span>
                      <span className="font-black text-slate-900 font-mono text-sm">Rp {(selectedUserDetail.balance || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Bonus Sponsor</span>
                      <span className="font-bold text-slate-800 font-mono">Rp {(selectedUserDetail.sponsor_bonus || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Bonus Pasangan (Pairing)</span>
                      <span className="font-bold text-slate-800 font-mono">Rp {(selectedUserDetail.pairing_bonus || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Bonus Level (10 Generasi)</span>
                      <span className="font-bold text-slate-800 font-mono">Rp {(selectedUserDetail.level_bonus || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Bonus Repeat Order (RO)</span>
                      <span className="font-bold text-slate-800 font-mono">Rp {(selectedUserDetail.ro_bonus || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 pt-2 border-t border-slate-200 text-slate-900 font-black bg-green-50 p-2.5 rounded-lg border border-green-200">
                      <span>Total Bonus Terakumulasi</span>
                      <span className="text-green-700 font-mono text-sm">
                        Rp {((selectedUserDetail.sponsor_bonus || 0) + (selectedUserDetail.pairing_bonus || 0) + (selectedUserDetail.level_bonus || 0) + (selectedUserDetail.ro_bonus || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition cursor-pointer shadow-sm"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: ADD MEMBER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Tambah Member Baru</h3>
                  <p className="text-slate-400 text-xs">Pendaftaran anggota baru ke jaringan MLM</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="misal: budi123"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Nama sesuai KTP"
                    value={newUserForm.fullname}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullname: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / Telp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. KTP</label>
                  <input
                    type="text"
                    placeholder="351234567890001"
                    value={newUserForm.ktp}
                    onChange={(e) => setNewUserForm({ ...newUserForm, ktp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Penempatan Jaringan Binary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Username Sponsor</label>
                    <input
                      type="text"
                      placeholder="Username Sponsor"
                      value={newUserForm.sponsor_username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, sponsor_username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Username Upline</label>
                    <input
                      type="text"
                      placeholder="Username Upline"
                      value={newUserForm.upline_username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, upline_username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Posisi Kaki</label>
                    <select
                      value={newUserForm.position}
                      onChange={(e) => setNewUserForm({ ...newUserForm, position: e.target.value as 'L' | 'R' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                      <option value="L">Kiri (Left)</option>
                      <option value="R">Kanan (Right)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Data Bank / Payout</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      placeholder="BCA / MANDIRI / BRI"
                      value={newUserForm.bank_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, bank_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. Rekening</label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      value={newUserForm.bank_account}
                      onChange={(e) => setNewUserForm({ ...newUserForm, bank_account: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Atas Nama Bank</label>
                    <input
                      type="text"
                      placeholder="Sesuai buku tabungan"
                      value={newUserForm.bank_holder}
                      onChange={(e) => setNewUserForm({ ...newUserForm, bank_holder: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Simpan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT MEMBER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 rounded-xl">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Edit Data Member @{editingUser.username.replace(/^@/, '')}</h3>
                  <p className="text-slate-400 text-xs">Ubah profil, foto, status aktif, saldo, dan bonus member</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Photo Upload */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {editUserForm.profile_photo ? (
                  <img src={editUserForm.profile_photo} alt="Profile" className="w-14 h-14 rounded-full object-cover border border-slate-300 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shrink-0">
                    {(editUserForm.fullname || editUserForm.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Foto Profil Member</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditUserForm(prev => ({ ...prev, profile_photo: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editUserForm.fullname || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, fullname: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUserForm.username || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telp / WhatsApp</label>
                  <input
                    type="text"
                    value={editUserForm.phone || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Akun</label>
                  <select
                    value={editUserForm.role || 'user'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as 'user' | 'admin' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="user">Member (User)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Keanggotaan</label>
                  <select
                    value={editUserForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.value === 'active' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="active">Aktif (Lisensi Beli Produk)</option>
                    <option value="inactive">Non-Aktif / Suspend</option>
                  </select>
                </div>
              </div>

              {/* Finance adjustment */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <h4 className="font-extrabold text-blue-600 uppercase tracking-wider text-[11px]">Penyesuaian Saldo & Bonus (Rp)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Saldo Dompet Utama</label>
                    <input
                      type="number"
                      value={editUserForm.balance ?? 0}
                      onChange={(e) => setEditUserForm({ ...editUserForm, balance: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold font-mono focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bonus Sponsor</label>
                    <input
                      type="number"
                      value={editUserForm.sponsor_bonus ?? 0}
                      onChange={(e) => setEditUserForm({ ...editUserForm, sponsor_bonus: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold font-mono focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bonus Pairing</label>
                    <input
                      type="number"
                      value={editUserForm.pairing_bonus ?? 0}
                      onChange={(e) => setEditUserForm({ ...editUserForm, pairing_bonus: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold font-mono focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bonus Level</label>
                    <input
                      type="number"
                      value={editUserForm.level_bonus ?? 0}
                      onChange={(e) => setEditUserForm({ ...editUserForm, level_bonus: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold font-mono focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <h4 className="font-extrabold text-slate-600 uppercase tracking-wider text-[11px]">Rekening Bank Member</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bank</label>
                    <input
                      type="text"
                      value={editUserForm.bank_name || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, bank_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Rekening</label>
                    <input
                      type="text"
                      value={editUserForm.bank_account || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, bank_account: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Pemilik</label>
                    <input
                      type="text"
                      value={editUserForm.bank_holder || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, bank_holder: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE MEMBER CONFIRMATION */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Konfirmasi Hapus Member</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <p>Apakah Anda yakin ingin menghapus member <strong className="text-slate-900 font-extrabold">@{deletingUser.username.replace(/^@/, '')}</strong> ({deletingUser.fullname || deletingUser.username})?</p>
              <p className="text-red-600 font-semibold text-[11px]">Seluruh riwayat transaksi & data akun member ini akan terhapus dari database.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUserConfirm}
                disabled={isDeletingUserLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeletingUserLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SLIDE */}
      {isAddSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" /> Tambah Slide Banner Utama
              </h3>
              <button onClick={() => setIsAddSlideModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlideSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Utama Banner</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder="Contoh: 501® ORIGINAL DENIM"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Judul / Deskripsi</label>
                <textarea
                  rows={2}
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  placeholder="Contoh: Potongan lurus dengan raw denim 14oz premium..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge / Label Atas</label>
                  <input
                    type="text"
                    value={slideBadge}
                    onChange={(e) => setSlideBadge(e.target.value)}
                    placeholder="KOLEKSI IKONIK"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teks Tombol CTA</label>
                  <input
                    type="text"
                    value={slideCta}
                    onChange={(e) => setSlideCta(e.target.value)}
                    placeholder="BELANJA SEKARANG"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Kategori Produk saat Di-Klik</label>
                <select
                  value={slideCategory}
                  onChange={(e) => setSlideCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="semua">Semua Produk</option>
                  <option value="pria">Pria</option>
                  <option value="wanita">Wanita</option>
                  <option value="aksesoris">Aksesoris</option>
                  <option value="diskon">Diskon</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto / Gambar Banner</label>
                <div className="space-y-2">
                  {slideImage && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={slideImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slideImage}
                      onChange={(e) => setSlideImage(e.target.value)}
                      placeholder="Paste URL Gambar (https://...) atau Upload File"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => slideFileInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={slideFileInputRef}
                    accept="image/*"
                    onChange={handleSlideImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSlideModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition shadow-xs cursor-pointer"
                >
                  Tambah Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SLIDE */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> Edit Slide Banner Utama
              </h3>
              <button onClick={() => setEditingSlide(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSlideSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Utama Banner</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Judul / Deskripsi</label>
                <textarea
                  rows={2}
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge / Label Atas</label>
                  <input
                    type="text"
                    value={slideBadge}
                    onChange={(e) => setSlideBadge(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teks Tombol CTA</label>
                  <input
                    type="text"
                    value={slideCta}
                    onChange={(e) => setSlideCta(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Kategori Produk saat Di-Klik</label>
                <select
                  value={slideCategory}
                  onChange={(e) => setSlideCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="semua">Semua Produk</option>
                  <option value="pria">Pria</option>
                  <option value="wanita">Wanita</option>
                  <option value="aksesoris">Aksesoris</option>
                  <option value="diskon">Diskon</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto / Gambar Banner</label>
                <div className="space-y-2">
                  {slideImage && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={slideImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slideImage}
                      onChange={(e) => setSlideImage(e.target.value)}
                      placeholder="Paste URL Gambar (https://...) atau Upload File"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => slideFileInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN VIEW PROOF OF TRANSFER MODAL */}
      {viewAdminProofImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setViewAdminProofImage(null)}>
          <div className="bg-white max-w-lg w-full rounded-2xl p-4 shadow-2xl relative animate-fadeIn text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewAdminProofImage(null)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" /> Bukti Transfer Member
            </h4>
            <div className="bg-slate-100 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center p-2 border border-slate-200">
              <img src={viewAdminProofImage} alt="Bukti Transfer" className="max-h-[65vh] object-contain rounded-lg" />
            </div>
            <button
              type="button"
              onClick={() => setViewAdminProofImage(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}

      {/* Workflow Diagram & PDF Generator Modal */}
      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        webName={settings?.webName || "HEDTRO JEANS"}
      />
    </div>
  );
}
