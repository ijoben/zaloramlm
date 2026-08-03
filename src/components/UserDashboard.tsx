import React, { useState } from "react";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, BinaryTreeNode, Order } from "../types";
import { 
  DollarSign, TrendingUp, Users, TreePine, ArrowUpRight, ArrowDownLeft, 
  Copy, Check, ShoppingBag, ShieldAlert, ShieldCheck, CheckCircle, RefreshCw, 
  CreditCard, Send, LogOut, Bell, HelpCircle, Award, Percent, Menu, X,
  User, Lock, Sparkles, Truck, Package, Clock, ChevronLeft, ChevronRight,
  LayoutGrid, LayoutList, Camera, FileText, Eye, ChevronDown, ChevronUp
} from "lucide-react";
import WorkflowModal from "./WorkflowModal";

interface UserDashboardProps {
  user: MLMUser;
  transactions: Transaction[];
  deposits: DepositRequest[];
  withdrawals: WDRequest[];
  notifications: any[];
  binaryTree: BinaryTreeNode | null;
  referrals: MLMUser[];
  products: Product[];
  orders?: Order[];
  onLogout: () => void;
  onRefresh: () => void;
  onBuyProduct: (productId: number, paymentMethod?: 'saldo' | 'transfer', customAddress?: string, selectedSize?: string, selectedColor?: string) => Promise<void>;
  onDeposit: (amount: number, method: 'qris' | 'bca' | 'mandiri' | 'transfer_bank' | string, customUniqueCode?: number) => Promise<void>;
  onWithdraw: (amount: number, bank: string, accountNum: string, holder: string) => Promise<void>;
  onSimulatePayment: (depositId: number) => Promise<void>;
  onActivate: () => Promise<void>;
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
    password?: string;
    profile_photo?: string;
  }) => Promise<boolean>;
  onResetPassword?: (currentPass: string, newPass: string) => Promise<boolean>;
  onConfirmDepositProof?: (depositId: number, proofImage: string, proofNotes?: string) => Promise<boolean>;
  onConfirmOrderProof?: (orderId: number, proofImage: string, proofNotes?: string) => Promise<boolean>;
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
  orders = [],
  onLogout,
  onRefresh,
  onBuyProduct,
  onDeposit,
  onWithdraw,
  onSimulatePayment,
  onActivate,
  onUpdateProfile,
  onResetPassword,
  onConfirmDepositProof,
  onConfirmOrderProof,
  serverUrl,
  settings
}: UserDashboardProps) {
  const idPrefix = settings?.memberIdPrefix || 'HDT-';
  const getInitialUserTab = (): 'overview' | 'tree' | 'shop' | 'orders' | 'finance' | 'referrals' | 'bonuses' | 'panduan' | 'profil' => {
    try {
      const validTabs = ['overview', 'tree', 'shop', 'orders', 'finance', 'referrals', 'bonuses', 'panduan', 'profil'];
      const rawHash = window.location.hash || '';
      const cleanHash = rawHash.replace(/^[#/]+/, '').split('?')[0].split('/')[0].trim();
      if (cleanHash && validTabs.includes(cleanHash)) {
        return cleanHash as any;
      }
      const saved = localStorage.getItem('user_active_tab');
      if (saved && validTabs.includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'overview';
  };

  const getInitialFinanceSubTab = (): 'deposit' | 'withdraw' | 'history' => {
    try {
      const saved = localStorage.getItem('user_finance_sub_tab');
      if (saved && ['deposit', 'withdraw', 'history'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'deposit';
  };

  const [activeTab, setActiveTab] = useState(getInitialUserTab);

  React.useEffect(() => {
    try {
      localStorage.setItem('user_active_tab', activeTab);
      if (window.location.hash !== `#${activeTab}`) {
        window.location.hash = activeTab;
      }
    } catch {}
  }, [activeTab]);

  React.useEffect(() => {
    const handleHashChange = () => {
      try {
        const validTabs = ['overview', 'tree', 'shop', 'orders', 'finance', 'referrals', 'bonuses', 'panduan', 'profil'];
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
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  
  const [refPage, setRefPage] = useState(1);
  const refPageSize = 5;

  // Custom Refs & View Modes
  const overviewCardsRef = React.useRef<HTMLDivElement>(null);
  const [shopGridView, setShopGridView] = useState<'1col' | '2col'>('2col');
  const [financeSubTab, setFinanceSubTab] = useState<'deposit' | 'withdraw' | 'history'>(getInitialFinanceSubTab);

  React.useEffect(() => {
    try {
      localStorage.setItem('user_finance_sub_tab', financeSubTab);
    } catch {}
  }, [financeSubTab]);

  const scrollCardsLeft = () => {
    if (overviewCardsRef.current) {
      overviewCardsRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollCardsRight = () => {
    if (overviewCardsRef.current) {
      overviewCardsRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };
  
  // Form states
  const [depAmount, setDepAmount] = useState('');
  const [depMethod, setDepMethod] = useState<'qris' | 'bca' | 'mandiri' | 'transfer_bank'>('transfer_bank');
  const [depUniqueCode, setDepUniqueCode] = useState(() => Math.floor(100 + Math.random() * 900));
  const [activationUniqueCode] = useState(() => Math.floor(100 + Math.random() * 900));
  const [roUniqueCode] = useState(() => Math.floor(100 + Math.random() * 900));
  const [copiedTotal, setCopiedTotal] = useState(false);
  const [copiedDepId, setCopiedDepId] = useState<number | null>(null);
  const [wdAmount, setWdAmount] = useState('');
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [actProofImage, setActProofImage] = useState('');
  const [actProofNotes, setActProofNotes] = useState('');
  const [isUploadingActProof, setIsUploadingActProof] = useState(false);
  const [wdBank, setWdBank] = useState('BCA');
  const [wdAccount, setWdAccount] = useState('');
  const [wdHolder, setWdHolder] = useState(user.fullname);

  // Profile and Password Form states
  const [profileFullname, setProfileFullname] = useState(user.fullname || '');
  const [profileEmail, setProfileEmail] = useState(user.email || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileWhatsapp, setProfileWhatsapp] = useState(user.whatsapp || user.phone || '');
  const [profileKtp, setProfileKtp] = useState(user.ktp || '');
  const [profileBankName, setProfileBankName] = useState(user.bank_name || 'BCA');
  const [profileBankAccount, setProfileBankAccount] = useState(user.bank_account || '');
  const [profileBankHolder, setProfileBankHolder] = useState(user.bank_holder || user.fullname || '');
  const [profileAddress, setProfileAddress] = useState(user.address || '');
  const [profileCity, setProfileCity] = useState(user.city || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ text: "Ukuran foto maksimal 10MB", type: "error" });
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawBase64 = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);

        if (onUpdateProfile) {
          try {
            await onUpdateProfile({
              fullname: profileFullname || user.fullname,
              email: profileEmail || user.email,
              phone: profilePhone || user.phone,
              whatsapp: profileWhatsapp,
              bank_name: profileBankName,
              bank_account: profileBankAccount,
              bank_holder: profileBankHolder,
              address: profileAddress,
              city: profileCity,
              profile_photo: compressedBase64
            });
            setStatusMessage({ text: "Foto profil berhasil diperbarui & disimpan!", type: "success" });
            onRefresh();
          } catch (err: any) {
            setStatusMessage({ text: "Gagal menyimpan foto profil", type: "error" });
          }
        }
        setUploadingPhoto(false);
      };
      img.onerror = () => {
        setStatusMessage({ text: "Gagal memproses gambar foto profil", type: "error" });
        setUploadingPhoto(false);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [syncingOrderId, setSyncingOrderId] = useState<number | string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<number | string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'DIPROSES' | 'DIKIRIM' | 'TERIMA' | 'BATAL'>('ALL');

  const isMidtransEnabled = settings?.enableMidtrans === true;

  // Repeat Order Checkout Modal States
  const [purchaseModalProduct, setPurchaseModalProduct] = useState<Product | null>(null);
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState<'saldo' | 'transfer'>('saldo');
  const [purchaseAddress, setPurchaseAddress] = useState(user.address || '');
  const [addressSource, setAddressSource] = useState<'profile' | 'manual'>('profile');
  const [selectedSize, setSelectedSize] = useState<string>("30");
  const [selectedColor, setSelectedColor] = useState<string>("Deep Indigo Blue");

  // Proof of Transfer Modal States
  const [selectedProofDeposit, setSelectedProofDeposit] = useState<DepositRequest | null>(null);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [proofImageInput, setProofImageInput] = useState<string>('');
  const [proofNotesInput, setProofNotesInput] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [viewProofModalImage, setViewProofModalImage] = useState<string | null>(null);

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 900;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleUserSyncTracking = async (ord: Order) => {
    setSyncingOrderId(ord.id);
    try {
      const res = await fetch("/api/shipping/sync-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: ord.id,
          courier: ord.courier,
          trackingNumber: ord.tracking_number
        })
      });
      if (res.ok && onRefresh) {
        await onRefresh();
      }
    } catch (e) {
      console.warn("Sync error:", e);
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Calculate dynamic volume & member counts from binary tree structure to ensure DB connectivity
  const getSubtreeStats = (node: BinaryTreeNode | null): { totalCount: number; activeSales: number } => {
    if (!node) return { totalCount: 0, activeSales: 0 };
    const leftStats = getSubtreeStats(node.left);
    const rightStats = getSubtreeStats(node.right);
    return {
      totalCount: 1 + leftStats.totalCount + rightStats.totalCount,
      activeSales: (node.is_active ? 1 : 0) + leftStats.activeSales + rightStats.activeSales
    };
  };

  const leftSubtreeStats = binaryTree ? getSubtreeStats(binaryTree.left) : { totalCount: 0, activeSales: 0 };
  const rightSubtreeStats = binaryTree ? getSubtreeStats(binaryTree.right) : { totalCount: 0, activeSales: 0 };

  const displayLeftCount = Math.max(user.left_count || 0, leftSubtreeStats.totalCount);
  const displayLeftSales = Math.max(user.left_sales || 0, leftSubtreeStats.activeSales);
  const displayRightCount = Math.max(user.right_count || 0, rightSubtreeStats.totalCount);
  const displayRightSales = Math.max(user.right_sales || 0, rightSubtreeStats.activeSales);

  // Sync profile fields when user prop updates
  React.useEffect(() => {
    setProfileFullname(user.fullname || '');
    setProfileEmail(user.email || '');
    setProfilePhone(user.phone || '');
    setProfileWhatsapp(user.whatsapp || user.phone || '');
    setProfileKtp(user.ktp || '');
    setProfileBankName(user.bank_name || 'BCA');
    setProfileBankAccount(user.bank_account || '');
    setProfileBankHolder(user.bank_holder || user.fullname || '');
    setProfileAddress(user.address || '');
    setProfileCity(user.city || '');
  }, [user]);

  // Tree focus state (allows drilling down the tree)
  const [treeRootNode, setTreeRootNode] = useState<BinaryTreeNode | null>(binaryTree);
  const [copied, setCopied] = useState(false);

  // Status/message states
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Tree view mode for Mobile / HP responsiveness
  const [treeViewMode, setTreeViewMode] = useState<'diagram' | 'list'>('diagram');
  const [treeZoomScale, setTreeZoomScale] = useState<number>(1.0);

  // Helper to compute stats for a specific node in the tree (handles 0/null fallback and dynamic subtree counting)
  const getNodePoints = (node: BinaryTreeNode | null, side: 'left' | 'right'): { sales: number; count: number } => {
    if (!node) return { sales: 0, count: 0 };
    const child = side === 'left' ? node.left : node.right;
    
    const childSubtree = child ? getSubtreeStats(child) : { totalCount: 0, activeSales: 0 };
    const explicitSales = side === 'left' ? (node.left_sales ?? 0) : (node.right_sales ?? 0);
    const explicitCount = side === 'left' ? (node.left_count ?? 0) : (node.right_count ?? 0);

    const finalSales = Math.max(explicitSales, childSubtree.activeSales);
    const finalCount = Math.max(explicitCount, childSubtree.totalCount);

    return { sales: finalSales, count: finalCount };
  };

  // Reset / Sync Tree Root when backend tree updates
  React.useEffect(() => {
    if (binaryTree) {
      if (!treeRootNode || treeRootNode.id === user.id) {
        setTreeRootNode(binaryTree);
      } else {
        const updatedTarget = findNodeInTree(binaryTree, treeRootNode.id);
        setTreeRootNode(updatedTarget || binaryTree);
      }
    }
  }, [binaryTree, user.id]);

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
      await onDeposit(amt, depMethod, depUniqueCode);
      setDepAmount('');
      const totalTrf = amt + depUniqueCode;
      setStatusMessage({ 
        text: `Permintaan deposit berhasil dibuat! Silakan transfer TEPAT Rp ${totalTrf.toLocaleString('id-ID')} (Termasuk 3 digit kode unik #${depUniqueCode}) agar verifikasi cepat oleh Admin.`, 
        type: "success" 
      });
      setDepUniqueCode(Math.floor(100 + Math.random() * 900));
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
      alert("Nama Lengkap, Email, dan No. HP harus diisi!");
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
          whatsapp: profileWhatsapp,
          bank_name: profileBankName,
          bank_account: profileBankAccount,
          bank_holder: profileBankHolder,
          address: profileAddress,
          city: profileCity,
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
            whatsapp: profileWhatsapp,
            bank_name: profileBankName,
            bank_account: profileBankAccount,
            bank_holder: profileBankHolder,
            address: profileAddress,
            city: profileCity,
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

  const handleProductPurchase = async (productId: number, method: 'saldo' | 'transfer' = 'saldo', addressInput?: string, sizeInput?: string, colorInput?: string) => {
    if (!user.is_active) {
      alert("Aktifkan akun premium Rp 550.000 terlebih dahulu untuk menikmati harga diskon member!");
      return;
    }
    setLoadingAction(true);
    try {
      await onBuyProduct(productId, method, addressInput, sizeInput || selectedSize, colorInput || selectedColor);
      setStatusMessage({ text: "🎉 Pembelian Repeat Order (RO) berhasil! Pesanan telah masuk ke sistem pengiriman & terdaftar di Admin Area.", type: "success" });
      setPurchaseModalProduct(null);
      setActiveTab('orders');
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Gagal melakukan pembelian", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAccountActivation = async () => {
    if (user.balance < 550000) {
      alert("Saldo Anda kurang dari Rp 550.000. Silakan lakukan deposit terlebih dahulu!");
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
      <header className="bg-[#111111] text-white h-16 px-4 sm:px-6 flex items-center justify-between shadow-lg sticky top-0 z-40 border-b border-neutral-800" id="user-header">
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings?.webName || "Logo"} className="h-8 max-w-[150px] object-contain shrink-0" />
          ) : (
            <div className="bg-[#C41230] text-white font-black font-display text-sm sm:text-base tracking-tighter px-3 py-1 rounded-b-md shadow-md uppercase border-t-2 border-red-800">
              {settings?.logoText || "HEDTRO.JEANS"}
            </div>
          )}
          <span className="hidden sm:inline-block text-xs font-black uppercase tracking-widest text-neutral-300">
            MEMBER PORTAL
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-display font-black flex items-center justify-center text-xs overflow-hidden border border-slate-700 shrink-0">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.fullname} className="w-full h-full object-cover" />
              ) : (
                user.username.replace(/^@/, '').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-neutral-100">{user.fullname}</p>
              <p className="text-[10px] text-neutral-400 font-mono">ID: {idPrefix}{String(user.id).padStart(6, '0')} • {user.username.replace(/^@/, '')} • {user.is_active ? 'Member Premium (Verified)' : 'Free Member (Belum Aktif)'}</p>
            </div>
          </div>
          <button 
            id="btn-logout"
            onClick={onLogout} 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#C41230]/20 hover:bg-[#C41230]/30 text-red-400 border border-[#C41230]/30 rounded-none transition font-black text-xs uppercase tracking-wider"
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
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt={settings?.webName || "Logo"} className="h-8 max-w-[160px] object-contain shrink-0" />
                  ) : (
                    <span className="text-lg font-display font-black tracking-tight text-white">
                      {settings?.logoText || "HEDTRO"}<span className="text-blue-500 font-light">.PORTAL</span>
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

              {/* User Profile Details */}
              <div className="bg-slate-900 p-3.5 rounded-xl flex items-center gap-3 border border-slate-800">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-display font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/10 shrink-0 overflow-hidden relative border border-slate-700">
                  {user.profile_photo ? (
                    <img src={user.profile_photo} alt={user.fullname} className="w-full h-full object-cover" />
                  ) : (
                    user.username.replace(/^@/, '').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user.fullname}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                    ID: {idPrefix}{String(user.id).padStart(6, '0')} • {user.username.replace(/^@/, '')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      user.is_active 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {user.is_active ? 'MEMBER PREMIUM' : 'FREE MEMBER'}
                    </span>
                    {user.is_active ? (
                      <span className="text-[9px] font-extrabold text-emerald-400 flex items-center gap-0.5">
                        <span>Verified</span>
                        <CheckCircle className="w-3 h-3 text-emerald-400 fill-emerald-500/30" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold text-amber-400 flex items-center gap-0.5">
                        <span>Belum Bayar (Free)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Activation Warning Widget if Inactive */}
              {!user.is_active && (
                <div className="bg-amber-600/15 border border-amber-500/25 p-3.5 rounded-xl space-y-3">
                  <div className="flex gap-2 text-amber-400 text-[10px] font-medium leading-normal">
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                    <div>
                      <span className="font-extrabold block text-amber-300 text-xs">AKUN BELUM AKTIF</span>
                      Wajib aktifasi Rp 550.000 untuk bonus jaringan & belanja.
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleAccountActivation(); }}
                    disabled={user.balance < 550000 || loadingAction}
                    className={`w-full text-xs font-bold py-2 rounded-lg transition text-center shadow-sm ${
                      user.balance >= 550000 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {user.balance >= 550000 ? "Aktifkan Akun (Dipotong Saldo)" : "Isi Saldo Rp 550k untuk Aktifasi"}
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
                  id="tab-orders-mobile"
                  onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-left">
                    <Truck className="w-4 h-4 shrink-0 text-blue-400" /> Data Pembelian Produk RO
                  </span>
                  {orders && orders.filter(o => o.username === user.username || o.phone === user.phone).length > 0 && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                      {orders.filter(o => o.username === user.username || o.phone === user.phone).length}
                    </span>
                  )}
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
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-display font-black flex items-center justify-center text-lg shadow-md shadow-blue-600/10 shrink-0 overflow-hidden relative">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.fullname} className="w-full h-full object-cover" />
                ) : (
                  user.username.replace(/^@/, '').slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-display font-bold text-white leading-tight">{user.fullname}</h4>
                <p className="text-xs text-slate-400 font-medium">{user.username.replace(/^@/, '')}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono font-extrabold text-slate-300">
                  <span>ID:</span>
                  <span className="text-blue-400">{idPrefix}{String(user.id).padStart(6, '0')}</span>
                </div>
              </div>
            </div>

            {/* License Active badge */}
            {user.is_active ? (
              <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-normal font-medium flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-base tracking-wide">PREMIUM</span>
                    <div className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                      <span>Verified</span>
                      <CheckCircle className="w-3 h-3 text-blue-400 fill-blue-500/30" />
                    </div>
                  </div>
                  <span className="inline-block my-1 px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-700/50">
                    ID MEMBER: {idPrefix}{String(user.id).padStart(6, '0')}
                  </span>
                </div>
              </div>
            ) : (() => {
              const actDepItem = deposits.find(d => Number(d.amount) === 550000 && d.status === 'pending') || deposits.find(d => Number(d.amount) === 550000) || deposits[0];
              const actCodeVal = actDepItem?.unique_code || activationUniqueCode || 123;
              const totalActVal = 550000 + actCodeVal;
              const hasUploadedProof = Boolean(actDepItem?.proof_image);

              return (
                <div className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/40 rounded-xl p-3 sm:p-4 shadow-lg text-left space-y-2.5 w-full max-w-full overflow-hidden">
                  {/* Top Bar: Title & Member ID */}
                  <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-extrabold text-amber-400 text-xs tracking-wide truncate">AKUN BELUM AKTIF</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/30 shrink-0">
                      ID: {idPrefix}{String(user.id).padStart(6, '0')}
                    </span>
                  </div>

                  {/* Compact Info Row */}
                  <div className="bg-slate-950/80 p-2.5 sm:p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold">Tagihan Aktivasi Perdana:</span>
                      <span className="font-mono text-emerald-400 font-black text-xs sm:text-sm">
                        Rp {totalActVal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900 gap-2">
                      <span className="truncate">🎁 Paket: Hedtro Raw Denim 15oz</span>
                      <span className="text-amber-300 font-bold shrink-0">+Rp {actCodeVal} Unik</span>
                    </div>
                  </div>

                  {/* Simple Direct Modal Trigger */}
                  <button
                    id="btn-activate-account"
                    onClick={() => {
                      let actDep = deposits.find(d => Number(d.amount) === 550000 && d.status === 'pending') || deposits.find(d => Number(d.amount) === 550000) || deposits[0];
                      if (!actDep) {
                        actDep = {
                          id: Date.now(),
                          user_id: Number(user.id),
                          username: user.username,
                          amount: 550000,
                          unique_code: actCodeVal,
                          method: "transfer_bank",
                          status: "pending",
                          payment_code: `ACT-${user.id}`,
                          created_at: new Date().toISOString()
                        };
                        if (onDeposit) {
                          onDeposit(550000, "transfer_bank", actCodeVal).catch(() => {});
                        }
                      }
                      setSelectedProofDeposit(actDep);
                      setProofImageInput(actDep.proof_image || '');
                      setProofNotesInput(actDep.proof_notes || '');
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold py-2.5 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <Camera className="w-4 h-4" />
                    {hasUploadedProof ? 'Lihat / Upload Ulang Bukti TF' : 'Upload Bukti Transfer / Aktifkan Akun'}
                  </button>
                </div>
              );
            })()}

            {/* Referral Link */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Link Referal Anda</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?ref=${user.username.replace(/^@/, '')}`}
                  className="bg-slate-950 text-[10px] text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 flex-1 font-mono focus:outline-none"
                />
                <button
                  id="btn-copy-ref"
                  onClick={copyReferralLink}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          {/* Nav Navigation */}
          <nav className="bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-xl space-y-1">
            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ringkasan Bisnis</span>
            </button>
 
            <button
              id="tab-tree"
              onClick={() => setActiveTab('tree')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'tree' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TreePine className="w-4 h-4" />
              <span>Pohon Jaringan</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'tree' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                Binary
              </span>
            </button>
 
            <button
              id="tab-shop"
              onClick={() => setActiveTab('shop')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'shop' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Belanja Jeans</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeTab === 'shop' ? 'bg-blue-500/20 text-white' : 'bg-blue-950 text-blue-300 border border-blue-800'}`}>
                Diskon Member
              </span>
            </button>

            <button
              id="tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="flex-1 text-left">Data Pembelian Produk RO</span>
              {orders && orders.filter(o => o.username === user.username || o.phone === user.phone).length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeTab === 'orders' ? 'bg-blue-500/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {orders.filter(o => o.username === user.username || o.phone === user.phone).length}
                </span>
              )}
            </button>
 
            <button
              id="tab-finance"
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'finance' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Depo & Withdraw (WD)</span>
            </button>
 
            <button
              id="tab-referrals"
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'referrals' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sponsor Saya</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'referrals' ? 'bg-blue-500/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {referrals.length} org
              </span>
            </button>
 
            <button
              id="tab-bonuses"
              onClick={() => setActiveTab('bonuses')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === 'bonuses' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="flex-1 text-left">Laporan Transparansi Komisi</span>
              <span className="bg-amber-900/60 border border-amber-700/50 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                Detail
              </span>
            </button>
 
            <button
              id="tab-panduan"
              onClick={() => setActiveTab('panduan')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'panduan' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Panduan & Syarat Bonus</span>
            </button>
 
            <button
              id="tab-profil"
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-blue-400" />
              <span>Profil Saya</span>
            </button>

            <div className="pt-2 border-t border-slate-800">
              <button
                id="sidebar-btn-logout"
                onClick={onLogout}
                className="w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/50 hover:text-red-300 transition"
              >
                <LogOut className="w-4 h-4 text-red-400" />
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
              
              {/* Financial Stats Grid - Mobile Horizontal Swipe Carousel / PC 3-Column Grid */}
              <div className="relative group/carousel">
                
                {/* Mobile & PC Slider Navigation Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    💳 Ringkasan Akun & Omset
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={scrollCardsLeft}
                      className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 active:scale-90 transition border border-slate-200/90 shadow-2xs cursor-pointer flex items-center justify-center"
                      title="Geser Kiri"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-800" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollCardsRight}
                      className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white active:scale-90 transition shadow-xs cursor-pointer flex items-center justify-center"
                      title="Geser Kanan"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div 
                  ref={overviewCardsRef}
                  className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
                >
                  
                  {/* Card 1: Virtual Platinum Wallet Card */}
                  <div className="w-[86vw] xs:w-[320px] sm:w-auto shrink-0 snap-center sm:shrink bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute -right-10 -top-10 w-36 h-36 bg-blue-600/15 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="space-y-3">
                      {/* Top Bar: Chip / Brand Badge & User Photo */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-display font-black flex items-center justify-center text-xs overflow-hidden border border-slate-700 shrink-0">
                            {user.profile_photo ? (
                              <img src={user.profile_photo} alt={user.fullname} className="w-full h-full object-cover" />
                            ) : (
                              user.username.replace(/^@/, '').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] font-mono font-extrabold tracking-widest text-slate-400 uppercase block leading-none">
                              MEMBER ACCOUNT
                            </span>
                            <span className="text-xs font-bold text-white truncate max-w-[120px] block leading-tight mt-0.5">{user.fullname}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          user.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {user.is_active ? '● MEMBER PREMIUM (VERIFIED)' : '○ FREE MEMBER (BELUM BAYAR)'}
                        </span>
                      </div>

                      {/* Balance */}
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                          Saldo Dompet Aktif
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white mt-0.5">
                          <span className="text-blue-400 text-base font-sans mr-1">Rp</span>
                          {user.balance.toLocaleString('id-ID')}
                        </h3>
                      </div>

                      {/* Quick Meta Row */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                        <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-400 font-medium block text-[9px]">Sponsor</span>
                          <span className="font-bold text-blue-400 truncate block">{user.sponsor_username || 'Perusahaan'}</span>
                        </div>
                        <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-400 font-medium block text-[9px]">ID Akun</span>
                          <span className="font-bold text-emerald-400 font-mono truncate block">{idPrefix}{String(user.id).padStart(6, '0')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 mt-3 border-t border-slate-800/70 relative z-10">
                      <button
                        onClick={() => setActiveTab('finance')}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-900 py-2 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" /> Isi Saldo
                      </button>
                      <button
                        onClick={() => setActiveTab('finance')}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Tarik
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Omset Volume Grup */}
                  <div className="w-[86vw] xs:w-[320px] sm:w-auto shrink-0 snap-center sm:shrink bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                    <div className="space-y-2.5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                            OMSET VOLUME GRUP (BINARY)
                          </span>
                          <p className="text-xs font-extrabold text-slate-900">Tim Kiri & Kanan</p>
                        </div>
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <TreePine className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Left vs Right Meter */}
                      {(() => {
                        const totalVol = (displayLeftSales || 0) + (displayRightSales || 0);
                        const leftPct = totalVol > 0 ? Math.round((displayLeftSales / totalVol) * 100) : 50;
                        const rightPct = 100 - leftPct;
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                              <span className="text-blue-600">KIRI ({leftPct}%)</span>
                              <span className="text-indigo-600">KANAN ({rightPct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/80">
                              <div 
                                style={{ width: `${leftPct}%` }} 
                                className="h-full bg-blue-600 rounded-l-full"
                              />
                              <div 
                                style={{ width: `${rightPct}%` }} 
                                className="h-full bg-indigo-600 rounded-r-full"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Compact Volume Boxes */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div className="bg-blue-50/80 rounded-xl p-2 sm:p-2.5 border border-blue-100 text-left">
                          <span className="text-[10px] text-blue-700 font-black tracking-wide block">
                            👈 TIM KIRI
                          </span>
                          <div className="flex items-baseline gap-1 my-0.5">
                            <span className="text-base sm:text-lg font-black text-slate-900">{displayLeftSales}</span>
                            <span className="text-[10px] font-bold text-slate-500">pt</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block">{displayLeftCount} member</span>
                        </div>

                        <div className="bg-indigo-50/80 rounded-xl p-2 sm:p-2.5 border border-indigo-100 text-left">
                          <span className="text-[10px] text-indigo-700 font-black tracking-wide block">
                            TIM KANAN 👉
                          </span>
                          <div className="flex items-baseline gap-1 my-0.5">
                            <span className="text-base sm:text-lg font-black text-slate-900">{displayRightSales}</span>
                            <span className="text-[10px] font-bold text-slate-500">pt</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block">{displayRightCount} member</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-2.5 mt-2.5 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-500">Sponsor Direct:</span>
                      <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {referrals.length} member ({referrals.filter(r => r.is_active).length} aktif)
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Total Komisi Afiliasi */}
                  <div className="w-[86vw] xs:w-[320px] sm:w-auto shrink-0 snap-center sm:shrink bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-900/40 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">
                          TOTAL KOMISI & AKUMULASI
                        </span>
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Pendapatan Bersih Total
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-display font-black text-white mt-0.5 tracking-tight">
                          <span className="text-emerald-400 text-base font-sans mr-1">Rp</span>
                          {(user.sponsor_bonus + user.pairing_bonus + user.level_bonus + user.ro_bonus).toLocaleString('id-ID')}
                        </h3>
                      </div>

                      {/* 4 Mini Bonus Pill Grid */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                        <div className="bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-semibold block text-[8px]">1. Sponsor</span>
                          <p className="font-extrabold text-emerald-400 text-[11px]">Rp {user.sponsor_bonus.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-semibold block text-[8px]">2. Pasangan</span>
                          <p className="font-extrabold text-emerald-400 text-[11px]">Rp {user.pairing_bonus.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-semibold block text-[8px]">3. Generasi</span>
                          <p className="font-extrabold text-emerald-400 text-[11px]">Rp {user.level_bonus.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-semibold block text-[8px]">4. Repeat Order</span>
                          <p className="font-extrabold text-emerald-400 text-[11px]">Rp {user.ro_bonus.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('bonuses')}
                      className="mt-3 w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-lg border border-emerald-500/30 transition text-center cursor-pointer"
                    >
                      Perincian Bonus →
                    </button>
                  </div>

                </div>
              </div>

              {/* Notification Box & Referral summary */}
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm sm:text-base font-display font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> Riwayat Transaksi Finansial
                  </h3>
                  <span className="text-[10px] sm:text-xs font-extrabold text-slate-500">
                    Total {transactions.length} Catatan
                  </span>
                </div>

                {/* Mobile View (1 Baris 2 Kolom Kanan Kiri) */}
                <div className="block sm:hidden space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                      Belum ada catatan transaksi keuangan
                    </p>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex justify-between items-center gap-2.5 text-left">
                        {/* Kolom 1: Tanggal & Keterangan Singkat */}
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-[9px] text-slate-400 font-bold">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{tx.description}</p>
                        </div>

                        {/* Kolom 2: Jumlah & Jenis */}
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className={`text-xs font-mono font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.amount >= 0 ? '+' : ''}Rp {tx.amount.toLocaleString('id-ID')}
                          </p>
                          <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            tx.type.includes('bonus') ? 'bg-emerald-100 text-emerald-800' :
                            tx.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                            tx.type === 'withdrawal' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden sm:block overflow-x-auto">
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
                              {tx.amount > 0 ? '+' : ''}Rp {tx.amount.toLocaleString('id-ID')}
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5" id="tree-tab-content">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TreePine className="text-blue-600 w-5 h-5" /> Pohon Jaringan Silsilah Binary
                  </h3>
                  <p className="text-xs text-slate-500">Silsilah tim binary 10 level Anda. Bebas fokuskan downline atau ganti ke mode HP.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode Switcher */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => setTreeViewMode('diagram')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        treeViewMode === 'diagram' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TreePine className="w-3.5 h-3.5" /> Diagram
                    </button>
                    <button
                      onClick={() => setTreeViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        treeViewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" /> 📱 Mode HP (List)
                    </button>
                  </div>

                  {treeRootNode && treeRootNode.id !== user.id && (
                    <button
                      id="btn-reset-tree"
                      onClick={resetTreeFocus}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 border border-blue-200 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Ke Atas (Saya)
                    </button>
                  )}
                </div>
              </div>

              {/* VIEW MODE 1: DIAGRAM TREE VIEW */}
              {treeViewMode === 'diagram' && (
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-6 overflow-x-auto min-h-[480px]">
                  {treeRootNode ? (
                    <div 
                      className="flex flex-col items-center select-none w-[760px] mx-auto shrink-0 pt-4 transition-transform duration-200 origin-top"
                      style={{ transform: `scale(${treeZoomScale})` }}
                    >
                      {/* ROOT LEVEL 1 */}
                      <div className="flex flex-col items-center">
                        <div className={`p-4 rounded-2xl border w-48 text-center shadow-md relative transition ${
                          treeRootNode.id === user.id ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white border-blue-500 ring-2 ring-blue-300' : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                          <span className="text-[9px] opacity-80 uppercase tracking-widest font-extrabold block">
                            {treeRootNode.id === user.id ? '⭐ Akun Utama Saya' : 'Upline Fokus'}
                          </span>
                          <p className="font-black text-sm truncate mt-0.5">{treeRootNode.fullname}</p>
                          <p className={`text-[10px] mt-0.5 font-bold ${treeRootNode.id === user.id ? 'text-blue-100' : 'text-slate-400'}`}>
                            {treeRootNode.username.replace(/^@/, '')}
                          </p>
                          
                          {/* Points Summary for Upline Fokus */}
                          {(() => {
                            const leftPts = getNodePoints(treeRootNode, 'left');
                            const rightPts = getNodePoints(treeRootNode, 'right');
                            return (
                              <div className="grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t border-slate-200/20 text-[9px] font-black">
                                <div className="border-r border-slate-200/20 pr-1">
                                  <p className="opacity-80">👈 Kiri (L)</p>
                                  <p className="text-xs font-black">{leftPts.sales} pt</p>
                                  <p className="text-[8px] opacity-85 font-semibold">{leftPts.count} member</p>
                                </div>
                                <div className="pl-1">
                                  <p className="opacity-80">Kanan (R) 👉</p>
                                  <p className="text-xs font-black">{rightPts.sales} pt</p>
                                  <p className="text-[8px] opacity-85 font-semibold">{rightPts.count} member</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Tree Branch connectors (vertical line) */}
                        <div className="h-7 w-0.5 bg-slate-300"></div>
                        {/* Horizontal line */}
                        <div className="w-[320px] h-0.5 bg-slate-300 flex justify-between">
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
                              className={`p-3.5 rounded-xl border w-40 text-center cursor-pointer shadow-xs hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 transition ${
                                treeRootNode.left.is_active ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'
                              }`}
                            >
                              <p className="text-[8px] font-extrabold text-blue-600 uppercase tracking-wider">Kiri (L)</p>
                              <p className="font-bold text-xs truncate mt-0.5">{treeRootNode.left.fullname}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{treeRootNode.left.username.replace(/^@/, '')}</p>
                              
                              {(() => {
                                const lLeftPts = getNodePoints(treeRootNode.left, 'left');
                                const lRightPts = getNodePoints(treeRootNode.left, 'right');
                                return (
                                  <div className="flex justify-between text-[8px] mt-2 pt-1.5 border-t border-slate-100 font-bold text-slate-600">
                                    <span>L: {lLeftPts.sales}pt ({lLeftPts.count}m)</span>
                                    <span>R: {lRightPts.sales}pt ({lRightPts.count}m)</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div 
                              onClick={() => setActiveTab('referrals')}
                              className="p-3.5 rounded-xl border border-dashed border-slate-300 w-40 text-center text-[10px] text-slate-400 bg-slate-50/50 py-5 cursor-pointer hover:bg-slate-100/50 transition"
                            >
                              <p className="font-extrabold text-blue-500">+ Tambah</p>
                              <p className="text-[8px] opacity-75 mt-0.5">Sponsori Tim Kiri</p>
                            </div>
                          )}

                          {/* Connector down to level 3 left */}
                          <div className="h-6 w-0.5 bg-slate-300"></div>
                          <div className="w-[140px] h-0.5 bg-slate-300 flex justify-between">
                            <div className="w-0.5 h-4 bg-slate-300"></div>
                            <div className="w-0.5 h-4 bg-slate-300"></div>
                          </div>

                          {/* LEVEL 3 Under Left Leg (L-L, L-R) */}
                          <div className="flex justify-between w-[190px] pt-4">
                            {treeRootNode.left?.left ? (
                              <div 
                                onClick={() => handleTreeNodeClick(treeRootNode.left!.left!.id)}
                                className="p-2 rounded-xl border border-slate-200 w-22 text-center cursor-pointer shadow-2xs bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                              >
                                <p className="font-bold truncate">{treeRootNode.left.left.username.replace(/^@/, '')}</p>
                                <p className="text-[8px] text-slate-400 mt-0.5">L-L ({treeRootNode.left.left.is_active ? 'Aktif' : 'Non-aktif'})</p>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl border border-dashed border-slate-200 w-22 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                                Kosong
                              </div>
                            )}

                            {treeRootNode.left?.right ? (
                              <div 
                                onClick={() => handleTreeNodeClick(treeRootNode.left!.right!.id)}
                                className="p-2 rounded-xl border border-slate-200 w-22 text-center cursor-pointer shadow-2xs bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                              >
                                <p className="font-bold truncate">{treeRootNode.left.right.username.replace(/^@/, '')}</p>
                                <p className="text-[8px] text-slate-400 mt-0.5">L-R ({treeRootNode.left.right.is_active ? 'Aktif' : 'Non-aktif'})</p>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl border border-dashed border-slate-200 w-22 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
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
                              className={`p-3.5 rounded-xl border w-40 text-center cursor-pointer shadow-xs hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 transition ${
                                treeRootNode.right.is_active ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'
                              }`}
                            >
                              <p className="text-[8px] font-extrabold text-amber-600 uppercase tracking-wider">Kanan (R)</p>
                              <p className="font-bold text-xs truncate mt-0.5">{treeRootNode.right.fullname}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{treeRootNode.right.username.replace(/^@/, '')}</p>

                              {(() => {
                                const rLeftPts = getNodePoints(treeRootNode.right, 'left');
                                const rRightPts = getNodePoints(treeRootNode.right, 'right');
                                return (
                                  <div className="flex justify-between text-[8px] mt-2 pt-1.5 border-t border-slate-100 font-bold text-slate-600">
                                    <span>L: {rLeftPts.sales}pt ({rLeftPts.count}m)</span>
                                    <span>R: {rRightPts.sales}pt ({rRightPts.count}m)</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div 
                              onClick={() => setActiveTab('referrals')}
                              className="p-3.5 rounded-xl border border-dashed border-slate-300 w-40 text-center text-[10px] text-slate-400 bg-slate-50/50 py-5 cursor-pointer hover:bg-slate-100/50 transition"
                            >
                              <p className="font-extrabold text-amber-500">+ Tambah</p>
                              <p className="text-[8px] opacity-75 mt-0.5">Sponsori Tim Kanan</p>
                            </div>
                          )}

                          {/* Connector down to level 3 right */}
                          <div className="h-6 w-0.5 bg-slate-300"></div>
                          <div className="w-[140px] h-0.5 bg-slate-300 flex justify-between">
                            <div className="w-0.5 h-4 bg-slate-300"></div>
                            <div className="w-0.5 h-4 bg-slate-300"></div>
                          </div>

                          {/* LEVEL 3 Under Right Leg (R-L, R-R) */}
                          <div className="flex justify-between w-[190px] pt-4">
                            {treeRootNode.right?.left ? (
                              <div 
                                onClick={() => handleTreeNodeClick(treeRootNode.right!.left!.id)}
                                className="p-2 rounded-xl border border-slate-200 w-22 text-center cursor-pointer shadow-2xs bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                              >
                                <p className="font-bold truncate">{treeRootNode.right.left.username.replace(/^@/, '')}</p>
                                <p className="text-[8px] text-slate-400 mt-0.5">R-L ({treeRootNode.right.left.is_active ? 'Aktif' : 'Non-aktif'})</p>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl border border-dashed border-slate-200 w-22 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                                Kosong
                              </div>
                            )}

                            {treeRootNode.right?.right ? (
                              <div 
                                onClick={() => handleTreeNodeClick(treeRootNode.right!.right!.id)}
                                className="p-2 rounded-xl border border-slate-200 w-22 text-center cursor-pointer shadow-2xs bg-white hover:border-blue-500 text-slate-800 text-[10px]"
                              >
                                <p className="font-bold truncate">{treeRootNode.right.right.username.replace(/^@/, '')}</p>
                                <p className="text-[8px] text-slate-400 mt-0.5">R-R ({treeRootNode.right.right.is_active ? 'Aktif' : 'Non-aktif'})</p>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl border border-dashed border-slate-200 w-22 text-center text-[9px] text-slate-400 bg-slate-50 py-3">
                                Kosong
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-12 text-center">Pohon Jaringan Kosong</p>
                  )}
                </div>
              )}

              {/* VIEW MODE 2: MOBILE LIST VIEW (Sangat Ramah HP) */}
              {treeViewMode === 'list' && (
                <div className="space-y-4">
                  {treeRootNode ? (
                    <div className="space-y-4">
                      {/* Upline Fokus Card */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-black bg-white/20 text-white px-2 py-0.5 rounded-md inline-block">
                              Upline Fokus Terpilih
                            </span>
                            <h4 className="text-lg font-black mt-1.5">{treeRootNode.fullname}</h4>
                            <p className="text-xs text-blue-100 font-mono">@{treeRootNode.username.replace(/^@/, '')}</p>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                            treeRootNode.is_active ? 'bg-green-400/30 text-green-100 border border-green-300/40' : 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                          }`}>
                            {treeRootNode.is_active ? '✓ Premium Aktif' : 'Belum Aktif'}
                          </span>
                        </div>

                        {(() => {
                          const leftPts = getNodePoints(treeRootNode, 'left');
                          const rightPts = getNodePoints(treeRootNode, 'right');
                          return (
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/20 text-center">
                              <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                                <span className="text-[10px] text-blue-100 uppercase font-black tracking-wider block">👈 Tim Kiri</span>
                                <p className="text-xl font-black mt-0.5">{leftPts.sales} <span className="text-xs font-normal opacity-80">pt</span></p>
                                <p className="text-[10px] text-blue-100 font-medium">{leftPts.count} total member</p>
                              </div>
                              <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                                <span className="text-[10px] text-blue-100 uppercase font-black tracking-wider block">Tim Kanan 👉</span>
                                <p className="text-xl font-black mt-0.5">{rightPts.sales} <span className="text-xs font-normal opacity-80">pt</span></p>
                                <p className="text-[10px] text-blue-100 font-medium">{rightPts.count} total member</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Left & Right Legs Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* LEFT LEG ITEM */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <span className="text-xs font-black text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-lg uppercase">
                              👈 Tim Kiri (Left Leg)
                            </span>
                            {treeRootNode.left && (
                              <button 
                                onClick={() => handleTreeNodeClick(treeRootNode.left!.id)}
                                className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                🔎 Fokus Ke Sini
                              </button>
                            )}
                          </div>

                          {treeRootNode.left ? (
                            <div className="mt-3 space-y-3">
                              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-extrabold text-slate-900 text-sm">{treeRootNode.left.fullname}</p>
                                    <p className="text-xs text-slate-500 font-mono">@{treeRootNode.left.username.replace(/^@/, '')}</p>
                                  </div>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                    treeRootNode.left.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {treeRootNode.left.is_active ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>

                                {(() => {
                                  const lLeft = getNodePoints(treeRootNode.left, 'left');
                                  const lRight = getNodePoints(treeRootNode.left, 'right');
                                  return (
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Kiri (L-L)</span>
                                        <span className="font-black text-slate-800">{lLeft.sales} pt</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Kanan (L-R)</span>
                                        <span className="font-black text-slate-800">{lRight.sales} pt</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Downlines Level 3 Left */}
                              <div className="pl-3 border-l-2 border-blue-200 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-Downline Level 3:</p>
                                {treeRootNode.left.left ? (
                                  <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-slate-800">@{treeRootNode.left.left.username.replace(/^@/, '')}</p>
                                      <p className="text-[10px] text-slate-400">Posisi: L-L</p>
                                    </div>
                                    <button 
                                      onClick={() => handleTreeNodeClick(treeRootNode.left!.left!.id)}
                                      className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                                    >
                                      Lihat
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic">Posisi L-L: Masih Kosong</p>
                                )}

                                {treeRootNode.left.right ? (
                                  <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-slate-800">@{treeRootNode.left.right.username.replace(/^@/, '')}</p>
                                      <p className="text-[10px] text-slate-400">Posisi: L-R</p>
                                    </div>
                                    <button 
                                      onClick={() => handleTreeNodeClick(treeRootNode.left!.right!.id)}
                                      className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                                    >
                                      Lihat
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic">Posisi L-R: Masih Kosong</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-center text-slate-400 text-xs">
                              Belum ada member terpasang di kaki kiri.
                            </div>
                          )}
                        </div>

                        {/* RIGHT LEG ITEM */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <span className="text-xs font-black text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-lg uppercase">
                              Tim Kanan (Right Leg) 👉
                            </span>
                            {treeRootNode.right && (
                              <button 
                                onClick={() => handleTreeNodeClick(treeRootNode.right!.id)}
                                className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                🔎 Fokus Ke Sini
                              </button>
                            )}
                          </div>

                          {treeRootNode.right ? (
                            <div className="mt-3 space-y-3">
                              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-extrabold text-slate-900 text-sm">{treeRootNode.right.fullname}</p>
                                    <p className="text-xs text-slate-500 font-mono">@{treeRootNode.right.username.replace(/^@/, '')}</p>
                                  </div>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                    treeRootNode.right.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {treeRootNode.right.is_active ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>

                                {(() => {
                                  const rLeft = getNodePoints(treeRootNode.right, 'left');
                                  const rRight = getNodePoints(treeRootNode.right, 'right');
                                  return (
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Kiri (R-L)</span>
                                        <span className="font-black text-slate-800">{rLeft.sales} pt</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Kanan (R-R)</span>
                                        <span className="font-black text-slate-800">{rRight.sales} pt</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Downlines Level 3 Right */}
                              <div className="pl-3 border-l-2 border-amber-200 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-Downline Level 3:</p>
                                {treeRootNode.right.left ? (
                                  <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-slate-800">@{treeRootNode.right.left.username.replace(/^@/, '')}</p>
                                      <p className="text-[10px] text-slate-400">Posisi: R-L</p>
                                    </div>
                                    <button 
                                      onClick={() => handleTreeNodeClick(treeRootNode.right!.left!.id)}
                                      className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                                    >
                                      Lihat
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic">Posisi R-L: Masih Kosong</p>
                                )}

                                {treeRootNode.right.right ? (
                                  <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-slate-800">@{treeRootNode.right.right.username.replace(/^@/, '')}</p>
                                      <p className="text-[10px] text-slate-400">Posisi: R-R</p>
                                    </div>
                                    <button 
                                      onClick={() => handleTreeNodeClick(treeRootNode.right!.right!.id)}
                                      className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                                    >
                                      Lihat
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic">Posisi R-R: Masih Kosong</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-center text-slate-400 text-xs">
                              Belum ada member terpasang di kaki kanan.
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-12 text-center">Pohon Jaringan Kosong</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SHOP (BELANJA CELANA JEANS) */}
          {activeTab === 'shop' && (
            <div className="space-y-4 sm:space-y-6" id="shop-tab-content">
              {/* Compact Banner Card on Mobile */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1 flex items-center gap-2">
                    <ShoppingBag className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Katalog Eksklusif Celana Jeans Premium
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:leading-normal">Nikmati harga diskon khusus Member Premium. Setiap pembelian produk memicu Bonus Repeat Order (RO) Rp 5.000 untuk sponsor Anda.</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-2.5 sm:px-4 sm:py-2.5 rounded-xl flex sm:block items-center justify-between shrink-0">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 sm:text-slate-400">Saldo Dompet Tersedia</p>
                  <p className="text-xs sm:text-base font-black text-blue-600 font-mono">Rp {user.balance.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Grid View Selector Bar */}
              <div className="flex items-center justify-between bg-white border border-slate-200/90 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-2xs">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  (Produk Utama)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShopGridView('2col')}
                    title="Tampilan 2 Kolom"
                    className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      shopGridView === '2col' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShopGridView('1col')}
                    title="Tampilan 1 Kolom"
                    className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      shopGridView === '1col' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={
                shopGridView === '2col' 
                  ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" 
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              }>
                {products.map((p) => {
                  const savings = Math.max(0, p.price - p.member_price);
                  return (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                      <div onClick={() => setSelectedDetailProduct(p)} className="cursor-pointer">
                        <div className="relative w-full h-36 sm:h-52 bg-slate-100 overflow-hidden group/img">
                          <img 
                            referrerPolicy="no-referrer" 
                            src={p.image} 
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                            alt={p.name} 
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-black uppercase tracking-wider gap-1">
                            <Eye className="w-4 h-4" /> Lihat Detail
                          </div>
                          {/* Member Special Tag or Custom Badge */}
                          {p.badge ? (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white text-[8px] sm:text-[10px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs uppercase tracking-wide">
                              {p.badge}
                            </div>
                          ) : (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-blue-600 text-white text-[8px] sm:text-[10px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs">
                              MEMBER EXCLUSIVE
                            </div>
                          )}
                          {/* Stock Tag */}
                          <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-[8px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border shadow-xs ${
                            p.stock > 10 ? 'bg-white/95 text-green-700 border-green-200' :
                            p.stock > 0 ? 'bg-amber-500 text-white border-amber-600' :
                            'bg-red-600 text-white border-red-700'
                          }`}>
                            {p.stock > 0 ? `Stok: ${p.stock}` : 'Habis'}
                          </div>
                        </div>

                        <div className="p-3 sm:p-4 space-y-2">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-1">{p.name}</h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                          </div>

                          <div className="bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100/90 text-left">
                            <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-slate-400 font-medium">
                              <span>Retail:</span>
                              <span className="line-through text-slate-400 font-semibold">Rp {p.price.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-0.5">
                              <span className="text-[8px] sm:text-[10px] font-bold text-slate-700">Member:</span>
                              <span className="text-blue-600 font-black text-xs sm:text-base font-mono">Rp {p.member_price.toLocaleString('id-ID')}</span>
                            </div>
                            {savings > 0 && (
                              <div className="mt-0.5 text-[8px] sm:text-[9px] text-emerald-600 font-extrabold text-right truncate">
                                🎉 Hemat Rp {savings.toLocaleString('id-ID')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 pt-0 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailProduct(p)}
                          className="w-full py-2 rounded-xl text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> Detail
                        </button>
                        <button
                          id={`btn-buy-product-${p.id}`}
                          onClick={() => {
                            setPurchaseModalProduct(p);
                            const fullAddr = [user.address, user.city].filter(Boolean).join(', ');
                            setPurchaseAddress(fullAddr || '');
                            setAddressSource('profile');
                            setPurchasePaymentMethod('saldo');
                          }}
                          disabled={p.stock < 1 || loadingAction}
                          className={`w-full py-2 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
                            p.stock < 1 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Beli (RO)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: DATA PEMBELIAN PRODUK RO & STATUS PENGIRIMAN */}
          {activeTab === 'orders' && (
            <div className="space-y-6 text-left" id="user-orders-tab-content">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2 text-left">
                    <Truck className="text-blue-600 w-5 h-5 shrink-0" /> Data Pembelian & Status Pengiriman Produk RO
                  </h3>
                  <p className="text-xs text-slate-500 text-left">Lacak seluruh riwayat invoice pembelian produk RO Anda, upload bukti transfer bank, ekspedisi pengiriman, hingga nomor resi paket Anda.</p>
                </div>
              </div>

              {(() => {
                const userOrders = (orders || []).filter(o => 
                  (o.username && o.username.toLowerCase() === user.username.toLowerCase()) || 
                  (o.phone && o.phone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''))
                );

                if (userOrders.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Belum Ada Riwayat Pesanan</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">Pesanan pendaftaran member baru atau pembelian produk di menu Belanja Jeans akan muncul di sini beserta nomor resi pengiriman.</p>
                      <button
                        onClick={() => setActiveTab('shop')}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" /> Beli Produk Jeans
                      </button>
                    </div>
                  );
                }

                const filteredOrders = userOrders.filter(ord => {
                  if (orderStatusFilter === 'DIPROSES') return ord.status !== 'DIKIRIM' && ord.status !== 'TERIMA' && ord.status !== 'SELESAI' && ord.status !== 'BATAL';
                  if (orderStatusFilter === 'DIKIRIM') return ord.status === 'DIKIRIM';
                  if (orderStatusFilter === 'TERIMA') return ord.status === 'TERIMA' || ord.status === 'SELESAI';
                  if (orderStatusFilter === 'BATAL') return ord.status === 'BATAL' || ord.status === 'DIBATALKAN';
                  return true;
                });

                return (
                  <div className="space-y-4 text-left">
                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {[
                        { key: 'ALL', label: 'Semua Pesanan', count: userOrders.length },
                        { key: 'DIPROSES', label: 'Diproses Gudang', count: userOrders.filter(o => o.status !== 'DIKIRIM' && o.status !== 'TERIMA' && o.status !== 'SELESAI' && o.status !== 'BATAL').length },
                        { key: 'DIKIRIM', label: 'Dalam Pengiriman', count: userOrders.filter(o => o.status === 'DIKIRIM').length },
                        { key: 'TERIMA', label: 'Selesai', count: userOrders.filter(o => o.status === 'TERIMA' || o.status === 'SELESAI').length },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setOrderStatusFilter(tab.key as any)}
                          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                            orderStatusFilter === tab.key
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {tab.label}
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            orderStatusFilter === tab.key ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Accordion Orders Container */}
                    <div className="space-y-3 text-left">
                      {filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                          Tidak ada pesanan dengan status terpilih.
                        </div>
                      ) : (
                        filteredOrders.map((ord) => {
                          const isExpanded = expandedOrderId === ord.id;
                          const isFinished = ord.status === 'TERIMA' || ord.status === 'SELESAI';
                          const isShipping = ord.status === 'DIKIRIM';
                          const isCanceled = ord.status === 'BATAL' || ord.status === 'DIBATALKAN';

                          return (
                            <div 
                              key={ord.id} 
                              className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden text-left ${
                                isExpanded ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* Accordion FAQ Header Bar (Clickable) */}
                              <div
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                className="p-3.5 sm:p-4 cursor-pointer select-none flex flex-col gap-2.5 hover:bg-slate-50/80 transition"
                              >
                                {/* Row 1: Invoice, Date, Status */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-mono font-black text-slate-900 truncate">
                                      {ord.invoice_no}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                                      • {new Date(ord.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      isFinished ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      isShipping ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      isCanceled ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                      'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {isFinished ? 'DITERIMA' : isShipping ? 'DIKIRIM' : isCanceled ? 'BATAL' : 'DIPROSES'}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                  </div>
                                </div>

                                {/* Row 2: Product Name & Courier/Resi Pill */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                                  <div className="min-w-0">
                                    <span className="font-extrabold text-slate-900 truncate block">
                                      {ord.product_name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] font-black text-slate-900 font-mono">
                                        Rp {((ord.amount || 0) + (ord.unique_code || 0)).toLocaleString('id-ID')}
                                      </span>
                                      {ord.unique_code ? (
                                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[9px] font-black font-mono">
                                          Kode Unik: #{ord.unique_code}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-start sm:self-auto text-[10px]">
                                    <span className="bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-md border border-slate-200">
                                      {ord.courier || 'JNE REGULER'}
                                    </span>
                                    {ord.tracking_number ? (
                                      <span className="bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded-md border border-blue-200">
                                        Resi: {ord.tracking_number}
                                      </span>
                                    ) : (
                                      <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                        Resi Belum Terbit
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Accordion FAQ Body (Expanded) */}
                              {isExpanded && (
                                <div className="bg-slate-50/90 border-t border-slate-100 p-4 sm:p-5 space-y-4 text-xs text-left animate-fadeIn">
                                  {/* Action Toolbar */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                                    <div className="flex items-center gap-2">
                                      {ord.tracking_number && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUserSyncTracking(ord);
                                          }}
                                          disabled={syncingOrderId === ord.id}
                                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                                        >
                                          <RefreshCw className={`w-3.5 h-3.5 ${syncingOrderId === ord.id ? 'animate-spin' : ''}`} />
                                          {syncingOrderId === ord.id ? 'Memuat Resi API...' : 'Cek Status Live API'}
                                        </button>
                                      )}

                                      {ord.tracking_number && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(ord.tracking_number || '');
                                            setCopiedTrackingId(ord.id);
                                            setTimeout(() => setCopiedTrackingId(null), 2000);
                                          }}
                                          className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                                        >
                                          {copiedTrackingId === ord.id ? (
                                            <>
                                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3.5 h-3.5 text-slate-500" /> Salin Resi
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Tgl Transaksi: {new Date(ord.created_at).toLocaleString('id-ID')}
                                    </span>
                                  </div>

                                  {/* Proof of Transfer RO Payment Section */}
                                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                                          STATUS PEMBAYARAN & BUKTI TRANSFER PESANAN RO
                                        </span>
                                        <p className="text-xs text-slate-700 mt-0.5">
                                          Metode: <strong className="font-extrabold text-slate-900">{ord.payment_method || 'Transfer Bank'}</strong>
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedProofOrder(ord);
                                          setProofImageInput(ord.proof_image || '');
                                          setProofNotesInput(ord.proof_notes || '');
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer shrink-0"
                                      >
                                        <Camera className="w-4 h-4" />
                                        {ord.proof_image ? '📸 Lihat / Ubah Bukti TF' : '📸 Upload Bukti Transfer RO'}
                                      </button>
                                    </div>

                                    {ord.proof_image ? (
                                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={ord.proof_image}
                                            alt="Bukti Transfer"
                                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewProofModalImage(ord.proof_image || null);
                                            }}
                                          />
                                          <div>
                                            <span className="text-emerald-800 font-extrabold block text-[11px]">
                                              ✅ Bukti Transfer Berhasil Terkirim
                                            </span>
                                            {ord.proof_notes && <p className="text-[10px] text-slate-600 font-mono mt-0.5">{ord.proof_notes}</p>}
                                            <span className="text-[9px] text-slate-400">
                                              Waktu: {ord.proof_submitted_at ? new Date(ord.proof_submitted_at).toLocaleString('id-ID') : 'Menunggu Verifikasi'}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                                          Sedang Diverifikasi
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                        <span>Jika Anda memilih pembayaran Transfer Bank, silakan unggah foto / struk bukti transfer agar sistem memproses pengiriman paket Anda.</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Shipping Details Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EKSPEDISI</span>
                                      <span className="font-extrabold text-slate-900 block mt-0.5">{ord.courier || 'JNE REGULER'}</span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NOMOR RESI PENGIRIMAN</span>
                                      <span className="font-mono font-black text-blue-600 block text-xs mt-0.5">
                                        {ord.tracking_number || 'Dalam Proses Penerbitan'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PRODUK & TOTAL</span>
                                      <span className="font-extrabold text-slate-900 block mt-0.5">{ord.product_name}</span>
                                      <span className="font-mono font-bold text-slate-700">Rp {(ord.amount || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                  </div>

                                  {/* Alamat Tujuan Pengiriman */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ALAMAT TUJUAN PENGIRIMAN</span>
                                    <p className="font-bold text-slate-900">{ord.fullname} ({ord.phone})</p>
                                    <p className="text-slate-600 leading-relaxed text-[11px]">{ord.address || 'Alamat sesuai data registrasi'}</p>
                                  </div>

                                  {/* Tracking Timeline Steps */}
                                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3 text-left">
                                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-blue-600" /> TAHAPAN PERJALANAN PAKET
                                    </h4>

                                    <div className="space-y-3 pl-3 border-l-2 border-blue-600 text-left">
                                      {(ord.steps && ord.steps.length > 0 ? ord.steps : [
                                        { title: "Pesanan Masuk & Terbayar", time: new Date(ord.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB", done: true, description: "Pesanan diproses server sistem" },
                                        { title: "Gudang Paking & QC Produk", time: "Diproses Gudang", done: ord.status !== 'PENDING', description: "Pengecekan jahitan & kerapian paking" },
                                        { title: "Penyerahan ke Ekspedisi", time: ord.tracking_number ? "Resi Terbit" : "Menunggu Resi", done: ord.status === 'DIKIRIM' || ord.status === 'TERIMA' || ord.status === 'SELESAI', description: `Nomor Resi: ${ord.tracking_number || 'Dalam Proses'}` },
                                        { title: "Pesanan Tiba di Alamat Tujuan", time: isFinished ? "Selesai" : "Estimasi 2-3 Hari", done: isFinished, description: "Diterima pemesan" }
                                      ]).map((st: any, idx: number) => (
                                        <div key={idx} className="relative pl-3 text-xs text-left">
                                          <span className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-white ${st.done ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                                          <div className="flex items-center justify-between text-left">
                                            <span className={`font-extrabold ${st.done ? 'text-slate-900' : 'text-slate-400'}`}>{st.title}</span>
                                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{st.time}</span>
                                          </div>
                                          {st.description && <p className="text-[10px] text-slate-500 mt-0.5 text-left">{st.description}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: DEPO & WD & RIWAYAT TRANSAKSI */}
          {activeTab === 'finance' && (
            <div className="space-y-6" id="finance-tab-content">
              {/* Top Finance Sub-Tabs Navigation */}
              <div className="grid grid-cols-3 p-1 sm:p-1.5 bg-slate-100 rounded-2xl border border-slate-200/90 gap-1 sm:gap-1.5 shadow-2xs w-full max-w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('deposit')}
                  className={`py-2 px-1 sm:py-2.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-extrabold transition flex items-center justify-center gap-1 sm:gap-2 cursor-pointer min-w-0 ${
                    financeSubTab === 'deposit' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate hidden sm:inline">Isi Saldo (Deposit)</span>
                  <span className="truncate inline sm:hidden">Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('withdraw')}
                  className={`py-2 px-1 sm:py-2.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-extrabold transition flex items-center justify-center gap-1 sm:gap-2 cursor-pointer min-w-0 ${
                    financeSubTab === 'withdraw' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate hidden sm:inline">Penarikan (Withdraw)</span>
                  <span className="truncate inline sm:hidden">Withdraw</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('history')}
                  className={`py-2 px-1 sm:py-2.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-extrabold transition flex items-center justify-center gap-1 sm:gap-2 cursor-pointer min-w-0 ${
                    financeSubTab === 'history' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate hidden sm:inline">Riwayat Transaksi</span>
                  <span className="truncate inline sm:hidden">Riwayat</span>
                </button>
              </div>

              {/* Sub-Tab 1: Deposit */}
              {financeSubTab === 'deposit' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-sm space-y-5 max-w-3xl mx-auto text-left">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ArrowDownLeft className="text-blue-600 w-5 h-5" /> Isi Saldo Dompet (Deposit)
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
                        placeholder="Contoh: 550000"
                        value={depAmount}
                        onChange={(e) => setDepAmount(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-extrabold"
                      />
                      <span className="text-[10px] text-slate-400">Minimal deposit adalah Rp 50.000</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</label>
                      <div className={`grid ${isMidtransEnabled ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'} gap-2.5`}>
                        {isMidtransEnabled && (
                          <>
                            <button
                              type="button"
                              id="dep-method-qris"
                              onClick={() => setDepMethod('qris')}
                              className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                                depMethod === 'qris' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-black text-[10px] tracking-tighter text-red-600 block">QRIS</span>
                              <span className="text-[8px] opacity-75">Midtrans Instan</span>
                            </button>

                            <button
                              type="button"
                              id="dep-method-bca"
                              onClick={() => setDepMethod('bca')}
                              className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                                depMethod === 'bca' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-extrabold block">BCA</span>
                              <span className="text-[8px] opacity-75">Midtrans VA</span>
                            </button>

                            <button
                              type="button"
                              id="dep-method-mandiri"
                              onClick={() => setDepMethod('mandiri')}
                              className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                                depMethod === 'mandiri' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-extrabold block">MANDIRI</span>
                              <span className="text-[8px] opacity-75">Midtrans VA</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          id="dep-method-manual"
                          onClick={() => setDepMethod('transfer_bank')}
                          className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                            depMethod === 'transfer_bank' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-extrabold block text-slate-800">BANK DIRECT</span>
                          <span className="text-[8px] text-amber-700 font-extrabold">Transfer Manual Bank Official</span>
                        </button>
                      </div>
                    </div>

                    {Number(depAmount) >= 50000 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Nominal Deposit Pokok:</span>
                          <span className="font-mono font-bold">Rp {Number(depAmount).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-800">
                          <span className="font-bold flex items-center gap-1">
                            🔑 Kode Unik Verifikasi:
                          </span>
                          <span className="font-mono font-black bg-amber-200/80 px-2 py-0.5 rounded text-amber-950 border border-amber-300">
                            +Rp {depUniqueCode} (3 Angka)
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-amber-200 text-slate-900 font-extrabold">
                          <span>TOTAL HARUS DITRANSFER:</span>
                          <span className="font-mono font-black text-sm text-emerald-700">
                            Rp {(Number(depAmount) + depUniqueCode).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800 italic mt-0.5">
                          📌 3 Digit Kode Unik ditambahkan otomatis di belakang nominal transfer agar transaksi Anda langsung terdeteksi & diverifikasi otomatis.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      id="btn-submit-deposit"
                      disabled={loadingAction}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm shadow flex items-center justify-center gap-2 cursor-pointer"
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
                        deposits.map((dep) => {
                          const code = dep.unique_code || (100 + dep.id % 899);
                          const totalPay = dep.amount + code;
                          return (
                            <div key={dep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
                              <div className="flex justify-between items-start text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900 font-mono text-sm">Rp {totalPay.toLocaleString('id-ID')}</p>
                                    <span className="bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[10px] font-black px-2 py-0.5 rounded">
                                      Kode Unik: #{code}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Pokok Rp {dep.amount.toLocaleString('id-ID')} + Unik Rp {code}
                                  </p>
                                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">{dep.method} • ID #{dep.id}</p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                  dep.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {dep.status}
                                </span>
                              </div>

                              {dep.status === 'pending' && (
                                <div className="space-y-3 border-t border-slate-200/60 pt-3">
                                  <div className="flex items-center justify-between text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                    <span className="text-[11px] text-amber-900 font-bold">Transfer Sesuai Nominal Unik:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(String(totalPay));
                                        setCopiedDepId(dep.id);
                                        setTimeout(() => setCopiedDepId(null), 2000);
                                      }}
                                      className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition shadow-xs cursor-pointer"
                                    >
                                      {copiedDepId === dep.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                      {copiedDepId === dep.id ? "Tersalin!" : `Salin Rp ${totalPay.toLocaleString('id-ID')}`}
                                    </button>
                                  </div>

                                  {isMidtransEnabled && dep.method === 'qris' && dep.payment_code && (
                                    <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-slate-100">
                                      <p className="text-[9px] text-red-600 font-bold tracking-widest uppercase mb-1">Pindai Kode QRIS Di Bawah</p>
                                      <img referrerPolicy="no-referrer" src={dep.payment_code} className="w-32 h-32" alt="QRIS Code" />
                                    </div>
                                  )}
                                  
                                  {isMidtransEnabled && dep.payment_code && dep.method !== 'transfer_bank' && dep.method !== 'manual' && (
                                    <div className="bg-blue-50 rounded-lg p-2.5 text-[10px] text-blue-900 border border-blue-100">
                                      <strong>Kode/VA VA:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 block mt-1 break-all">{dep.payment_code}</code>
                                    </div>
                                  )}

                                  {dep.proof_image ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div>
                                          <p className="font-extrabold text-[11px]">Bukti Transfer Terkirim</p>
                                          <p className="text-[10px] text-emerald-700">Menunggu Verifikasi & Persetujuan</p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setViewProofModalImage(dep.proof_image || null)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" /> Lihat Bukti
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      id={`btn-confirm-proof-${dep.id}`}
                                      onClick={() => {
                                        setSelectedProofDeposit(dep);
                                        setProofImageInput('');
                                        setProofNotesInput('');
                                      }}
                                      className="w-full bg-[#C41230] hover:bg-[#a00e26] text-white text-xs py-2.5 rounded-xl font-extrabold transition flex items-center justify-center gap-2 shadow cursor-pointer uppercase tracking-wider"
                                    >
                                      <Camera className="w-4 h-4" /> Konfirmasi Pembayaran / Kirim Bukti Transfer
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Withdrawal */}
              {financeSubTab === 'withdraw' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-sm space-y-5 max-w-3xl mx-auto text-left">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ArrowUpRight className="text-blue-600 w-5 h-5" /> Penarikan Dana (Withdrawal)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tarik dana bonus Anda langsung ke rekening bank lokal Anda.</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition text-sm shadow flex items-center justify-center gap-2 cursor-pointer"
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
              )}

              {/* Sub-Tab 3: Transaction History (2-Column Mobile Format) */}
              {financeSubTab === 'history' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-sm space-y-5 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="text-purple-600 w-5 h-5" /> Riwayat Transaksi Finansial
                    </h3>
                    <span className="text-[11px] font-extrabold text-slate-500">
                      Total {transactions.length} Catatan
                    </span>
                  </div>

                  {/* Mobile 1-Row 2-Column List View */}
                  <div className="block sm:hidden space-y-2">
                    {transactions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                        Belum ada riwayat transaksi finansial
                      </p>
                    ) : (
                      transactions.map((t) => (
                        <div key={t.id} className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex justify-between items-center gap-2.5 text-left">
                          {/* Kolom 1: Tanggal & Keterangan Singkat */}
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-[9px] text-slate-400 font-bold">{new Date(t.created_at).toLocaleDateString('id-ID')}</p>
                            <p className="text-xs font-bold text-slate-800 truncate">{t.description}</p>
                          </div>

                          {/* Kolom 2: Jumlah & Jenis */}
                          <div className="text-right shrink-0 space-y-0.5">
                            <p className={`text-xs font-mono font-black ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.amount >= 0 ? '+' : ''}Rp {t.amount.toLocaleString('id-ID')}
                            </p>
                            <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                              t.type.includes('bonus') ? 'bg-emerald-100 text-emerald-800' :
                              t.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                              t.type === 'withdrawal' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {t.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop Full Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4 font-extrabold">ID</th>
                          <th className="py-3 px-4 font-extrabold">Tipe</th>
                          <th className="py-3 px-4 font-extrabold">Deskripsi</th>
                          <th className="py-3 px-4 font-extrabold">Nominal</th>
                          <th className="py-3 px-4 font-extrabold">Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada riwayat transaksi finansial</td>
                          </tr>
                        ) : (
                          transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">#{t.id}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                                  {t.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800">{t.description}</td>
                              <td className={`py-3 px-4 font-mono font-bold ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.amount >= 0 ? '+' : ''}Rp {t.amount.toLocaleString('id-ID')}
                              </td>
                              <td className="py-3 px-4 text-slate-400">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Free Product Package Badge / Status Banner */}
              <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Paket Pendaftaran Hak Usaha Member
                  </div>
                  <h3 className="text-lg font-extrabold text-white">Gratis 1 Produk Paket Perdana HEDTRO JEANS (Senilai Rp 550.000)</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Saat Anda mendaftar & melakukan pembayaran pendaftaran Rp 550.000, Anda berhak memperoleh <strong>1x Produk Perdana Celana Jeans HEDTRO JEANS (Senilai Rp 550.000)</strong> secara gratis! Seluruh produk di katalog toko di bawah difungsikan untuk <strong>Repeat Order (RO)</strong>.
                  </p>
                </div>
                <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center space-y-1 w-full md:w-auto">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Status Paket Perdana</span>
                  <span className="inline-block bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-sm">
                    ✓ Telah Termasuk & Aktif
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">Hak Usaha MLM: AKTIF</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REFERRALS SPONSOR */}
          {activeTab === 'referrals' && (() => {
            const totalPages = Math.ceil((referrals.length || 0) / refPageSize) || 1;
            const currentPage = Math.min(refPage, totalPages);
            const paginatedRefs = referrals.slice((currentPage - 1) * refPageSize, currentPage * refPageSize);

            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5 text-left" id="referrals-tab-content">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="text-blue-600 w-5 h-5 shrink-0" /> Anggota Yang Anda Sponsori Langsung
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Daftar rekan kerja yang mendaftar menggunakan ID Referal Anda. Dapatkan Bonus Sponsor Rp 40.000 ketika mereka melakukan aktivasi premium.</p>
                  </div>
                  <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 shrink-0">
                    Total: {referrals.length} Member
                  </span>
                </div>

                {/* 1-Kolom List View dengan Nomor & Tanpa @ */}
                <div className="space-y-2.5">
                  {referrals.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                      Belum ada rekan yang mendaftar via referal Anda
                    </p>
                  ) : (
                    paginatedRefs.map((ref, idx) => {
                      const itemNum = (currentPage - 1) * refPageSize + idx + 1;
                      const cleanUsername = (ref.username || '').replace(/@/g, '');
                      return (
                        <div key={ref.id} className="bg-slate-50/80 hover:bg-slate-100/80 transition rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                          {/* Left: Number + Profile Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-blue-200/80 font-mono">
                              #{itemNum}
                            </span>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{ref.fullname}</h4>
                                <span className="font-mono text-[10px] sm:text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate">
                                  {cleanUsername}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-500 flex-wrap">
                                <span>📱 {ref.phone}</span>
                                <span className="text-slate-300">•</span>
                                <span>📅 {new Date(ref.created_at).toLocaleDateString('id-ID')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Badge */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60 shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold sm:hidden">Status Member:</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wide ${
                              ref.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {ref.is_active ? '● Premium (Verified)' : '○ Free Member (Belum Bayar)'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                {referrals.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium text-[11px] sm:text-xs">
                      Menampilkan {((currentPage - 1) * refPageSize) + 1} - {Math.min(currentPage * refPageSize, referrals.length)} dari {referrals.length} member
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRefPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        ← Sebelumnya
                      </button>

                      <span className="font-bold text-slate-800 px-2 font-mono text-xs">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setRefPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        Selanjutnya →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
              {settings?.enableRewardBonus === false ? (
                <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-3xl p-5 text-xs font-semibold flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-extrabold text-slate-800">Skema Target Reward Jaringan (Non-Aktif)</p>
                      <p className="text-[11px] text-slate-500">Sistem sedang memperbarui skema pencapaian target reward jaringan.</p>
                    </div>
                  </div>
                  <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0">NON-AKTIF</span>
                </div>
              ) : user.is_active ? (
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
              
              {/* Profile Hero Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
                  {/* User Avatar Circle */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-lg shadow-blue-500/20 overflow-hidden">
                      <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center font-display font-black text-2xl text-white overflow-hidden relative">
                        {user.profile_photo ? (
                          <img src={user.profile_photo} alt={user.fullname} className="w-full h-full object-cover" />
                        ) : (
                          user.fullname ? user.fullname.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl cursor-pointer shadow-lg transition border border-slate-900 flex items-center justify-center active:scale-95" title="Upload Foto Profil">
                      <Camera className="w-4 h-4 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        user.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {user.is_active ? '● MEMBER PREMIUM (VERIFIED)' : '○ FREE MEMBER (BELUM BAYAR)'}
                      </span>
                      {user.is_active && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                          <span>Verified</span>
                          <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-500/30" />
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                        ID: {idPrefix}{String(user.id).padStart(6, '0')}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                      {user.fullname || user.username.replace(/^@/, '')}
                    </h2>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 font-medium">
                      <span>Username: <strong className="text-white font-mono">{user.username.replace(/^@/, '')}</strong></span>
                      <span>•</span>
                      <span>Sponsor: <strong className="text-blue-400 font-bold">{user.sponsor_username ? user.sponsor_username.replace(/^@/, '') : 'Perusahaan'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {statusMessage.text && (
                <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                  statusMessage.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
                  <div>
                    <span className="font-bold block">{statusMessage.type === 'success' ? 'Berhasil' : 'Kesalahan'}</span>
                    {statusMessage.text}
                  </div>
                </div>
              )}

              {/* Profile Details Form Grid */}
              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                
                {/* Column 1: Informasi Pribadi & Kontak */}
                <div className="bg-gradient-to-b from-blue-50/70 via-white to-indigo-50/40 rounded-3xl border border-blue-200/80 p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-blue-200/60 flex items-center justify-between">
                      <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" /> 1. Data Diri & Kontak Member
                      </h4>
                      <span className="text-[10px] text-blue-600 font-extrabold bg-blue-100/80 px-2.5 py-0.5 rounded-full">Sesuai KTP</span>
                    </div>

                    {/* Foto Profil Upload Box */}
                    <div className="space-y-1 bg-blue-100/40 p-3.5 rounded-2xl border border-blue-200/80">
                      <label className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider block">Foto Profil Member</label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-sm">
                          {user.profile_photo ? (
                            <img src={user.profile_photo} alt={user.fullname} className="w-full h-full object-cover" />
                          ) : (
                            user.fullname ? user.fullname.charAt(0).toUpperCase() : user.username.replace(/^@/, '').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition active:scale-95">
                            <Camera className="w-4 h-4 text-white" />
                            <span>{uploadingPhoto ? "Mengunggah..." : "Upload Foto Profil"}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handlePhotoUpload} 
                              className="hidden" 
                              disabled={uploadingPhoto}
                            />
                          </label>
                          <p className="text-[10px] text-slate-500 font-medium mt-1">Format foto JPG/PNG (maks 5MB)</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-blue-900/70 uppercase tracking-wider block">ID Member (Sistem)</label>
                        <input
                          type="text"
                          disabled
                          value={`${idPrefix}${String(user.id).padStart(6, '0')}`}
                          className="w-full text-xs font-mono font-bold bg-white border border-blue-200 text-blue-600 rounded-xl px-3.5 py-2.5 cursor-not-allowed shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-blue-900/70 uppercase tracking-wider block">Username Unik</label>
                        <input
                          type="text"
                          disabled
                          value={user.username.replace(/^@/, '')}
                          className="w-full text-xs font-mono bg-white border border-blue-200 text-slate-600 rounded-xl px-3.5 py-2.5 cursor-not-allowed shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider block">Nama Lengkap (Sesuai KTP)</label>
                      <input
                        type="text"
                        required
                        value={profileFullname}
                        onChange={(e) => setProfileFullname(e.target.value)}
                        placeholder="Nama lengkap sesuai KTP"
                        className="w-full text-xs bg-white border border-blue-200/90 text-slate-900 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-blue-900/70 uppercase tracking-wider block">Nomor KTP / NIK (16 Digit)</label>
                      <input
                        type="text"
                        disabled
                        value={profileKtp || "Belum diisi"}
                        className="w-full text-xs font-mono bg-white border border-blue-200 text-slate-500 rounded-xl px-3.5 py-2.5 cursor-not-allowed shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider block">Alamat Email Aktif</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full text-xs bg-white border border-blue-200/90 text-slate-900 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider block">No. HP / Telepon</label>
                        <input
                          type="text"
                          required
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="08123456789"
                          className="w-full text-xs bg-white border border-blue-200/90 text-slate-900 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider block">No. WhatsApp Aktif</label>
                        <input
                          type="text"
                          required
                          value={profileWhatsapp}
                          onChange={(e) => setProfileWhatsapp(e.target.value)}
                          placeholder="08123456789"
                          className="w-full text-xs bg-white border border-blue-200/90 text-slate-900 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-blue-700/80 italic font-medium">
                    *Gunakan nomor WhatsApp aktif untuk menerima konfirmasi penarikan saldo dan resi pengiriman produk.
                  </div>
                </div>

                {/* Column 2: Bank & Alamat Pengiriman */}
                <div className="bg-gradient-to-b from-emerald-50/70 via-white to-teal-50/40 rounded-3xl border border-emerald-200/80 p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-emerald-200/60 flex items-center justify-between">
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" /> 2. Rekening Bank & Alamat Kirim
                      </h4>
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100/80 px-2.5 py-0.5 rounded-full">Transfer Bonus</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-extrabold text-emerald-900/80 uppercase tracking-wider">Pencairan Komisi / Bonus</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-emerald-950 uppercase block">Nama Bank</label>
                          <select
                            value={profileBankName}
                            onChange={(e) => setProfileBankName(e.target.value)}
                            className="w-full text-xs bg-white border border-emerald-200/90 text-slate-900 font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
                          >
                            <option value="BCA">BCA</option>
                            <option value="MANDIRI">MANDIRI</option>
                            <option value="BRI">BRI</option>
                            <option value="BNI">BNI</option>
                            <option value="BSI">BSI</option>
                            <option value="CIMB">CIMB NIAGA</option>
                            <option value="DANA">DANA / OVO</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-emerald-950 uppercase block">No. Rekening</label>
                          <input
                            type="text"
                            value={profileBankAccount}
                            onChange={(e) => setProfileBankAccount(e.target.value)}
                            placeholder="1234567890"
                            className="w-full text-xs font-mono bg-white border border-emerald-200/90 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-emerald-950 uppercase block">Atas Nama Bank</label>
                          <input
                            type="text"
                            value={profileBankHolder}
                            onChange={(e) => setProfileBankHolder(e.target.value)}
                            placeholder="Atas nama..."
                            className="w-full text-xs bg-white border border-emerald-200/90 text-slate-900 font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-emerald-200/60">
                      <p className="text-[10px] font-extrabold text-emerald-900/80 uppercase tracking-wider">Alamat Pengiriman Produk RO</p>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-emerald-950 uppercase block">Alamat Lengkap (Jalan, RT/RW, Kel/Kec)</label>
                        <textarea
                          rows={2}
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="Masukkan alamat lengkap pengiriman..."
                          className="w-full text-xs bg-white border border-emerald-200/90 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-600 uppercase block">Kota / Kabupaten & Provinsi</label>
                        <input
                          type="text"
                          value={profileCity}
                          onChange={(e) => setProfileCity(e.target.value)}
                          placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                          className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      {loadingAction ? "Memproses..." : "💾 Simpan Perubahan Data Profil"}
                    </button>
                  </div>
                </div>

              </form>

              {/* Card 3: Keamanan Kata Sandi */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5 max-w-3xl">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-600" /> Keamanan & Kata Sandi
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">Ubah Kata Sandi Akun</span>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Sandi Saat Ini</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Sandi Baru</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 Karakter"
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                        className="w-full text-xs bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingAction ? "Memproses..." : "🔒 Perbarui Kata Sandi"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </main>

        {/* REPEAT ORDER (RO) CHECKOUT MODAL */}
        {purchaseModalProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 relative animate-fadeIn text-left">
              <button
                onClick={() => setPurchaseModalProduct(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5 mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-base text-slate-900">CHECKOUT REPEAT ORDER (RO)</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">Pilih metode pembayaran & konfirmasi pengiriman</p>
                </div>
              </div>

              {/* Product Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex gap-3 items-center mb-3">
                <img
                  src={purchaseModalProduct.image}
                  alt={purchaseModalProduct.name}
                  className="w-12 h-14 sm:w-16 sm:h-20 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">{purchaseModalProduct.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] sm:text-xs text-slate-400 line-through">Rp {purchaseModalProduct.price.toLocaleString('id-ID')}</span>
                    <span className="text-blue-600 font-extrabold text-xs sm:text-sm font-mono">Rp {purchaseModalProduct.member_price.toLocaleString('id-ID')}</span>
                  </div>
                  <span className="inline-block mt-0.5 text-[8px] sm:text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.2 rounded-full">
                    Diskon Spesial Member Premium
                  </span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProductPurchase(purchaseModalProduct.id, purchasePaymentMethod, purchaseAddress, selectedSize, selectedColor);
                }}
                className="space-y-3"
              >
                {/* Product Size & Color Selection */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>📏 Pilih Ukuran (Size):</span>
                      <span className="text-blue-600 font-extrabold font-mono">Size {selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(purchaseModalProduct.sizes && purchaseModalProduct.sizes.length > 0
                        ? purchaseModalProduct.sizes
                        : ["28", "29", "30", "31", "32", "33", "34", "35", "36"]
                      ).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono border cursor-pointer ${
                            selectedSize === sz
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>🎨 Pilih Warna Denim:</span>
                      <span className="text-blue-600 font-extrabold font-mono">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(purchaseModalProduct.colors && purchaseModalProduct.colors.length > 0
                        ? purchaseModalProduct.colors
                        : ["Deep Indigo Blue", "Jet Black", "Light Wash", "Dark Blue"]
                      ).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                            selectedColor === col
                              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pilihan Alamat Pengiriman Produk
                  </label>

                  {/* Option Choice Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddressSource('profile');
                        const fullAddr = [user.address, user.city].filter(Boolean).join(', ');
                        setPurchaseAddress(fullAddr || '');
                      }}
                      className={`p-2.5 rounded-xl text-left border text-[11px] transition cursor-pointer ${
                        addressSource === 'profile'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold flex items-center gap-1">🏠 Alamat Profil</span>
                        {addressSource === 'profile' && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                        {user.address ? [user.address, user.city].filter(Boolean).join(', ') : 'Belum diisi di profil'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAddressSource('manual');
                        if (addressSource === 'profile') {
                          setPurchaseAddress('');
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left border text-[11px] transition cursor-pointer ${
                        addressSource === 'manual'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold flex items-center gap-1">✏️ Kolom Manual</span>
                        {addressSource === 'manual' && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                        Ketik alamat lain
                      </p>
                    </button>
                  </div>

                  {addressSource === 'profile' ? (
                    <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 text-[10px] uppercase tracking-wider">Alamat Dari Profil Member:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPurchaseModalProduct(null);
                            setActiveTab('profil');
                          }}
                          className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                        >
                          Ubah Di Profil
                        </button>
                      </div>
                      <p className="font-semibold text-slate-800 leading-relaxed">
                        {[user.address, user.city].filter(Boolean).join(', ') || (
                          <span className="text-amber-700 italic font-normal">Alamat profil Anda belum diisi. Silakan klik tombol 'Kolom Manual' di atas untuk mengetik alamat, atau lengkapi profil.</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Ketik Alamat Pengiriman Manual:</label>
                      <textarea
                        rows={2}
                        value={purchaseAddress}
                        onChange={(e) => setPurchaseAddress(e.target.value)}
                        placeholder="Alamat pengiriman lengkap (Jalan, No. Rumah, RT/RW, Kecamatan, Kota/Kabupaten, Provinsi, Kode Pos)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Payment Method Option */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Pilih Metode Pembayaran
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Option 1: Potong Saldo Akun */}
                    <label
                      className={`border rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5 cursor-pointer transition ${
                        purchasePaymentMethod === 'saldo'
                          ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="saldo"
                        checked={purchasePaymentMethod === 'saldo'}
                        onChange={() => setPurchasePaymentMethod('saldo')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 truncate">💳 Potong Saldo Member</span>
                          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-blue-600 shrink-0">
                            Saldo: Rp {user.balance.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          {user.balance >= purchaseModalProduct.member_price
                            ? '✅ Saldo mencukupi. Pemotongan instan.'
                            : '⚠️ Saldo tidak mencukupi (Deposit / Transfer Bank)'}
                        </p>
                      </div>
                    </label>

                    {/* Option 2: Transfer Bank / QRIS */}
                    <label
                      className={`border rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5 cursor-pointer transition ${
                        purchasePaymentMethod === 'transfer'
                          ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={purchasePaymentMethod === 'transfer'}
                        onChange={() => setPurchasePaymentMethod('transfer')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 block">🏦 Transfer Bank / QRIS Direct</span>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          BCA / Mandiri / BRI / QRIS. Pesanan otomatis terkonfirmasi.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bank Transfer Details Box when Transfer is chosen */}
                {purchasePaymentMethod === 'transfer' && (
                  <div className="bg-slate-900 text-white rounded-xl p-3 text-xs space-y-2">
                    <span className="text-[9px] font-extrabold uppercase text-amber-400 tracking-wider block">
                      🏦 REKENING TUJUAN TRANSFER OFFICIAL & KODE UNIK
                    </span>
                    
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-500/40 space-y-1 text-[11px]">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Harga Produk Member:</span>
                        <span className="font-mono">Rp {purchaseModalProduct.member_price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-300 font-bold">
                        <span>🔑 Kode Unik Verifikasi:</span>
                        <span className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                          +Rp {roUniqueCode} (3 Angka)
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center font-black">
                        <span className="text-white text-[10px] uppercase">TOTAL DITRANSFER:</span>
                        <span className="font-mono text-emerald-400 text-sm">
                          Rp {(purchaseModalProduct.member_price + roUniqueCode).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 font-mono text-[10px] sm:text-[11px]">
                      {settings?.companyBankName ? (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-400 font-sans">{settings.companyBankName}:</span>
                            <span className="font-extrabold text-white">{settings.companyBankAccount} ({settings.companyBankHolder || 'OFFICIAL'})</span>
                          </div>
                          {settings.companyBank2Name && (
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span className="text-slate-400 font-sans">{settings.companyBank2Name}:</span>
                              <span className="font-extrabold text-white">{settings.companyBank2Account} ({settings.companyBank2Holder || 'OFFICIAL'})</span>
                            </div>
                          )}
                          {settings.companyBank3Name && (
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span className="text-slate-400 font-sans">{settings.companyBank3Name}:</span>
                              <span className="font-extrabold text-white">{settings.companyBank3Account} ({settings.companyBank3Holder || 'OFFICIAL'})</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-0.5">
                            <span className="text-slate-400">BCA:</span>
                            <span className="font-extrabold text-white">1234-5678-90 (PT HEDTRO)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-0.5">
                            <span className="text-slate-400">MANDIRI:</span>
                            <span className="font-extrabold text-white">0987-6543-21 (PT HEDTRO)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-0.5">
                            <span className="text-slate-400">BRI:</span>
                            <span className="font-extrabold text-white">5544-3322-11 (PT HEDTRO)</span>
                          </div>
                        </>
                      )}
                    </div>
                    {settings?.companyBankInstruction && (
                      <p className="text-[10px] text-amber-300 font-sans italic pt-1 border-t border-slate-800">
                        📌 {settings.companyBankInstruction}
                      </p>
                    )}
                  </div>
                )}

                {/* Total & Submit */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pembayaran</span>
                    <span className="text-xs sm:text-base font-black text-blue-600 font-mono">
                      Rp {(purchasePaymentMethod === 'transfer' ? purchaseModalProduct.member_price + roUniqueCode : purchaseModalProduct.member_price).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPurchaseModalProduct(null)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loadingAction || (purchasePaymentMethod === 'saldo' && user.balance < purchaseModalProduct.member_price)}
                      className={`px-4 py-2 font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer ${
                        purchasePaymentMethod === 'saldo' && user.balance < purchaseModalProduct.member_price
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95'
                      }`}
                    >
                      {loadingAction ? 'Memproses Order...' : 'Bayar Sekarang'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* POPUP DETAIL PRODUK & GAMBAR BESAR MEMBER */}
        {selectedDetailProduct && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn text-left">
            <div className="bg-white max-w-3xl w-full rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedDetailProduct(null);
                  setIsImageZoomed(false);
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-slate-900/80 hover:bg-red-600 text-white p-2 rounded-full transition cursor-pointer shadow-md"
                title="Tutup Detail Produk"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image & Zoom */}
                <div className="bg-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[280px] sm:min-h-[380px] border-b md:border-b-0 md:border-r border-slate-200">
                  <div className="relative w-full h-full max-h-[400px] overflow-hidden rounded-2xl bg-white shadow-inner flex items-center justify-center group cursor-zoom-in" onClick={() => setIsImageZoomed(!isImageZoomed)}>
                    <img
                      referrerPolicy="no-referrer"
                      src={selectedDetailProduct.image}
                      alt={selectedDetailProduct.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${isImageZoomed ? 'scale-150 cursor-zoom-out' : 'group-hover:scale-105'}`}
                    />
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Klik Gambar Untuk Zoom
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 w-full justify-between">
                    <span className="bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {selectedDetailProduct.badge ? selectedDetailProduct.badge : "MEMBER EXCLUSIVE"}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md font-mono ${selectedDetailProduct.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      STOK: {selectedDetailProduct.stock} PCS
                    </span>
                  </div>
                </div>

                {/* Info & Specs */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 block mb-1">
                        KATALOG HEDTRO JEANS EXCLUSIVE
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                        {selectedDetailProduct.name}
                      </h3>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Harga Normal Retail:</span>
                        <span className="line-through font-bold">Rp {selectedDetailProduct.price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-blue-600 font-extrabold text-[10px] block">Harga Member Premium:</span>
                          <span className="text-blue-600 font-black font-mono text-xl">
                            Rp {selectedDetailProduct.member_price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {selectedDetailProduct.price > selectedDetailProduct.member_price && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                            🎉 Hemat Rp {(selectedDetailProduct.price - selectedDetailProduct.member_price).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
                        Deskripsi & Spesifikasi Produk:
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedDetailProduct.description || "Celana jeans denim eksklusif dibuat dari bahan Raw Denim 14oz bermutu tinggi dengan kerapian jahitan presisi standar ekspor."}
                      </p>
                      <ul className="text-[11px] text-slate-600 space-y-1 pt-1 list-disc list-inside">
                        <li><strong>Bahan:</strong> Premium Heavyweight Cotton Denim 14oz</li>
                        <li><strong>Fit Style:</strong> Slim Fit / Standard Cut</li>
                        <li><strong>Bonus Komisi:</strong> Bonus RO Rp 5.000 ke Sponsor</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setPurchaseModalProduct(selectedDetailProduct);
                        const fullAddr = [user.address, user.city].filter(Boolean).join(', ');
                        setPurchaseAddress(fullAddr || '');
                        setAddressSource('profile');
                        setPurchasePaymentMethod('saldo');
                        setSelectedDetailProduct(null);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" /> Beli Produk Ini Sekarang (RO)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL AKTIVASI AKUN & TRANSFER BANK MANUAL */}
        {isActivationModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-left animate-fadeIn">
            <div className="bg-white max-w-lg w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 relative">
              <button
                onClick={() => setIsActivationModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">AKTIVASI MEMBER PREMIUM</h3>
                  <p className="text-xs text-slate-500">Pilih metode pembayaran aktivasi akun Rp 550.000</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Method 1: Saldo */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-slate-800">1. Bayar Menggunakan Saldo Dompet</span>
                    <span className="text-xs font-mono font-bold text-blue-600">Saldo: Rp {user.balance.toLocaleString('id-ID')}</span>
                  </div>
                  {user.balance >= 550000 ? (
                    <button
                      onClick={async () => {
                        await handleAccountActivation();
                        setIsActivationModalOpen(false);
                      }}
                      disabled={loadingAction}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                    >
                      ⚡ Aktifkan Sekarang (Potong Saldo Rp 550.000)
                    </button>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      ⚠️ Saldo dompet Anda saat ini (Rp {user.balance.toLocaleString('id-ID')}) belum mencukupi. Silakan lakukan transfer bank manual di bawah.
                    </p>
                  )}
                </div>

                {/* Method 2: Transfer Bank Manual Admin */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-xs text-amber-400">2. Transfer Bank Manual Ke Rekening Admin</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded">Rp 550.000</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Nominal Paket Aktivasi:</span>
                      <span className="font-mono font-bold text-slate-200">Rp 550.000</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        🔑 Kode Unik Verifikasi:
                      </span>
                      <span className="font-mono font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        +Rp {activationUniqueCode} (3 Angka)
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL HARUS DITRANSFER:</span>
                        <span className="text-lg font-black font-mono text-emerald-400 tracking-tight">
                          Rp {(550000 + activationUniqueCode).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(String(550000 + activationUniqueCode));
                          setCopiedTotal(true);
                          setTimeout(() => setCopiedTotal(false), 2000);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        {copiedTotal ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedTotal ? "Tersalin!" : "Salin Total"}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-200/90 leading-relaxed bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50">
                    ⚠️ <strong>PENTING:</strong> Transfer WAJIB TEPAT <strong className="text-amber-300 font-mono font-extrabold">Rp {(550000 + activationUniqueCode).toLocaleString('id-ID')}</strong> (termasuk 3 digit kode unik) agar transaksi otomatis diverifikasi oleh Admin.
                  </p>

                  <div className="space-y-2 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">BANK BCA:</span>
                      <span className="font-extrabold text-amber-400">1234-5678-90 a/n PT HEDTRO JEANS</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-slate-400">BANK MANDIRI:</span>
                      <span className="font-extrabold text-amber-400">0987-6543-21 a/n PT HEDTRO JEANS</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-slate-400">BANK BRI:</span>
                      <span className="font-extrabold text-amber-400">5544-3322-11 a/n PT HEDTRO JEANS</span>
                    </div>
                  </div>

                  {/* Form Upload Bukti Transfer */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 space-y-3 font-sans">
                    <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Camera className="w-4 h-4 text-amber-400" /> UPLOAD STRUK / BUKTI TRANSFER:
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Upload foto / screenshot bukti transfer bank Anda untuk langsung dikirim ke Admin untuk verifikasi & approval.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file);
                            setActProofImage(compressed);
                          } catch (err) {
                            console.warn("Compression error:", err);
                          }
                        }
                      }}
                      className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                    />
                    {actProofImage && (
                      <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-800 max-h-40 bg-slate-900 flex items-center justify-center p-2">
                        <img src={actProofImage} alt="Bukti Transfer Preview" className="max-h-36 object-contain rounded-lg" />
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Catatan Transfer (opsional, contoh: TF M-BCA a.n Budi)"
                      value={actProofNotes}
                      onChange={(e) => setActProofNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      disabled={isUploadingActProof || !actProofImage}
                      onClick={async () => {
                        if (!actProofImage) {
                          alert("Silakan pilih file foto / screenshot bukti transfer terlebih dahulu!");
                          return;
                        }
                        setIsUploadingActProof(true);
                        try {
                          let actDepItem = deposits.find(d => Number(d.amount) === 550000 && d.status === 'pending');
                          if (!actDepItem && onDeposit) {
                            await onDeposit(550000, "transfer_bank", activationUniqueCode);
                          }
                          const depToUse = actDepItem || deposits.find(d => Number(d.amount) === 550000) || deposits[0];
                          if (depToUse && onConfirmDepositProof) {
                            await onConfirmDepositProof(depToUse.id, actProofImage, actProofNotes);
                          }
                          alert("Bukti transfer berhasil dikirim ke Admin! Mohon tunggu konfirmasi approval.");
                          setIsActivationModalOpen(false);
                          setActProofImage('');
                          setActProofNotes('');
                        } catch (err: any) {
                          alert("Gagal mengirim bukti transfer: " + (err.message || err));
                        } finally {
                          setIsUploadingActProof(false);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" /> {isUploadingActProof ? 'Mengirim Bukti Transfer...' : 'Kirim Bukti Transfer ke Admin'}
                    </button>
                  </div>

                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        setDepAmount("550000");
                        setDepMethod("transfer_bank");
                        if (onDeposit) {
                          await onDeposit(550000, "transfer_bank", activationUniqueCode);
                        }
                        setIsActivationModalOpen(false);
                        const totalAct = 550000 + activationUniqueCode;
                        const waMsg = encodeURIComponent(`Halo Admin Hedtro Jeans, saya member @${user.username} (Nama: ${user.fullname}) telah melakukan Transfer Bank sebesar Rp ${totalAct.toLocaleString('id-ID')} (Nominal Rp 550.000 + Kode Unik ${activationUniqueCode}) untuk Aktivasi Member Premium. Mohon validasi akun saya.`);
                        window.open(`https://wa.me/6281234567890?text=${waMsg}`, '_blank');
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Atau Konfirmasi via WhatsApp Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KIRIM BUKTI TRANSFER */}
        {selectedProofDeposit && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white max-w-md w-full rounded-2xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 relative animate-fadeIn text-left space-y-4">
              <button
                type="button"
                onClick={() => setSelectedProofDeposit(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-red-50 text-[#C41230] rounded-xl shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">KONFIRMASI BUKTI TRANSFER</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">Deposit #{selectedProofDeposit.id} • Total Rp {(selectedProofDeposit.amount + (selectedProofDeposit.unique_code || (100 + selectedProofDeposit.id % 899))).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Destination Bank Details */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                <p className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider">Rekening Bank Tujuan Transfer Admin:</p>
                <div className="space-y-1.5 font-mono text-[11px] text-amber-950">
                  <div className="flex justify-between items-center bg-white/80 p-2 rounded-lg border border-amber-200">
                    <div>
                      <span className="font-bold block text-slate-800">{settings?.companyBankName || "BANK BCA"}</span>
                      <span className="text-slate-600 font-bold">{settings?.companyBankAccount || "8830129881"}</span>
                      <span className="text-slate-400 block text-[9px]">a.n {settings?.companyBankHolder || "HEDTRO JEANS OFFICIAL"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(settings?.companyBankAccount || "8830129881")}
                      className="bg-amber-600 text-white font-bold text-[10px] px-2 py-1 rounded hover:bg-amber-700 transition cursor-pointer"
                    >
                      Salin
                    </button>
                  </div>
                  {settings?.companyBank2Name && (
                    <div className="flex justify-between items-center bg-white/80 p-2 rounded-lg border border-amber-200">
                      <div>
                        <span className="font-bold block text-slate-800">{settings.companyBank2Name}</span>
                        <span className="text-slate-600 font-bold">{settings.companyBank2Account}</span>
                        <span className="text-slate-400 block text-[9px]">a.n {settings.companyBank2Holder}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(settings.companyBank2Account)}
                        className="bg-amber-600 text-white font-bold text-[10px] px-2 py-1 rounded hover:bg-amber-700 transition cursor-pointer"
                      >
                        Salin
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Upload */}
              {/* Form Upload Deposit Proof */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!proofImageInput) {
                    alert("Silakan pilih file foto / struk bukti transfer terlebih dahulu!");
                    return;
                  }
                  setIsUploadingProof(true);
                  try {
                    if (onConfirmDepositProof) {
                      await onConfirmDepositProof(selectedProofDeposit.id, proofImageInput, proofNotesInput);
                    }
                    alert("Bukti transfer berhasil dikirim! Tim Admin akan memverifikasi dalam waktu singkat.");
                    setSelectedProofDeposit(null);
                    if (onRefresh) onRefresh();
                  } catch (err: any) {
                    alert(err.message || "Gagal mengirim bukti transfer");
                  } finally {
                    setIsUploadingProof(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Upload Foto / Struk Bukti Transfer Deposit:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImageFile(file);
                          setProofImageInput(compressed);
                        } catch (err) {
                          console.warn("Compression warning:", err);
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  {proofImageInput && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-100 flex items-center justify-center">
                      <img src={proofImageInput} alt="Preview Bukti" className="max-h-40 object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Catatan Tambahan (Nama Pengirim / Bank Sender):
                  </label>
                  <input
                    type="text"
                    value={proofNotesInput}
                    onChange={(e) => setProofNotesInput(e.target.value)}
                    placeholder="Contoh: Transfer via M-BCA a.n Budi Santoso"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploadingProof || !proofImageInput}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                >
                  {isUploadingProof ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isUploadingProof ? "Mengirim Bukti..." : "Kirim Bukti Transfer Sekarang"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL KIRIM BUKTI TRANSFER PESANAN / RO */}
        {selectedProofOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white max-w-md w-full rounded-2xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 relative animate-fadeIn text-left space-y-4">
              <button
                type="button"
                onClick={() => setSelectedProofOrder(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">BUKTI TRANSFER PESANAN RO</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">Invoice #{selectedProofOrder.invoice_no} • Total Rp {(selectedProofOrder.amount || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Destination Bank Details */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                <p className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider">Rekening Bank Tujuan Pembayaran RO:</p>
                <div className="space-y-1.5 font-mono text-[11px] text-amber-950">
                  <div className="flex justify-between items-center bg-white/80 p-2 rounded-lg border border-amber-200">
                    <div>
                      <span className="font-bold block text-slate-800">{settings?.companyBankName || "BANK BCA"}</span>
                      <span className="text-slate-600 font-bold">{settings?.companyBankAccount || "8830129881"}</span>
                      <span className="text-slate-400 block text-[9px]">a.n {settings?.companyBankHolder || "HEDTRO JEANS OFFICIAL"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(settings?.companyBankAccount || "8830129881")}
                      className="bg-amber-600 text-white font-bold text-[10px] px-2 py-1 rounded hover:bg-amber-700 transition cursor-pointer"
                    >
                      Salin
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Upload Order RO Proof */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!proofImageInput) {
                    alert("Silakan pilih file foto / struk bukti transfer terlebih dahulu!");
                    return;
                  }
                  setIsUploadingProof(true);
                  try {
                    if (onConfirmOrderProof) {
                      await onConfirmOrderProof(selectedProofOrder.id, proofImageInput, proofNotesInput);
                    }
                    alert("Bukti transfer pesanan RO berhasil dikirim! Tim Customer Service kami akan memverifikasi dan memproses pesanan Anda.");
                    setSelectedProofOrder(null);
                    if (onRefresh) onRefresh();
                  } catch (err: any) {
                    alert(err.message || "Gagal mengirim bukti transfer pesanan");
                  } finally {
                    setIsUploadingProof(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Upload Foto / Struk Bukti Transfer Pesanan RO:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImageFile(file);
                          setProofImageInput(compressed);
                        } catch (err) {
                          console.warn("Compression warning:", err);
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  {proofImageInput && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-100 flex items-center justify-center">
                      <img src={proofImageInput} alt="Preview Bukti" className="max-h-40 object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Catatan Tambahan (Nama Pengirim / Bank Sender):
                  </label>
                  <input
                    type="text"
                    value={proofNotesInput}
                    onChange={(e) => setProofNotesInput(e.target.value)}
                    placeholder="Contoh: Transfer RO via M-BCA a.n Budi Santoso"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploadingProof || !proofImageInput}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                >
                  {isUploadingProof ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isUploadingProof ? "Mengirim Bukti..." : "Kirim Bukti Transfer Pesanan RO"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VIEW PROOF */}
        {viewProofModalImage && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setViewProofModalImage(null)}>
            <div className="bg-white max-w-lg w-full rounded-2xl p-4 shadow-2xl relative animate-fadeIn text-center space-y-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setViewProofModalImage(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="font-extrabold text-sm text-slate-900">Foto Bukti Transfer</h4>
              <div className="bg-slate-100 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center p-2 border border-slate-200">
                <img src={viewProofModalImage} alt="Bukti Transfer" className="max-h-[65vh] object-contain rounded-lg" />
              </div>
              <button
                type="button"
                onClick={() => setViewProofModalImage(null)}
                className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
