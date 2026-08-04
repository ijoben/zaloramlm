import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import LandingPage from "./components/LandingPage";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PHPSourceViewer from "./components/PHPSourceViewer";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, BinaryTreeNode, Order } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { DEFAULT_USERS } from "./data/defaultUsers";
import { DEFAULT_ORDERS } from "./data/defaultOrders";
import { LogIn, Key, ShieldCheck, Download, Award, X, Copy, Check, Info, RefreshCw, CheckCircle, Mail, Lock, Send, User, CreditCard, ShoppingBag, Users } from "lucide-react";

// Supabase Direct Data Helpers
async function fetchFirestoreUsers(): Promise<MLMUser[]> {
  if (!supabase) return DEFAULT_USERS;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error || !data || data.length === 0) {
      return DEFAULT_USERS;
    }
    return data as MLMUser[];
  } catch (err) {
    console.warn("Supabase fetch users error:", err);
    return DEFAULT_USERS;
  }
}

function findVacantSpotClient(users: MLMUser[], rootId: number, preferredPosition?: 'L' | 'R'): { upline_id: number, position: 'L' | 'R' } {
  const root = users.find(u => Number(u.id) === Number(rootId));
  if (!root) return { upline_id: Number(rootId) || 1, position: preferredPosition || 'L' };

  const pos = preferredPosition || "L";
  const directChild = users.find(u => Number(u.upline_id) === Number(rootId) && u.position === pos);
  if (!directChild) {
    return { upline_id: Number(rootId), position: pos };
  }

  let currentId = Number(directChild.id);
  while (true) {
    const nextChild = users.find(u => Number(u.upline_id) === Number(currentId) && u.position === pos);
    if (!nextChild) {
      return { upline_id: currentId, position: pos };
    }
    currentId = Number(nextChild.id);
  }
}

async function updateAncestorCountsClient(users: MLMUser[], uplineId: number, position: 'L' | 'R') {
  let currUplineId: number | null = uplineId;
  let childPos: 'L' | 'R' = position;

  while (currUplineId !== null && currUplineId !== undefined) {
    const upline = users.find(u => Number(u.id) === Number(currUplineId));
    if (!upline) break;

    if (childPos === 'L') {
      upline.left_count = (Number(upline.left_count) || 0) + 1;
    } else {
      upline.right_count = (Number(upline.right_count) || 0) + 1;
    }

    if (supabase) {
      try {
        await supabase.from('users').update({
          left_count: upline.left_count,
          right_count: upline.right_count
        }).eq('id', upline.id);
      } catch (e) {
        console.warn("Failed updating ancestor count in Supabase:", e);
      }
    }

    childPos = upline.position === 'R' ? 'R' : 'L';
    currUplineId = upline.upline_id !== null && upline.upline_id !== undefined ? Number(upline.upline_id) : null;
  }
}

async function registerUserToFirestoreDirect(regData: {
  username: string;
  fullname: string;
  email: string;
  phone: string;
  password?: string;
  sponsor_username?: string;
  upline_username?: string;
  position?: 'L' | 'R';
  firebase_uid?: string;
  ktp?: string;
  whatsapp?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  address?: string;
  city?: string;
}): Promise<MLMUser> {
  const users = await fetchFirestoreUsers();

  const normalizedUsername = regData.username.toLowerCase().replace(/\s+/g, "").trim();
  if (users.some(u => u.username && u.username.toLowerCase().trim() === normalizedUsername)) {
    throw new Error("Username sudah digunakan oleh member lain");
  }

  let sponsorId: number = 1;
  if (regData.sponsor_username) {
    const sSearch = regData.sponsor_username.toLowerCase().trim();
    const sponsor = users.find(u => u.username && u.username.toLowerCase().trim() === sSearch);
    if (sponsor) sponsorId = Number(sponsor.id);
  }

  let uplineId: number = sponsorId || 1;
  let finalPos: 'L' | 'R' = (regData.position === 'R' || regData.position === 'L') ? regData.position : "L";

  if (regData.upline_username) {
    const uSearch = regData.upline_username.toLowerCase().trim();
    const uplineUser = users.find(u => u.username && u.username.toLowerCase().trim() === uSearch);
    if (uplineUser) uplineId = Number(uplineUser.id);
  }

  const taken = users.find(u => Number(u.upline_id) === Number(uplineId) && u.position === finalPos);
  if (taken) {
    const vacancy = findVacantSpotClient(users, uplineId, finalPos);
    uplineId = vacancy.upline_id;
    finalPos = vacancy.position;
  }

  const newUserId = Math.max(...users.map(u => Number(u.id) || 0), 0) + 1;
  const newUser: MLMUser = {
    id: newUserId,
    username: normalizedUsername,
    fullname: regData.fullname,
    email: regData.email,
    phone: regData.phone,
    password: regData.password || "password123",
    is_active: true, // Auto Active upon registration package
    upline_id: uplineId,
    position: finalPos,
    sponsor_id: sponsorId,
    balance: 0,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 0,
    left_sales: 0,
    right_sales: 0,
    created_at: new Date().toISOString(),
    role: "user",
    firebase_uid: regData.firebase_uid || "",
    ktp: regData.ktp || "",
    whatsapp: regData.whatsapp || regData.phone || "",
    bank_name: regData.bank_name || "",
    bank_account: regData.bank_account || "",
    bank_holder: regData.bank_holder || regData.fullname || "",
    address: regData.address || "",
    city: regData.city || ""
  };

  const updatedUsers = [...users, newUser];

  if (supabase) {
    try {
      await supabase.from('users').upsert(newUser);
      await updateAncestorCountsClient(updatedUsers, uplineId, finalPos);

      // Log Gratis 1 Produk Paket Perdana (Rp 550.000) transaction for the new user
      await createFirestoreTransaction({
        id: Date.now(),
        user_id: newUserId,
        username: normalizedUsername,
        type: "bonus_produk",
        amount: 550000,
        description: "Bonus Registrasi: Gratis 1 Produk Paket Perdana HEDTRO JEANS senilai Rp 550.000 (Termasuk Paket Pendaftaran Hak Usaha)",
        created_at: new Date().toISOString()
      });

      // Distribute Sponsor Bonus (Rp 40.000) to Sponsor
      if (sponsorId) {
        const sponsor = users.find(u => Number(u.id) === Number(sponsorId));
        if (sponsor) {
          const newSponBal = (Number(sponsor.balance) || 0) + 40000;
          const newSponBonus = (Number(sponsor.sponsor_bonus) || 0) + 40000;
          await updateFirestoreUserProfile(sponsor.id, {
            balance: newSponBal,
            sponsor_bonus: newSponBonus
          } as any);
          await createFirestoreTransaction({
            id: Date.now() + 1,
            user_id: sponsor.id,
            username: sponsor.username,
            type: "sponsor_bonus",
            amount: 40000,
            description: `Bonus Sponsor Pendaftaran Member Baru ${normalizedUsername} (+Rp 40.000)`,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("Supabase upsert failed for user registration:", e);
    }
  }

  return newUser;
}

function buildClientBinaryTree(users: MLMUser[], userId: number, depth = 0, maxDepth = 30): BinaryTreeNode | null {
  if (depth > maxDepth) return null;
  const user = users.find(u => Number(u.id) === Number(userId));
  if (!user) return null;

  const children = users.filter(u => {
    const uUpline = u.upline_id !== null && u.upline_id !== undefined ? Number(u.upline_id) : null;
    const uSponsor = u.sponsor_id !== null && u.sponsor_id !== undefined ? Number(u.sponsor_id) : null;
    return uUpline === Number(userId) || (uUpline === null && uSponsor === Number(userId));
  });

  let leftChild = children.find(u => u.position === "L" || String(u.position).toUpperCase() === "L" || String(u.position).toUpperCase() === "LEFT");
  let rightChild = children.find(u => u.position === "R" || String(u.position).toUpperCase() === "R" || String(u.position).toUpperCase() === "RIGHT");

  // Fallbacks if children exist without explicit or standard position
  if (!leftChild && !rightChild && children.length > 0) {
    leftChild = children[0];
    if (children.length > 1) rightChild = children[1];
  } else if (leftChild && !rightChild && children.length > 1) {
    const remaining = children.filter(u => Number(u.id) !== Number(leftChild!.id));
    if (remaining.length > 0) rightChild = remaining[0];
  } else if (!leftChild && rightChild && children.length > 1) {
    const remaining = children.filter(u => Number(u.id) !== Number(rightChild!.id));
    if (remaining.length > 0) leftChild = remaining[0];
  }

  const leftNode = leftChild ? buildClientBinaryTree(users, Number(leftChild.id), depth + 1, maxDepth) : null;
  const rightNode = rightChild ? buildClientBinaryTree(users, Number(rightChild.id), depth + 1, maxDepth) : null;

  // Compute dynamic stats from actual subtree structure
  const countSubtreeMembers = (node: BinaryTreeNode | null): number => {
    if (!node) return 0;
    return 1 + countSubtreeMembers(node.left) + countSubtreeMembers(node.right);
  };

  const countSubtreeSales = (node: BinaryTreeNode | null): number => {
    if (!node) return 0;
    return (node.is_active ? 1 : 0) + countSubtreeSales(node.left) + countSubtreeSales(node.right);
  };

  const dynLeftCount = countSubtreeMembers(leftNode);
  const dynRightCount = countSubtreeMembers(rightNode);
  const dynLeftSales = countSubtreeSales(leftNode);
  const dynRightSales = countSubtreeSales(rightNode);

  return {
    id: Number(user.id),
    username: user.username,
    fullname: user.fullname,
    is_active: Boolean(user.is_active),
    left_count: Math.max(Number(user.left_count) || 0, dynLeftCount),
    right_count: Math.max(Number(user.right_count) || 0, dynRightCount),
    left_sales: Math.max(Number(user.left_sales) || 0, dynLeftSales),
    right_sales: Math.max(Number(user.right_sales) || 0, dynRightSales),
    left: leftNode,
    right: rightNode
  };
}

async function fetchFirestoreProducts(): Promise<Product[]> {
  if (!supabase) return DEFAULT_PRODUCTS;

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data || data.length === 0) {
      return DEFAULT_PRODUCTS;
    }
    const prods: Product[] = data.map(item => ({
      id: Number(item.id),
      name: item.name || "",
      description: item.description || "",
      price: Number(item.price) || 0,
      member_price: Number(item.member_price) || 0,
      stock: Number(item.stock) || 0,
      image: item.image || "",
      sizes: item.sizes,
      colors: item.colors,
      badge: item.badge
    }));
    prods.sort((a, b) => a.id - b.id);
    return prods;
  } catch (err) {
    console.warn("Supabase fetch products error:", err);
    return DEFAULT_PRODUCTS;
  }
}

async function fetchFirestoreSettings(): Promise<any> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    if (!error && data) return data;
  } catch (err) {
    console.warn("Supabase fetch settings error:", err);
  }
  return null;
}

async function saveFirestoreSettings(newSettings: any): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('system_settings').upsert({ id: 1, ...newSettings });
      return true;
    } catch (err) {
      console.warn("Supabase save settings error:", err);
    }
  }
  return true;
}

async function fetchFirestoreWithdrawals(): Promise<WDRequest[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('wd_requests').select('*');
    if (error || !data) return [];
    const wds: WDRequest[] = data.map(item => ({
      id: Number(item.id),
      user_id: Number(item.user_id),
      username: item.username || "",
      amount: Number(item.amount) || 0,
      bank_name: item.bank_name || "",
      account_number: item.account_number || "",
      account_holder: item.account_holder || "",
      status: item.status || "pending",
      created_at: item.created_at || new Date().toISOString()
    }));
    wds.sort((a, b) => b.id - a.id);
    return wds;
  } catch (err) {
    return [];
  }
}

async function createFirestoreWithdrawal(wd: WDRequest): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('wd_requests').upsert(wd);
    } catch (err) {
      console.warn("Supabase create WD error:", err);
    }
  }
}

async function updateFirestoreWithdrawalStatus(wdId: number, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
  const wds = await fetchFirestoreWithdrawals();
  const oldWd = wds.find(w => Number(w.id) === Number(wdId));

  if (oldWd && status === 'approved' && oldWd.status === 'pending') {
    await createFirestoreTransaction({
      id: Date.now(),
      user_id: oldWd.user_id,
      username: oldWd.username,
      type: "withdrawal",
      amount: 0,
      description: `Penarikan Dana (#WD-${wdId}) Disetujui Admin - Transfer ke Bank ${oldWd.bank_name}`,
      created_at: new Date().toISOString()
    });
  }

  if (supabase) {
    try {
      await supabase.from('wd_requests').update({ status }).eq('id', wdId);
    } catch (err) {
      console.warn("Supabase update WD error:", err);
    }
  }
}

async function fetchFirestoreTransactions(): Promise<Transaction[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error || !data) return [];
    const txs: Transaction[] = data.map(item => ({
      id: Number(item.id),
      user_id: Number(item.user_id),
      username: item.username || "",
      type: item.type || "transaction",
      amount: Number(item.amount) || 0,
      description: item.description || "",
      created_at: item.created_at || new Date().toISOString()
    }));
    txs.sort((a, b) => b.id - a.id);
    return txs;
  } catch (err) {
    return [];
  }
}

async function createFirestoreTransaction(tx: Transaction): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('transactions').upsert(tx);
    } catch (err) {
      console.warn("Supabase create tx error:", err);
    }
  }
}

async function fetchFirestoreDeposits(): Promise<DepositRequest[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('deposit_requests').select('*');
    if (error || !data) return [];
    const deps: DepositRequest[] = data.map(item => ({
      id: Number(item.id),
      user_id: Number(item.user_id),
      username: item.username || "",
      amount: Number(item.amount) || 0,
      unique_code: item.unique_code !== undefined ? Number(item.unique_code) : (100 + (Number(item.id) || 1) % 899),
      method: item.method || "qris",
      status: item.status || "pending",
      payment_code: item.payment_code || "",
      created_at: item.created_at || new Date().toISOString()
    }));
    deps.sort((a, b) => b.id - a.id);
    return deps;
  } catch (err) {
    return [];
  }
}

async function createFirestoreDeposit(dep: DepositRequest): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('deposit_requests').upsert(dep);
    } catch (err) {
      console.warn("Supabase create deposit error:", err);
    }
  }
}

async function fetchFirestoreOrders(): Promise<Order[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('orders').select('*');
    if (error || !data) return DEFAULT_ORDERS;
    const ords: Order[] = data.map(item => ({
      id: Number(item.id),
      invoice_no: item.invoice_no || `INV-${item.id}`,
      user_id: Number(item.user_id) || 0,
      username: item.username || "",
      fullname: item.fullname || "",
      phone: item.phone || "",
      address: item.address || "",
      product_name: item.product_name || "Produk Denim",
      amount: Number(item.amount) || 0,
      unique_code: item.unique_code !== undefined ? Number(item.unique_code) : (100 + (Number(item.id) || 1) % 899),
      payment_method: item.payment_method || "Transfer Bank",
      status: item.status || "DIPROSES",
      courier: item.courier || "JNE REGULER",
      tracking_number: item.tracking_number || "",
      notes: item.notes || "",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      steps: Array.isArray(item.steps) ? item.steps : []
    }));
    ords.sort((a, b) => b.id - a.id);
    return ords;
  } catch (err) {
    return DEFAULT_ORDERS;
  }
}

async function saveFirestoreOrder(ord: Order): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('orders').upsert(ord);
    } catch (err) {
      console.warn("Supabase save order error:", err);
    }
  }
}

async function updateFirestoreDepositStatus(depositId: number, status: 'success' | 'failed' | 'pending'): Promise<void> {
  const deps = await fetchFirestoreDeposits();
  const depData = deps.find(d => Number(d.id) === Number(depositId));

  if (depData && status === 'success' && depData.status === 'pending') {
    const users = await fetchFirestoreUsers();
    const targetUser = users.find(u => Number(u.id) === Number(depData.user_id));
    if (targetUser) {
      const newBal = (Number(targetUser.balance) || 0) + depData.amount;
      await updateFirestoreUserProfile(targetUser.id, { balance: newBal });
    }

    await createFirestoreTransaction({
      id: Date.now(),
      user_id: depData.user_id,
      username: depData.username,
      type: "deposit",
      amount: depData.amount,
      description: `Deposit Saldo Berhasil via ${(depData.method || 'QRIS').toUpperCase()} (+Rp ${depData.amount.toLocaleString("id-ID")})`,
      created_at: new Date().toISOString()
    });
  }

  if (supabase) {
    try {
      await supabase.from('deposit_requests').update({ status }).eq('id', depositId);
    } catch (err) {
      console.warn("Supabase update deposit error:", err);
    }
  }
}

async function addFirestoreProduct(prod: Omit<Product, "id">): Promise<Product> {
  const existing = await fetchFirestoreProducts();
  const nextId = existing.length > 0 ? Math.max(...existing.map(p => Number(p.id) || 0)) + 1 : 1;
  const newProduct: Product = {
    id: nextId,
    name: prod.name,
    description: prod.description || "",
    price: Number(prod.price) || 0,
    member_price: Number(prod.member_price) || 0,
    stock: Number(prod.stock) || 0,
    image: prod.image,
    sizes: prod.sizes,
    colors: prod.colors,
    badge: prod.badge
  };

  if (supabase) {
    try {
      await supabase.from('products').upsert(newProduct);
    } catch (e) {
      console.warn("Supabase add product error:", e);
    }
  }

  return newProduct;
}

async function updateFirestoreProduct(productId: number, stock: number, price: number, memberPrice: number): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('products').update({ stock, price, member_price: memberPrice }).eq('id', productId);
    } catch (e) {
      console.warn("Supabase update product error:", e);
    }
  }
}

async function updateFirestoreProductFull(product: Product): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('products').upsert(product);
    } catch (e) {
      console.warn("Supabase update full product error:", e);
    }
  }
}

async function deleteFirestoreProduct(productId: number): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (e) {
      console.warn("Supabase delete product error:", e);
    }
  }
}

async function updateFirestoreUserProfile(userId: number, updateData: { fullname?: string; email?: string; phone?: string; whatsapp?: string; bank_name?: string; bank_account?: string; bank_holder?: string; address?: string; city?: string; password?: string; balance?: number; is_active?: boolean; sponsor_bonus?: number; pairing_bonus?: number; level_bonus?: number; ro_bonus?: number; wishlist?: number[]; profile_photo?: string }): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('users').update(updateData).eq('id', userId);
    } catch (e) {
      console.warn("Supabase update user profile error:", e);
    }
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<MLMUser | null>(null);
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'php-source'>('landing');

  const currentUserRef = React.useRef<MLMUser | null>(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Listen for Supabase Auth state changes if logged in
  const [sbSession, setSbSession] = useState<any>(null);
  const [magicLinkNotice, setMagicLinkNotice] = useState('');

  useEffect(() => {
    if (!supabase) return;
    
    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSbSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSbSession(session);
      if (session?.user && !currentUserRef.current) {
        const users = await fetchFirestoreUsers();
        const foundUser = users.find(u => u.email && session.user.email && u.email.toLowerCase().trim() === session.user.email.toLowerCase().trim());
        if (foundUser) {
          setCurrentUser(foundUser);
          setActiveView('dashboard');
        } else {
          // Auto-generate profile for new Supabase Auth user
          const newSbUser: MLMUser = {
            id: Date.now(),
            username: session.user.email ? session.user.email.split('@')[0] : `user_${Date.now()}`,
            fullname: session.user.user_metadata?.fullname || session.user.email || 'Supabase Member',
            email: session.user.email || '',
            phone: session.user.user_metadata?.whatsapp || '081234567890',
            password: 'password123',
            sponsor_id: 1,
            upline_id: 1,
            position: 'L',
            balance: 0,
            sponsor_bonus: 0,
            pairing_bonus: 0,
            level_bonus: 0,
            ro_bonus: 0,
            left_count: 0,
            right_count: 0,
            left_sales: 0,
            right_sales: 0,
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString()
          };
          setCurrentUser(newSbUser);
          setActiveView('dashboard');
        }
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSupabaseOAuthLogin = async (provider: 'google' | 'github') => {
    if (!supabase) {
      setLoginError("Supabase client belum terinisialisasi.");
      return;
    }
    try {
      setIsSubmittingLogin(true);
      setLoginError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) setLoginError(`Supabase OAuth (${provider}) error: ${error.message}`);
    } catch (err: any) {
      setLoginError("Koneksi OAuth error: " + err.message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleSupabaseMagicLink = async () => {
    if (!supabase) {
      setLoginError("Supabase client belum terinisialisasi.");
      return;
    }
    const targetEmail = loginUsername.includes('@') ? loginUsername.trim() : `${loginUsername.trim()}@gmail.com`;
    if (!targetEmail || !targetEmail.includes('@')) {
      setLoginError("Masukkan email valid untuk login Supabase Magic Link!");
      return;
    }
    try {
      setIsSubmittingLogin(true);
      setLoginError('');
      setMagicLinkNotice('');
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) {
        setLoginError("Gagal mengirim Magic Link Supabase: " + error.message);
      } else {
        setMagicLinkNotice(`✅ Magic Link Supabase telah dikirim ke ${targetEmail}! Silakan cek email Anda untuk masuk instan.`);
      }
    } catch (err: any) {
      setLoginError("Magic Link error: " + err.message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  
  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123'); // Demo bypass
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

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
  const [regKtp, setRegKtp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regBankName, setRegBankName] = useState('BCA');
  const [regBankAccount, setRegBankAccount] = useState('');
  const [regBankHolder, setRegBankHolder] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSponsor, setRegSponsor] = useState('');
  const [regUpline, setRegUpline] = useState('');
  const [regPosition, setRegPosition] = useState<'L' | 'R'>('L');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Dynamic branding & configuration settings
  const [systemSettings, setSystemSettings] = useState<any>({
    webName: "HEDTRO JEANS Afiliasi & Reseller",
    logoText: "HEDTRO.JEANS",
    logoUrl: "",
    iconUrl: "",
    contactPhone: "081234567890",
    contactEmail: "support@hedtrojeans.com",
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
    orders?: Order[];
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
    orders?: Order[];
    products?: Product[];
  } | null>(null);

  // Orders & Shipping Resi State
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          return;
        }
      }
    } catch {}
    const fsOrders = await fetchFirestoreOrders();
    setOrders(fsOrders);
  };

  const handleUpdateOrder = async (updatedOrder: Order): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) setOrders(data.orders);
      }
    } catch {}

    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    await saveFirestoreOrder(updatedOrder);
    return true;
  };

  const handleCreateOrder = async (orderData: Partial<Order>): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) setOrders(data.orders);
        return true;
      }
    } catch {}

    const newId = Math.max(...orders.map(o => Number(o.id) || 0), 1000) + 1;
    const newOrder: Order = {
      id: newId,
      invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(newId).slice(-3)}`,
      user_id: 0,
      username: orderData.username || "guest",
      fullname: orderData.fullname || "Pelanggan",
      phone: orderData.phone || "-",
      address: orderData.address || "-",
      product_name: orderData.product_name || "Hedtro Denim",
      amount: Number(orderData.amount) || 550000,
      payment_method: orderData.payment_method || "Transfer Bank",
      status: orderData.status || "DIPROSES",
      courier: orderData.courier || "JNE REGULER",
      tracking_number: orderData.tracking_number || `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`,
      notes: orderData.notes || "Pesanan dibuat manual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      steps: [
        { title: "Pesanan Dibuat", time: new Date().toLocaleString("id-ID"), done: true, description: "Menunggu proses" },
        { title: "Diproses Gudang", time: new Date().toLocaleString("id-ID"), done: true, description: "QC & Paking" },
        { title: "Diserahkan ke Kurir", time: "-", done: false, description: "-" },
        { title: "Dalam Pengiriman", time: "-", done: false, description: "-" },
        { title: "Pesanan Diterima", time: "-", done: false, description: "-" }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);
    await saveFirestoreOrder(newOrder);
    return true;
  };

  const handleDeleteOrder = async (orderId: number | string): Promise<boolean> => {
    try {
      await fetch("/api/admin/orders/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId })
      });
    } catch {}

    setOrders(prev => prev.filter(o => Number(o.id) !== Number(orderId)));
    if (supabase) {
      try {
        await supabase.from('orders').delete().eq('id', orderId);
      } catch {}
    }
    return true;
  };

  // Supabase Realtime subscription for Database Collections
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          if (currentUserRef.current) fetchDashboardData();
          fetchProducts();
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    fetchOrders();
  }, []);

  // Sync data automatically every 10 seconds if logged in
  useEffect(() => {
    if (!currentUser) return;
    fetchDashboardData();
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
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          return;
        }
      }
    } catch (err) {
      console.warn("API products unavailable, fetching direct from Firestore...", err);
    }

    const fsProds = await fetchFirestoreProducts();
    if (Array.isArray(fsProds) && fsProds.length > 0) {
      setProducts(fsProds);
    } else {
      setProducts(DEFAULT_PRODUCTS);
    }
  };

  const fetchSettings = async () => {
    let loadedSettings: any = {};

    const fsSettings = await fetchFirestoreSettings();
    if (fsSettings && typeof fsSettings === 'object' && Object.keys(fsSettings).length > 0) {
      loadedSettings = { ...loadedSettings, ...fsSettings };
    }

    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          loadedSettings = { ...loadedSettings, ...data };
        }
      }
    } catch (err) {
      console.warn("API settings unavailable:", err);
    }

    if (Object.keys(loadedSettings).length > 0) {
      setSystemSettings((prev: any) => ({ ...prev, ...loadedSettings }));
    }
  };

  const handleUpdateSettings = async (newSettings: any): Promise<boolean> => {
    // 1. Instant local state update
    setSystemSettings((prev: any) => ({ ...prev, ...newSettings }));

    // 2. Direct write to Firebase Firestore (will trigger onSnapshot for all clients instantly)
    const fsSuccess = await saveFirestoreSettings(newSettings);

    // 3. Sync to Express API
    let apiSuccess = false;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        apiSuccess = true;
      }
    } catch (err) {
      console.warn("Backend API /api/admin/settings error:", err);
    }

    return apiSuccess || fsSuccess;
  };

  const getFallbackUser = (username: string): MLMUser | null => {
    const u = username.toLowerCase().trim();
    if (u === 'admin') {
      return {
        id: 1,
        username: "admin",
        fullname: "Administrator HEDTRO JEANS",
        email: "admin@hedtrojeans.com",
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
    return null;
  };

  const getDefaultAdminDashboard = (user: MLMUser) => {
    const memberUsers = DEFAULT_USERS.filter(u => u.username !== 'admin');
    const activeCount = memberUsers.filter(u => u.is_active).length;
    return {
      metrics: {
        totalMembers: memberUsers.length,
        activeMembers: activeCount,
        inactiveMembers: memberUsers.length - activeCount,
        totalTurnover: 15000000,
        totalBonusesPaid: 3500000,
        pendingWDCount: 1,
        pendingWDAmount: 250000,
        isAutoPayout: false
      },
      users: DEFAULT_USERS,
      withdrawals: [],
      deposits: [],
      transactions: []
    };
  };

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
      { id: 1, title: "Selamat Datang!", message: "Selamat datang di Portal Afiliasi HEDTRO JEANS.", read: false, time: "Baru saja" }
    ],
    binaryTree: {
      user: user,
      left: { user: { username: "koko", fullname: "Koko Prasetyo", is_active: true }, left: null, right: null },
      right: { user: { username: "siti", fullname: "Siti Rahma", is_active: true }, left: null, right: null }
    },
    referrals: []
  });

  const fetchDashboardData = async () => {
    if (!currentUserRef.current) return;
    const targetUser = currentUserRef.current;
    let apiSuccess = false;

    console.log("🔍 [fetchDashboardData] Starting dashboard sync...", {
      username: targetUser.username,
      role: targetUser.role,
      supabaseConnected: !!supabase,
      isVercel: typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    });

    try {
      if (targetUser.role === 'admin') {
        console.log("📡 [fetchDashboardData] Fetching Express API: /api/admin/dashboard");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("/api/admin/dashboard", { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
        if (!currentUserRef.current) return;
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          const data = await res.json();
          console.log("✅ [fetchDashboardData] Backend API response received successfully for admin.");
          const fsTxs = await fetchFirestoreTransactions();
          const fsOrders = await fetchFirestoreOrders();
          if (!currentUserRef.current) return;
          const mergedTxs = data.transactions && data.transactions.length > 0 ? data.transactions : fsTxs;
          const mergedOrders = data.orders && data.orders.length > 0 ? data.orders : fsOrders;
          setAdminDashboardData({ ...data, transactions: mergedTxs, orders: mergedOrders });
          if (data.orders) setOrders(data.orders);
          if (data.settings) setSystemSettings(data.settings);
          apiSuccess = true;
          return;
        } else {
          console.warn(`⚠️ [fetchDashboardData] /api/admin/dashboard returned status ${res.status} (${contentType}). Falling back to direct client-side Firestore connection.`);
        }
      } else {
        console.log(`📡 [fetchDashboardData] Fetching Express API: /api/user/${targetUser.id}/dashboard`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`/api/user/${targetUser.id}/dashboard`, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
        if (!currentUserRef.current) return;
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          const data = await res.json();
          console.log("✅ [fetchDashboardData] Backend API response received successfully for user.");
          const fsTxs = await fetchFirestoreTransactions();
          const fsOrders = await fetchFirestoreOrders();
          if (!currentUserRef.current) return;
          const userTxs = data.transactions && data.transactions.length > 0
            ? data.transactions
            : fsTxs.filter(t => Number(t.user_id) === Number(targetUser.id));
          const userOrds = data.orders && data.orders.length > 0
            ? data.orders
            : fsOrders.filter(o => Number(o.user_id) === Number(targetUser.id) || (o.username && targetUser.username && o.username.toLowerCase() === targetUser.username.toLowerCase()));
          setUserDashboardData({ ...data, transactions: userTxs, orders: userOrds });
          if (data.settings) setSystemSettings(data.settings);
          if (data.user && currentUserRef.current) {
            setCurrentUser(data.user);
          }
          apiSuccess = true;
          return;
        } else {
          console.warn(`⚠️ [fetchDashboardData] /api/user/${targetUser.id}/dashboard returned status ${res.status} (${contentType}). Falling back to direct client-side Firestore connection.`);
        }
      }
    } catch (err) {
      console.warn("⚠️ [fetchDashboardData] API route unavailable or unreachable, proceeding with direct client-side Firestore database read...", err);
    }

    if (!apiSuccess && currentUserRef.current) {
      console.log("🔄 [fetchDashboardData] Executing direct Firestore database fetch for dashboard...");
      // Direct Firestore sync in parallel
      const [fsUsers, fsWithdrawals, fsDeposits, fsTransactions, fsOrders] = await Promise.all([
        fetchFirestoreUsers(),
        fetchFirestoreWithdrawals(),
        fetchFirestoreDeposits(),
        fetchFirestoreTransactions(),
        fetchFirestoreOrders()
      ]);

      console.log("📊 [fetchDashboardData] Firestore direct read complete:", {
        usersCount: fsUsers.length,
        withdrawalsCount: fsWithdrawals.length,
        depositsCount: fsDeposits.length,
        transactionsCount: fsTransactions.length,
        ordersCount: fsOrders.length
      });

      if (!currentUserRef.current) return;

      if (targetUser.role === 'admin') {
        const activeCount = fsUsers.filter(u => u.is_active).length;
        const pendingWDs = fsWithdrawals.filter(w => w.status === 'pending');
        setAdminDashboardData({
          metrics: {
            totalMembers: fsUsers.length,
            activeMembers: activeCount,
            inactiveMembers: fsUsers.length - activeCount,
            totalTurnover: fsUsers.reduce((acc, u) => acc + (u.is_active ? 550000 : 0), 0),
            totalBonusesPaid: fsUsers.reduce((acc, u) => acc + (u.sponsor_bonus || 0) + (u.pairing_bonus || 0), 0),
            pendingWDCount: pendingWDs.length,
            pendingWDAmount: pendingWDs.reduce((sum, w) => sum + w.amount, 0),
            isAutoPayout: false
          },
          users: fsUsers,
          withdrawals: fsWithdrawals,
          deposits: fsDeposits,
          transactions: fsTransactions,
          orders: fsOrders
        });
        setOrders(fsOrders);
        console.log("✅ [fetchDashboardData] Admin dashboard updated via direct Firestore data.");
      } else {
        const freshUser = fsUsers.find(u => Number(u.id) === Number(targetUser.id)) || targetUser;
        if (!currentUserRef.current) return;
        setCurrentUser(freshUser);
        const binaryTree = buildClientBinaryTree(fsUsers, Number(freshUser.id), 0, 30);
        const referrals = fsUsers.filter(u => Number(u.sponsor_id) === Number(freshUser.id));
        const userWDs = fsWithdrawals.filter(w => Number(w.user_id) === Number(freshUser.id));
        const userDeps = fsDeposits.filter(d => Number(d.user_id) === Number(freshUser.id));
        const userTxs = fsTransactions.filter(t => Number(t.user_id) === Number(freshUser.id));
        const userOrds = fsOrders.filter(o => Number(o.user_id) === Number(freshUser.id) || (o.username && freshUser.username && o.username.toLowerCase() === freshUser.username.toLowerCase()));

        setUserDashboardData({
          user: freshUser,
          binaryTree,
          referrals,
          transactions: userTxs,
          deposits: userDeps,
          withdrawals: userWDs,
          orders: userOrds,
          notifications: [
            { id: 1, title: "Selamat Datang!", message: "Selamat datang di Portal Afiliasi HEDTRO JEANS.", read: false, time: "Baru saja" }
          ]
        });
        console.log("✅ [fetchDashboardData] User dashboard updated via direct Firestore data for user:", freshUser.username);
      }
    }
  };



  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUsername) {
      setLoginError("Harap isi username atau email");
      return;
    }
    if (!loginPassword) {
      setLoginError("Harap masukkan kata sandi");
      return;
    }
    setLoginError('');
    setIsSubmittingLogin(true);

    // Format target email for Firebase Auth SDK
    let authEmail = loginUsername.trim();
    if (!authEmail.includes("@")) {
      if (authEmail.toLowerCase() === "admin") {
        authEmail = "admin@hedtrojeans.com";
      } else if (authEmail.toLowerCase() === "budi") {
        authEmail = "budi@gmail.com";
      } else {
        authEmail = `${authEmail.toLowerCase()}@hedtrojeans.com`;
      }
    }

    try {
      // 1. Try Supabase auth sign in if email format
      if (supabase && authEmail.includes("@")) {
        try {
          const { data: sbAuthData, error: sbAuthErr } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: loginPassword,
          });
          if (sbAuthErr) {
            console.warn("⚠️ Supabase auth signIn notice:", sbAuthErr.message);
          } else {
            console.log("✅ Supabase auth signIn success:", sbAuthData);
          }
        } catch (sbErr) {
          console.warn("Supabase auth signIn catch notice:", sbErr);
        }
      }

      // 2. Obtain user profile from backend API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: loginUsername, password: loginPassword }),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setShowLoginModal(false);
          setLoginUsername('');
          setLoginPassword('');
          setIsSubmittingLogin(false);
          setActiveView('dashboard');
          return;
        } else if (res.status !== 500) {
          // Explicit credential error from backend
          const data = await res.json().catch(() => ({}));
          if (data.message) {
            setLoginError(data.message);
            setIsSubmittingLogin(false);
            return;
          }
        }
      } catch (fetchErr) {
        console.warn("API Login fetch timeout or error, proceeding to client fallback...", fetchErr);
      }
    } catch (err: any) {
      console.warn("API Login unreachable, using direct Firestore fallback...", err);
    }

    // 3. Fallback if API backend is unreachable (e.g. Vercel serverless error)
    try {
      const fsUsers = await fetchFirestoreUsers();
      const uSearch = loginUsername.toLowerCase().replace(/\s+/g, "").trim();
      const matched = fsUsers.find(u => 
        (u.username && u.username.toLowerCase().trim() === uSearch) || 
        (u.email && u.email.toLowerCase().trim() === uSearch)
      );

      if (matched) {
        setCurrentUser(matched);
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        setActiveView('dashboard');
      } else {
        const fallbackAdmin = getFallbackUser(loginUsername);
        if (fallbackAdmin) {
          setCurrentUser(fallbackAdmin);
          setShowLoginModal(false);
          setLoginUsername('');
          setLoginPassword('');
          setActiveView('dashboard');
        } else {
          setLoginError("Akun / Email tidak ditemukan dalam database! Silakan mendaftar kembali.");
        }
      }
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPassword) {
      alert("Mohon buat kata sandi untuk akun Anda.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert("Konfirmasi kata sandi tidak cocok dengan kata sandi Anda!");
      return;
    }
    if (!regEmail) {
      alert("Mohon masukkan email Anda.");
      return;
    }

    const createdUsername = regUsername.toLowerCase().replace(/\s+/g, "");

    try {
      // 1. Try Supabase Auth sign up
      if (supabase) {
        try {
          const { data: sbAuthData, error: sbAuthErr } = await supabase.auth.signUp({
            email: regEmail,
            password: regPassword,
            options: {
              data: {
                fullname: regFullname,
                username: createdUsername,
                phone: regPhone
              }
            }
          });
          if (sbAuthErr) {
            console.warn("⚠️ Supabase Auth SignUp Notice:", sbAuthErr.message);
          } else {
            console.log("✅ Supabase Auth SignUp Success:", sbAuthData);
          }
        } catch (sbErr) {
          console.warn("Supabase auth signUp catch notice:", sbErr);
        }
      }

      // 2. Try API register endpoint first
      let apiSuccess = false;
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: createdUsername,
            fullname: regFullname,
            email: regEmail,
            phone: regPhone,
            password: regPassword,
            sponsor_username: regSponsor,
            upline_username: regUpline,
            position: regPosition,
            ktp: regKtp,
            whatsapp: regWhatsapp || regPhone,
            bank_name: regBankName,
            bank_account: regBankAccount,
            bank_holder: regBankHolder || regFullname,
            address: regAddress,
            city: regCity
          })
        });
        if (res.ok) {
          apiSuccess = true;
        } else {
          const data = await res.json().catch(() => ({}));
          if (data.message) {
            alert(data.message);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("Backend API unavailable, saving directly to Supabase database...", apiErr);
      }

      // 3. Direct Supabase write if API backend unavailable
      if (!apiSuccess) {
        await registerUserToFirestoreDirect({
          username: createdUsername,
          fullname: regFullname,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          sponsor_username: regSponsor,
          upline_username: regUpline,
          position: regPosition,
          ktp: regKtp,
          whatsapp: regWhatsapp || regPhone,
          bank_name: regBankName,
          bank_account: regBankAccount,
          bank_holder: regBankHolder || regFullname,
          address: regAddress,
          city: regCity
        });
      }

      // 4. Create initial order record for new member
      const newOrdId = Date.now();
      const newResi = `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const regOrder: Order = {
        id: newOrdId,
        invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`,
        user_id: 0,
        username: createdUsername,
        fullname: regFullname,
        phone: regPhone,
        address: `${regAddress}${regCity ? ', ' + regCity : ''}`,
        product_name: "Paket Perdana Member - Hedtro Jeans Raw Denim Premium",
        amount: 550000,
        payment_method: "Transfer Bank / QRIS",
        status: "DIPROSES",
        courier: "JNE REGULER",
        tracking_number: newResi,
        notes: "Pesanan pendaftaran member baru. Celana Jeans Perdana sedang diproses di gudang.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        steps: [
          { title: "Registrasi Akun & Invoice Dibuat", time: new Date().toLocaleString("id-ID"), done: true, description: "Pendaftaran member berhasil" },
          { title: "Gudang Memproses & Quality Control", time: new Date().toLocaleString("id-ID"), done: true, description: "Menyiapkan celana jeans perdana" },
          { title: "Diserahkan ke Kurir Ekspedisi (JNE)", time: "Sedang Diproses", done: false, description: `Nomor Resi: ${newResi}` },
          { title: "Dalam Pengiriman", time: "-", done: false, description: "-" },
          { title: "Pesanan Diterima Pemesan", time: "-", done: false, description: "-" }
        ]
      };
      await saveFirestoreOrder(regOrder);
      setOrders(prev => [regOrder, ...prev]);

      setRegSuccessMessage(`Pendaftaran Berhasil! Order ID Invoice: ${regOrder.invoice_no} (Resi: ${newResi}) telah dibuat & terhubung ke sistem lacak pesanan.`);
      setLoginUsername(regEmail);
      setLoginPassword(regPassword);
      setRegUsername('');
      setRegFullname('');
      setRegKtp('');
      setRegEmail('');
      setRegPhone('');
      setRegWhatsapp('');
      setRegBankAccount('');
      setRegBankHolder('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegSponsor('');
      setRegUpline('');
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error during registration:", err);
      alert(err.message || "Pendaftaran gagal");
    }
  };

  const handleQuickLogin = async (role: 'user' | 'admin') => {
    const username = role === 'user' ? 'budi' : 'admin';
    const password = role === 'user' ? 'user123' : 'admin123';
    setLoginUsername(username);
    setLoginPassword(password);
    setLoginError('');
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setShowLoginModal(false);
          setLoginUsername('');
          setLoginPassword('');
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

    const fsUsers = await fetchFirestoreUsers();
    const matched = fsUsers.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      setShowLoginModal(false);
      setLoginUsername('');
      setActiveView('dashboard');
    } else {
      const fallbackAdmin = getFallbackUser(username);
      if (fallbackAdmin) {
        setCurrentUser(fallbackAdmin);
        setShowLoginModal(false);
        setLoginUsername('');
        setActiveView('dashboard');
      } else {
        alert(`Akun @${username} tidak ditemukan atau telah dihapus oleh Admin. Silakan mendaftar akun baru.`);
      }
    }
  };

  const handleBuyProduct = async (productId: number, paymentMethod: 'saldo' | 'transfer' = 'saldo', customAddress?: string, selectedSize?: string, selectedColor?: string) => {
    if (!currentUser) return;
    const prod = products.find(p => p.id === productId);
    const priceToPay = currentUser.is_active ? (prod?.member_price || prod?.price || 120000) : (prod?.price || 150000);

    if (paymentMethod === 'saldo' && currentUser.balance < priceToPay) {
      alert(`Saldo Anda (Rp ${currentUser.balance.toLocaleString("id-ID")}) tidak mencukupi untuk membeli ${prod?.name || 'produk'} seharga Rp ${priceToPay.toLocaleString("id-ID")}. Silakan Lakukan Deposit terlebih dahulu atau pilih metode Transfer Bank!`);
      return;
    }

    if (prod && prod.stock < 1) {
      alert(`Stok ${prod.name} sedang habis!`);
      return;
    }

    let apiSuccess = false;
    let returnedOrder: Order | null = null;
    try {
      const res = await fetch("/api/user/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          productId, 
          paymentMethod,
          address: customAddress,
          selectedSize,
          selectedColor
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        apiSuccess = true;
        if (data.order) returnedOrder = data.order;
      } else if (data.message) {
        alert(data.message);
        return;
      }
    } catch (err: any) {
      console.warn("Purchase API unreachable, processing purchase direct in Firestore...", err);
    }

    const payMethodText = paymentMethod === 'saldo' ? "Potong Saldo Member Account" : "Transfer Bank / QRIS";

    if (!apiSuccess) {
      const newOrdId = Date.now();
      const newResi = `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const fullProdName = `${prod?.name || 'Hedtro Jeans Premium'}${selectedSize ? ` [Size: ${selectedSize}]` : ''}${selectedColor ? ` [Warna: ${selectedColor}]` : ''}`;
      const fallbackOrder: Order = {
        id: newOrdId,
        invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`,
        user_id: currentUser.id,
        username: currentUser.username,
        fullname: currentUser.fullname,
        phone: currentUser.phone || "-",
        address: customAddress || `${currentUser.address || 'Alamat Member'}${currentUser.city ? ', ' + currentUser.city : ''}`,
        product_name: fullProdName,
        selected_size: selectedSize || undefined,
        selected_color: selectedColor || undefined,
        amount: priceToPay,
        payment_method: payMethodText,
        status: "DIPROSES",
        courier: "JNE REGULER",
        tracking_number: newResi,
        notes: `Repeat Order (RO) ${fullProdName} via ${payMethodText}. Terhubung ke admin area.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        steps: [
          { title: `Pembelian RO Berhasil (${payMethodText})`, time: new Date().toLocaleString("id-ID"), done: true, description: "Invoice diterbitkan" },
          { title: "Verifikasi Gudang & Quality Control", time: new Date().toLocaleString("id-ID"), done: true, description: "Menyiapkan produk jeans" },
          { title: "Diserahkan ke Kurir Ekspedisi (JNE)", time: "Sedang Diproses", done: false, description: `Nomor Resi: ${newResi}` },
          { title: "Dalam Pengiriman", time: "-", done: false, description: "-" },
          { title: "Pesanan Diterima Pemesan", time: "-", done: false, description: "-" }
        ]
      };

      await saveFirestoreOrder(fallbackOrder);
      setOrders(prev => [fallbackOrder, ...prev]);

      if (paymentMethod === 'saldo') {
        const updatedBal = Math.max(0, currentUser.balance - priceToPay);
        await updateFirestoreUserProfile(currentUser.id, { balance: updatedBal } as any);
        
        const txBuy: Transaction = {
          id: Date.now(),
          user_id: currentUser.id,
          username: currentUser.username,
          type: "purchase",
          amount: -priceToPay,
          description: `Pembelian RO: ${prod?.name || 'HEDTRO JEANS'} (-Rp ${priceToPay.toLocaleString("id-ID")})`,
          created_at: new Date().toISOString()
        };
        await createFirestoreTransaction(txBuy);
        setCurrentUser(prev => prev ? ({ ...prev, balance: updatedBal }) : null);
      }

      if (prod) {
        await updateFirestoreProduct(prod.id, Math.max(0, prod.stock - 1), prod.price, prod.member_price);
      }
    } else {
      if (returnedOrder) {
        await saveFirestoreOrder(returnedOrder);
        setOrders(prev => [returnedOrder!, ...prev.filter(o => o.id !== returnedOrder!.id)]);
      }
    }

    await fetchProducts();
    await fetchDashboardData();
  };

  const handleWithdraw = async (amount: number, bank: string, accountNum: string, holder: string) => {
    if (!currentUser) return;
    if (currentUser.balance < amount) {
      alert(`Saldo Anda (Rp ${currentUser.balance.toLocaleString("id-ID")}) tidak mencukupi untuk penarikan sebesar Rp ${amount.toLocaleString("id-ID")}!`);
      return;
    }

    const newWD: WDRequest = {
      id: Date.now(),
      user_id: currentUser.id,
      username: currentUser.username,
      amount,
      bank_name: bank,
      account_number: accountNum,
      account_holder: holder,
      status: "pending",
      created_at: new Date().toISOString()
    };

    const txWD: Transaction = {
      id: Date.now() + 1,
      user_id: currentUser.id,
      username: currentUser.username,
      type: "withdrawal",
      amount: -amount,
      description: `Penarikan Dana (WD) ke Bank ${bank} - No.Rek: ${accountNum} a.n ${holder}`,
      created_at: new Date().toISOString()
    };

    let apiSuccess = false;
    try {
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
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        apiSuccess = true;
      }
    } catch (err) {
      console.warn("Withdraw API call unreachable, writing directly to Firestore...", err);
    }

    if (!apiSuccess) {
      const newBal = Math.max(0, currentUser.balance - amount);
      await updateFirestoreUserProfile(currentUser.id, { balance: newBal } as any);
      await createFirestoreWithdrawal(newWD);
      await createFirestoreTransaction(txWD);
      setCurrentUser(prev => prev ? ({ ...prev, balance: newBal }) : null);
    } else {
      await createFirestoreTransaction(txWD);
    }

    await fetchDashboardData();
    alert(`Pengajuan penarikan dana sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dikirim! Menunggu konfirmasi admin.`);
  };

  const handleDeposit = async (amount: number, method: 'qris' | 'bca' | 'mandiri' | 'transfer_bank' | string, customUniqueCode?: number) => {
    if (!currentUser) return;
    const uniqueCode = customUniqueCode || Math.floor(100 + Math.random() * 900);
    const totalTransfer = amount + uniqueCode;

    const newDep: DepositRequest = {
      id: Date.now(),
      user_id: currentUser.id,
      username: currentUser.username,
      amount,
      unique_code: uniqueCode,
      method,
      status: "pending",
      payment_code: `DEP-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString()
    };

    const txDep: Transaction = {
      id: Date.now() + 1,
      user_id: currentUser.id,
      username: currentUser.username,
      type: "deposit",
      amount: amount,
      description: `Pengajuan Deposit (Transfer Rp ${totalTransfer.toLocaleString('id-ID')} dengan Kode Unik #${uniqueCode}) via ${method.toUpperCase()}`,
      created_at: new Date().toISOString()
    };

    let apiSuccess = false;
    try {
      const res = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, amount, method, uniqueCode })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        apiSuccess = true;
      }
    } catch (err) {
      console.warn("Deposit API call unreachable, writing directly to Firestore...", err);
    }

    if (!apiSuccess) {
      await createFirestoreDeposit(newDep);
      await createFirestoreTransaction(txDep);
    } else {
      await createFirestoreTransaction(txDep);
    }

    await fetchDashboardData();
    alert(`Pengajuan deposit Rp ${amount.toLocaleString("id-ID")} berhasil dibuat! Total transfer yang wajib dikirim: Rp ${totalTransfer.toLocaleString("id-ID")} (Termasuk 3 Digit Kode Unik: #${uniqueCode}).`);
  };

  const handleSimulatePayment = async (depositId: number) => {
    try {
      const res = await fetch("/api/payment/simulate-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn("Simulate payment API unreachable, updating in Firestore...", err);
    }

    await updateFirestoreDepositStatus(depositId, 'success');
    await fetchDashboardData();
  };

  const handleAccountActivation = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/user/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn("Activation API unreachable, activating in Firestore...", err);
    }

    await updateFirestoreUserProfile(currentUser.id, { is_active: true } as any);
    await fetchDashboardData();
  };

  // ADMIN OPERATIONS
  const handleUpdateProductStock = async (productId: number, stock: number, price: number, memberPrice: number) => {
    try {
      const res = await fetch("/api/admin/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, stock, price, memberPrice })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchProducts();
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn("Update stock API unreachable, updating directly in Firestore...", err);
    }

    await updateFirestoreProduct(productId, stock, price, memberPrice);
    await fetchProducts();
    await fetchDashboardData();
  };

  const handleProcessWithdrawal = async (wdId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch("/api/admin/withdraw/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wdId, action })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn("WD process API unreachable, updating directly in Firestore", err);
    }

    await updateFirestoreWithdrawalStatus(wdId, action === 'approve' ? 'approved' : 'rejected');
    await fetchDashboardData();
  };

  const handleProcessDeposit = async (depositId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch("/api/admin/deposit/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId, action })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn("Process deposit API unreachable, updating directly in Firestore", err);
    }

    await updateFirestoreDepositStatus(depositId, action === 'approve' ? 'success' : 'failed');
    await fetchDashboardData();
  };

  const handleAddProduct = async (prodData: Omit<Product, "id">): Promise<boolean> => {
    let createdProd: Product | null = null;
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodData)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.product) createdProd = data.product;
      }
    } catch (err) {
      console.warn("Add product API unreachable, saving directly to Firestore...", err);
    }

    try {
      if (!createdProd) {
        createdProd = await addFirestoreProduct(prodData);
      }
      if (createdProd) {
        const finalProd = createdProd;
        setProducts(prev => {
          const filtered = prev.filter(p => Number(p.id) !== Number(finalProd.id));
          return [...filtered, finalProd].sort((a, b) => Number(a.id) - Number(b.id));
        });
      }
      await fetchProducts();
      await fetchDashboardData();
      return true;
    } catch (fsErr) {
      console.error("Error adding product to Firestore:", fsErr);
      return false;
    }
  };

  const handleUpdateProductFull = async (prod: Product): Promise<boolean> => {
    try {
      await fetch("/api/admin/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prod)
      }).catch(err => console.warn("Update product API warning:", err));

      await updateFirestoreProductFull(prod);

      setProducts(prev => prev.map(p => Number(p.id) === Number(prod.id) ? prod : p));
      await fetchProducts();
      await fetchDashboardData();
      return true;
    } catch (fsErr) {
      console.error("Error updating product in Firestore:", fsErr);
      return false;
    }
  };

  const handleDeleteProduct = async (productId: number): Promise<boolean> => {
    try {
      await fetch("/api/admin/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId })
      }).catch(err => console.warn("Delete product API warning:", err));

      await deleteFirestoreProduct(productId);
      setProducts(prev => prev.filter(p => Number(p.id) !== Number(productId)));
      await fetchProducts();
      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error deleting product:", err);
      return false;
    }
  };

  const handleUpdateProfile = async (data: { fullname: string; email: string; phone: string; whatsapp?: string; bank_name?: string; bank_account?: string; bank_holder?: string; address?: string; city?: string; password?: string; profile_photo?: string }): Promise<boolean> => {
    if (!currentUser) return false;

    // 1. Update Firestore directly
    try {
      await updateFirestoreUserProfile(currentUser.id, data);
    } catch (fsErr) {
      console.warn("Direct Firestore profile update warning:", fsErr);
    }

    // 2. Call server endpoint
    try {
      const res = await fetch(`/api/user/${currentUser.id}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        const resData = await res.json();
        if (resData.user) {
          setCurrentUser(resData.user);
        }
      }
    } catch (err) {
      console.warn("Profile update API unreachable:", err);
    }

    // 3. Immediately reflect changes in current local state
    setCurrentUser(prev => prev ? ({
      ...prev,
      fullname: data.fullname || prev.fullname,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      whatsapp: data.whatsapp !== undefined ? data.whatsapp : prev.whatsapp,
      bank_name: data.bank_name !== undefined ? data.bank_name : prev.bank_name,
      bank_account: data.bank_account !== undefined ? data.bank_account : prev.bank_account,
      bank_holder: data.bank_holder !== undefined ? data.bank_holder : prev.bank_holder,
      address: data.address !== undefined ? data.address : prev.address,
      city: data.city !== undefined ? data.city : prev.city,
      profile_photo: data.profile_photo !== undefined ? data.profile_photo : prev.profile_photo,
      ...(data.password ? { password: data.password } : {})
    }) : null);

    fetchDashboardData();
    return true;
  };

  const handleResetPassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/user/${currentUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchDashboardData();
        return true;
      }
    } catch (err) {
      console.warn("Reset password API unreachable, updating directly in Firestore...", err);
    }

    await updateFirestoreUserProfile(currentUser.id, { password: newPass });
    setCurrentUser(prev => prev ? ({ ...prev, password: newPass }) : null);
    await fetchDashboardData();
    return true;
  };

  const handleToggleAutoPayout = async (autoPayout: boolean) => {
    try {
      const res = await fetch("/api/admin/settings/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPayout })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn("Auto payout toggle API unreachable", err);
    }
  };

  const handleAddUserAdmin = async (userData: Partial<MLMUser>): Promise<boolean> => {
    try {
      await registerUserToFirestoreDirect({
        username: userData.username || "",
        fullname: userData.fullname || "",
        email: userData.email || "",
        phone: userData.phone || "",
        password: userData.password || "password123",
        sponsor_username: (userData as any).sponsor_username || "",
        upline_username: (userData as any).upline_username || "",
        position: (userData.position === 'R' || userData.position === 'L') ? userData.position : 'L',
        ktp: userData.ktp || "",
        whatsapp: userData.whatsapp || "",
        bank_name: userData.bank_name || "",
        bank_account: userData.bank_account || "",
        bank_holder: userData.bank_holder || "",
        address: userData.address || "",
        city: userData.city || ""
      });
      await fetchDashboardData();
      return true;
    } catch (err: any) {
      console.error("Error adding user in admin:", err);
      alert(err.message || "Gagal menambah user baru");
      return false;
    }
  };

  const handleUpdateUserAdmin = async (userId: number, updateData: Partial<MLMUser>): Promise<boolean> => {
    try {
      if (supabase) {
        await supabase.from('users').update(updateData).eq('id', userId);
      }
      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error updating user in admin:", err);
      return false;
    }
  };

  const handleDeleteUserAdmin = async (userId: number | string): Promise<boolean> => {
    const targetNumId = Number(userId);
    try {
      await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId })
      }).catch(e => console.warn("Delete user API warning:", e));

      if (supabase) {
        try {
          await supabase.from('users').delete().eq('id', userId);
        } catch (err) {
          console.warn("Supabase delete user warning:", err);
        }

        try {
          const currentUsers = await fetchFirestoreUsers();
          for (const u of currentUsers) {
            if (Number(u.upline_id) === targetNumId || Number(u.sponsor_id) === targetNumId) {
              const updated = {
                upline_id: Number(u.upline_id) === targetNumId ? 1 : u.upline_id,
                sponsor_id: Number(u.sponsor_id) === targetNumId ? 1 : u.sponsor_id
              };
              await supabase.from('users').update(updated).eq('id', u.id);
            }
          }
        } catch (e) {
          console.warn("Error cleaning orphan downlines in Supabase:", e);
        }
      }

      setAdminDashboardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users
            .filter(u => Number(u.id) !== targetNumId && String(u.id) !== String(userId))
            .map(u => ({
              ...u,
              upline_id: Number(u.upline_id) === targetNumId ? 1 : u.upline_id,
              sponsor_id: Number(u.sponsor_id) === targetNumId ? 1 : u.sponsor_id
            }))
        };
      });

      await fetchDashboardData();
      return true;
    } catch (e) {
      console.error("Error deleting user:", e);
      return false;
    }
  };

  const handleDeleteDeposit = async (depositId: number | string): Promise<boolean> => {
    try {
      await fetch("/api/admin/deposits/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: depositId })
      });
    } catch (e) {
      console.warn("Delete deposit API warning:", e);
    }
    try {
      if (supabase) {
        await supabase.from('deposit_requests').delete().eq('id', depositId);
      }
      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error deleting deposit:", err);
      return false;
    }
  };

  const handleDeleteWithdrawal = async (wdId: number | string): Promise<boolean> => {
    try {
      await fetch("/api/admin/withdrawals/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wdId })
      });
    } catch (e) {
      console.warn("Delete withdrawal API warning:", e);
    }
    try {
      if (supabase) {
        await supabase.from('wd_requests').delete().eq('id', wdId);
      }
      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error deleting withdrawal:", err);
      return false;
    }
  };

  const handleResetCategory = async (category: 'members' | 'web_settings' | 'mlm_network' | 'sales'): Promise<boolean> => {
    try {
      await fetch("/api/admin/reset-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category })
      }).catch(() => {});

      if (category === 'members') {
        if (supabase) {
          await supabase.from('users').delete().neq('role', 'admin').neq('id', 1);
        }
        await fetchDashboardData();
        return true;
      }

      if (category === 'web_settings') {
        const defaultSettings = {
          webName: "Hedtro Jeans Official",
          logoText: "HEDTRO.JEANS",
          memberIdPrefix: "HDT-",
          slogan: "OFFICIAL STORE & AFILIASI RESELLER",
          siteDescription: "Pusat Toko Official Celana Jeans Denim Premium & Sistem Bisnis Afiliasi Reseller Terpercaya.",
          enableMlmBonus: true,
          enableLevelBonus: true,
          enableRewardBonus: true,
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
          companyBankName: 'BCA',
          companyBankAccount: '1234-5678-90',
          companyBankHolder: 'PT HEDTRO JEANS INDONESIA',
          companyBank2Name: 'MANDIRI',
          companyBank2Account: '0987-6543-21',
          companyBank2Holder: 'PT HEDTRO JEANS INDONESIA',
          companyBank3Name: 'BRI',
          companyBank3Account: '5544-3322-11',
          companyBank3Holder: 'PT HEDTRO JEANS INDONESIA',
          companyBankInstruction: 'Harap transfer sesuai nominal tepat dan cantumkan Username pada berita transfer.'
        };
        if (supabase) {
          await supabase.from('system_settings').upsert({ id: 1, ...defaultSettings });
        }
        setSystemSettings(defaultSettings);
        await fetchDashboardData();
        return true;
      }

      if (category === 'mlm_network') {
        const currentUsers = await fetchFirestoreUsers();
        const updatedUsers = currentUsers.map(u => {
          if (u.role === 'admin' || Number(u.id) === 1) {
            return {
              id: u.id,
              left_count: 0,
              right_count: 0,
              left_sales: 0,
              right_sales: 0,
              sponsor_bonus: 0,
              pairing_bonus: 0,
              level_bonus: 0,
              ro_bonus: 0
            };
          }
          return {
            id: u.id,
            upline_id: 1,
            sponsor_id: 1,
            position: 'L',
            left_count: 0,
            right_count: 0,
            left_sales: 0,
            right_sales: 0,
            balance: 0,
            sponsor_bonus: 0,
            pairing_bonus: 0,
            level_bonus: 0,
            ro_bonus: 0
          };
        });

        if (supabase) {
          for (const u of updatedUsers) {
            await supabase.from('users').update(u).eq('id', u.id);
          }
        }
        await fetchDashboardData();
        return true;
      }

      if (category === 'sales') {
        if (supabase) {
          await supabase.from('orders').delete().neq('id', 0);
          await supabase.from('transactions').delete().neq('id', 0);
          await supabase.from('deposit_requests').delete().neq('id', 0);
          await supabase.from('wd_requests').delete().neq('id', 0);
        }

        setOrders([]);
        await fetchDashboardData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(`Failed to reset ${category}:`, e);
      return false;
    }
  };

  const handleRestoreCategory = async (category: 'members' | 'web_settings' | 'mlm_network' | 'sales', data: any): Promise<boolean> => {
    try {
      await fetch("/api/admin/restore-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, data })
      }).catch(() => {});

      if (category === 'members' && Array.isArray(data)) {
        const restoredUsers: MLMUser[] = data;
        if (supabase) {
          for (const u of restoredUsers) {
            await supabase.from('users').upsert(u);
          }
        }
        await fetchDashboardData();
        return true;
      }

      if (category === 'web_settings' && data && typeof data === 'object') {
        if (supabase) {
          await supabase.from('system_settings').upsert({ id: 1, ...data });
        }
        setSystemSettings((prev: any) => ({ ...prev, ...data }));
        await fetchDashboardData();
        return true;
      }

      if (category === 'mlm_network' && Array.isArray(data)) {
        if (supabase) {
          for (const u of data) {
            await supabase.from('users').upsert(u);
          }
        }
        await fetchDashboardData();
        return true;
      }

      if (category === 'sales' && data && typeof data === 'object') {
        const { orders: restOrders, transactions: restTxs, deposits: restDeps, withdrawals: restWds } = data;

        if (supabase) {
          if (Array.isArray(restOrders)) for (const o of restOrders) await supabase.from('orders').upsert(o);
          if (Array.isArray(restTxs)) for (const t of restTxs) await supabase.from('transactions').upsert(t);
          if (Array.isArray(restDeps)) for (const d of restDeps) await supabase.from('deposit_requests').upsert(d);
          if (Array.isArray(restWds)) for (const w of restWds) await supabase.from('wd_requests').upsert(w);
        }

        if (Array.isArray(restOrders)) {
          setOrders(restOrders);
        }
        await fetchDashboardData();
        return true;
      }

      return false;
    } catch (e) {
      console.error(`Failed to restore ${category}:`, e);
      return false;
    }
  };

  const handleConfirmDepositProof = async (depositId: number, proofImage: string, proofNotes?: string): Promise<boolean> => {
    try {
      await fetch("/api/user/deposit/confirm-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId, deposit_id: depositId, proofImage, proof_image: proofImage, proofNotes, proof_notes: proofNotes })
      }).catch(err => console.warn("API deposit proof warning:", err));

      if (supabase) {
        try {
          await supabase.from('deposit_requests').update({
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          }).eq('id', depositId);
        } catch (fErr) {
          console.warn("Supabase deposit proof update warn:", fErr);
        }
      }

      setUserDashboardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          deposits: prev.deposits.map(d => Number(d.id) === Number(depositId) ? {
            ...d,
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          } : d)
        };
      });

      setAdminDashboardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          deposits: prev.deposits.map(d => Number(d.id) === Number(depositId) ? {
            ...d,
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          } : d)
        };
      });

      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error submitting deposit proof:", err);
      return false;
    }
  };

  const handleConfirmOrderProof = async (orderId: number, proofImage: string, proofNotes?: string): Promise<boolean> => {
    try {
      await fetch("/api/user/orders/confirm-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, order_id: orderId, proofImage, proof_image: proofImage, proofNotes, proof_notes: proofNotes })
      }).catch(err => console.warn("API order proof warning:", err));

      if (supabase) {
        try {
          await supabase.from('orders').update({
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          }).eq('id', orderId);
        } catch (fErr) {
          console.warn("Supabase order proof update warn:", fErr);
        }
      }

      setUserDashboardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          orders: prev.orders ? prev.orders.map(o => Number(o.id) === Number(orderId) ? {
            ...o,
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          } : o) : []
        };
      });

      setAdminDashboardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          orders: prev.orders ? prev.orders.map(o => Number(o.id) === Number(orderId) ? {
            ...o,
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          } : o) : []
        };
      });

      setOrders(prev => prev.map(o => Number(o.id) === Number(orderId) ? {
        ...o,
        proof_image: proofImage,
        proof_notes: proofNotes || '',
        proof_submitted_at: new Date().toISOString()
      } : o));

      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error submitting order proof:", err);
      return false;
    }
  };

  const handleLogout = () => {
    currentUserRef.current = null;
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setUserDashboardData(null);
    setAdminDashboardData(null);
    setActiveView('landing');
    fetchSettings();
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans" id="app-viewport">
      
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
            orders={orders}
            currentUser={currentUser}
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
                products={adminDashboardData.products || products}
                orders={adminDashboardData.orders || orders}
                onUpdateOrder={handleUpdateOrder}
                onCreateOrder={handleCreateOrder}
                onDeleteOrder={handleDeleteOrder}
                onRefresh={fetchDashboardData}
                onLogout={handleLogout}
                onUpdateProductStock={handleUpdateProductStock}
                onUpdateProduct={handleUpdateProductFull}
                onDeleteProduct={handleDeleteProduct}
                onProcessWithdrawal={handleProcessWithdrawal}
                onProcessDeposit={handleProcessDeposit}
                onDeleteDeposit={handleDeleteDeposit}
                onDeleteWithdrawal={handleDeleteWithdrawal}
                onAddProduct={handleAddProduct}
                onAddUser={handleAddUserAdmin}
                onUpdateUserAdmin={handleUpdateUserAdmin}
                onDeleteUserAdmin={handleDeleteUserAdmin}
                onUpdateProfile={handleUpdateProfile}
                onResetPassword={(curP, newP) => handleResetPassword(curP, newP)}
                onToggleAutoPayout={handleToggleAutoPayout}
                settings={systemSettings}
                onUpdateSettings={handleUpdateSettings}
                onRefreshProducts={fetchProducts}
                onResetCategory={handleResetCategory}
                onRestoreCategory={handleRestoreCategory}
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
                orders={userDashboardData.orders || orders.filter(o => (o.user_id && Number(o.user_id) === Number(currentUser.id)) || (o.username && currentUser.username && o.username.toLowerCase() === currentUser.username.toLowerCase()))}
                onLogout={handleLogout}
                onRefresh={fetchDashboardData}
                onBuyProduct={handleBuyProduct}
                onDeposit={handleDeposit}
                onWithdraw={handleWithdraw}
                onSimulatePayment={handleSimulatePayment}
                onActivate={handleAccountActivation}
                onUpdateProfile={handleUpdateProfile}
                onResetPassword={(curP, newP) => handleResetPassword(curP, newP)}
                onConfirmDepositProof={handleConfirmDepositProof}
                onConfirmOrderProof={handleConfirmOrderProof}
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
          LOGIN MODAL POPUP (With Supabase Auth & Demo Helpers)
          ========================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="login-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <button
              id="btn-close-login"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Supabase Auth Terhubung
                </span>
                {sbSession && (
                  <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Sesi Aktif
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900">Masuk Akun Member / Admin</h3>
              <p className="text-xs text-slate-500">Gunakan otentikasi Supabase Auth, OAuth, Magic Link, atau akun member.</p>
            </div>

            {/* Supabase Social OAuth Login Buttons */}
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Otentikasi Supabase Instant:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-supabase-google-oauth"
                  onClick={() => handleSupabaseOAuthLogin('google')}
                  disabled={isSubmittingLogin}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google OAuth</span>
                </button>
                <button
                  type="button"
                  id="btn-supabase-github-oauth"
                  onClick={() => handleSupabaseOAuthLogin('github')}
                  disabled={isSubmittingLogin}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <span>GitHub OAuth</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Accounts Fill */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Uji Coba Demo Akun Sekali-Klik:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-quick-budi"
                  onClick={() => handleQuickLogin('user')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold transition text-left flex flex-col justify-between shadow-sm hover:border-blue-500"
                >
                  <span className="text-blue-600 font-extrabold">👤 Demo Member</span>
                  <strong className="block mt-0.5 font-extrabold text-slate-900">budi</strong>
                </button>
                <button
                  type="button"
                  id="btn-quick-admin"
                  onClick={() => handleQuickLogin('admin')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold transition text-left flex flex-col justify-between shadow-sm hover:border-blue-500"
                >
                  <span className="text-red-600 font-extrabold">⚙️ Administrator</span>
                  <strong className="block mt-0.5 font-extrabold text-slate-900">admin</strong>
                </button>
              </div>
            </div>

            {loginError && <p className="bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-200 text-xs font-bold">{loginError}</p>}
            {magicLinkNotice && <p className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold">{magicLinkNotice}</p>}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Username / Email Supabase</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username atau email Anda..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={handleSupabaseMagicLink}
                    className="text-[10px] font-extrabold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Kirim Supabase Magic Link
                  </button>
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
                disabled={isSubmittingLogin}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-1.5"
              >
                {isSubmittingLogin ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                    <span>Memproses Masuk...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-blue-500" />
                    <span>Masuk Ke Portal</span>
                  </>
                )}
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
                    Petunjuk: Anda dapat menggunakan email demo seperti <code className="text-blue-600 font-bold">budi@gmail.com</code> atau <code className="text-blue-600 font-bold">admin@hedtrojeans.com</code>.
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
              <h3 className="text-xl font-black text-slate-900">Daftar Member & Afiliasi Reseller</h3>
              <p className="text-xs text-slate-500">Mulai langkah bisnis Anda bersama HEDTRO JEANS dan dapatkan komisi penjualan.</p>
            </div>

            {regSuccessMessage ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h4 className="font-extrabold text-green-950 text-base">Pendaftaran Anda Berhasil!</h4>
                <p className="text-xs text-green-800 leading-relaxed">
                  Selamat, akun Anda telah terdaftar sebagai Member Afiliasi HEDTRO JEANS. Status akun Anda saat ini adalah <strong className="text-emerald-700 font-extrabold">TERVERIFIKASI / KANONIKAL</strong>. <br />
                  Silakan masuk menggunakan username/email Anda untuk mengakses area portal member dan mulai berbelanja atau membagikan link afiliasi Anda!
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    id="btn-reg-success-login"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setRegSuccessMessage('');
                      setShowLoginModal(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
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
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Section 1: Data Akun & Login */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">1. Data Akun & Keamanan</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Username Baru *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: agus2026"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Email Aktif *</label>
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Kata Sandi *</label>
                      <input
                        type="password"
                        required
                        placeholder="Buat kata sandi..."
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Konfirmasi Kata Sandi *</label>
                      <input
                        type="password"
                        required
                        placeholder="Ulangi kata sandi..."
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Data Pribadi & Kontak */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">2. Data Informasi Identitas & Kontak</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Nama Lengkap (Sesuai KTP) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan nama lengkap..."
                        value={regFullname}
                        onChange={(e) => setRegFullname(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Nomor KTP / NIK (16 Digit) *</label>
                      <input
                        type="text"
                        required
                        placeholder="3271xxxxxxxxxxxx"
                        value={regKtp}
                        onChange={(e) => setRegKtp(e.target.value)}
                        className="w-full border border-slate-200 bg-white font-mono rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">No. HP / Telepon *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 0812345678"
                        value={regPhone}
                        onChange={(e) => {
                          setRegPhone(e.target.value);
                          if (!regWhatsapp) setRegWhatsapp(e.target.value);
                        }}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">No. WhatsApp Aktif *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 0812345678"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Rekening Bank Pencairan Komisi */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">3. Rekening Bank Pencairan Komisi</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Nama Bank</label>
                      <select
                        value={regBankName}
                        onChange={(e) => setRegBankName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none bg-white"
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
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">No. Rekening</label>
                      <input
                        type="text"
                        placeholder="1234567890"
                        value={regBankAccount}
                        onChange={(e) => setRegBankAccount(e.target.value)}
                        className="w-full border border-slate-200 bg-white font-mono rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Atas Nama Bank</label>
                      <input
                        type="text"
                        placeholder="Atas nama..."
                        value={regBankHolder}
                        onChange={(e) => setRegBankHolder(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Alamat Pengiriman Produk */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">4. Alamat Pengiriman Produk Perdana</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Alamat Lengkap (Jalan, RT/RW, No. Rumah, Kel/Kec)</label>
                    <textarea
                      rows={2}
                      placeholder="Masukkan alamat pengiriman..."
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Kota / Kabupaten & Provinsi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Section 5: Structure Placement */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-blue-200/60 pb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">5. Penempatan Tim Afiliasi (Placement)</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Username Sponsor (Pengajak)</label>
                      <input
                        type="text"
                        placeholder="Admin (Bila dikosongkan)"
                        value={regSponsor}
                        onChange={(e) => setRegSponsor(e.target.value)}
                        className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Username Upline (Atasan Langsung)</label>
                      <input
                        type="text"
                        placeholder="Admin (Bila dikosongkan)"
                        value={regUpline}
                        onChange={(e) => setRegUpline(e.target.value)}
                        className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-blue-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Posisi Tim / Kaki Jaringan</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="reg-pos-left"
                        onClick={() => setRegPosition('L')}
                        className={`py-2 px-3 border rounded-xl text-center text-xs font-extrabold transition shadow-xs ${
                          regPosition === 'L' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        👈 TIM SISI KIRI (L)
                      </button>
                      <button
                        type="button"
                        id="reg-pos-right"
                        onClick={() => setRegPosition('R')}
                        className={`py-2 px-3 border rounded-xl text-center text-xs font-extrabold transition shadow-xs ${
                          regPosition === 'R' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        TIM SISI KANAN (R) 👉
                      </button>
                    </div>
                  </div>
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
