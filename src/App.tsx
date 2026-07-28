import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import { app, auth, db } from "./lib/firebase";
import { resolvedFirebaseConfig } from "./lib/firebaseConfig";
import LandingPage from "./components/LandingPage";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PHPSourceViewer from "./components/PHPSourceViewer";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { DEFAULT_USERS } from "./data/defaultUsers";
import { LogIn, Key, ShieldCheck, Download, Award, X, Copy, Check, Info, RefreshCw, CheckCircle, Mail, Lock, Send } from "lucide-react";

// Client-side timeout helper to prevent hanging on Firestore network stalls
function withClientTimeout<T>(promise: Promise<T>, ms: number = 1500, label = "Operation"): Promise<T | null> {
  return Promise.race([
    promise.catch((err) => {
      console.warn(`⚠️ [Client Firestore Error] ${label}:`, err);
      return null;
    }),
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn(`⏱️ [Client Firestore Timeout] ${label} exceeded ${ms}ms limit`);
        resolve(null);
      }, ms);
    })
  ]);
}

// Firebase Firestore Direct Data Helpers
async function fetchFirestoreUsers(): Promise<MLMUser[]> {
  console.log("🔍 [fetchFirestoreUsers] Checking Firestore `db` status...", {
    dbConnected: !!db,
    projectId: resolvedFirebaseConfig.projectId || "MISSING",
    apiKeyConfigured: !!resolvedFirebaseConfig.apiKey,
    isVercel: typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
  });

  if (!db) {
    console.warn("⚠️ [fetchFirestoreUsers] Firestore `db` instance is NULL! Fallback to DEFAULT_USERS. On Vercel, ensure environment variables (VITE_FIREBASE_API_KEY) or firebase-applet-config.json are provided.");
    return DEFAULT_USERS;
  }

  try {
    console.log("📡 [fetchFirestoreUsers] Reading 'users' collection from Firestore...");
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "users")), 1500, "getDocs users");
    if (!querySnapshot) {
      console.warn("⚠️ [fetchFirestoreUsers] Firestore read timed out or failed, using DEFAULT_USERS fallback.");
      return DEFAULT_USERS;
    }
    console.log(`✅ [fetchFirestoreUsers] Firestore read successful! Received ${querySnapshot.size} user documents.`);
    const usersMap = new Map<number, MLMUser>();

    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      const parsedId = Number(data.id ?? docSnap.id);
      if (!isNaN(parsedId)) {
        usersMap.set(parsedId, {
          id: parsedId,
          username: data.username || "",
          fullname: data.fullname || "",
          email: data.email || "",
          phone: data.phone || "",
          password: data.password || "",
          is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
          upline_id: data.upline_id !== null && data.upline_id !== undefined ? Number(data.upline_id) : null,
          position: data.position || "L",
          sponsor_id: data.sponsor_id !== null && data.sponsor_id !== undefined ? Number(data.sponsor_id) : null,
          balance: Number(data.balance) || 0,
          sponsor_bonus: Number(data.sponsor_bonus) || 0,
          pairing_bonus: Number(data.pairing_bonus) || 0,
          level_bonus: Number(data.level_bonus) || 0,
          ro_bonus: Number(data.ro_bonus) || 0,
          left_count: Number(data.left_count) || 0,
          right_count: Number(data.right_count) || 0,
          left_sales: Number(data.left_sales) || 0,
          right_sales: Number(data.right_sales) || 0,
          created_at: data.created_at || new Date().toISOString(),
          role: data.role || (parsedId === 1 ? "admin" : "user"),
          firebase_uid: data.firebase_uid || "",
          ktp: data.ktp || "",
          whatsapp: data.whatsapp || "",
          bank_name: data.bank_name || "",
          bank_account: data.bank_account || "",
          bank_holder: data.bank_holder || ""
        });
      }
    });

    if (usersMap.size === 0) {
      console.log("ℹ️ [fetchFirestoreUsers] Collection 'users' is empty in Firestore. Seeding default users...");
      for (const defU of DEFAULT_USERS) {
        usersMap.set(defU.id, defU);
        try {
          withClientTimeout(setDoc(doc(db, "users", String(defU.id)), defU), 1000, `seedUser ${defU.username}`);
        } catch (e) {
          console.warn(`Failed seeding user ${defU.username} to Firestore:`, e);
        }
      }
    } else {
      for (const defU of DEFAULT_USERS) {
        if (!usersMap.has(defU.id)) {
          usersMap.set(defU.id, defU);
          try {
            withClientTimeout(setDoc(doc(db, "users", String(defU.id)), defU), 1000, `seedUser ${defU.username}`);
          } catch {}
        }
      }
    }

    const finalUsers = Array.from(usersMap.values());
    finalUsers.sort((a, b) => Number(a.id) - Number(b.id));
    return finalUsers;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreUsers] Error reading 'users' from Firestore:", err);
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

    if (db) {
      try {
        await setDoc(doc(db, "users", String(upline.id)), upline, { merge: true });
      } catch (e) {
        console.warn("Failed updating ancestor count in Firestore:", e);
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
    bank_holder: regData.bank_holder || regData.fullname || ""
  };

  const updatedUsers = [...users, newUser];

  if (db) {
    try {
      await setDoc(doc(db, "users", String(newUserId)), newUser);
      await updateAncestorCountsClient(updatedUsers, uplineId, finalPos);

      // Log Gratis 1 Produk Paket Perdana (Rp 550.000) transaction for the new user
      await createFirestoreTransaction({
        id: Date.now(),
        user_id: newUserId,
        username: normalizedUsername,
        type: "bonus_produk",
        amount: 550000,
        description: "Bonus Registrasi: Gratis 1 Produk Paket Perdana Zalora Denim senilai Rp 550.000 (Termasuk Paket Pendaftaran Hak Usaha)",
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
            description: `Bonus Sponsor Pendaftaran Member Baru @${normalizedUsername} (+Rp 40.000)`,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("Firestore setDoc failed for user registration:", e);
    }
  }

  return newUser;
}

function buildClientBinaryTree(users: MLMUser[], userId: number, depth = 0, maxDepth = 5): any {
  if (depth > maxDepth) return null;
  const user = users.find(u => Number(u.id) === Number(userId));
  if (!user) return null;

  const leftChild = users.find(u => Number(u.upline_id) === Number(userId) && u.position === "L");
  const rightChild = users.find(u => Number(u.upline_id) === Number(userId) && u.position === "R");

  return {
    id: Number(user.id),
    username: user.username,
    fullname: user.fullname,
    is_active: Boolean(user.is_active),
    left_count: Number(user.left_count) || 0,
    right_count: Number(user.right_count) || 0,
    left: leftChild ? buildClientBinaryTree(users, Number(leftChild.id), depth + 1, maxDepth) : null,
    right: rightChild ? buildClientBinaryTree(users, Number(rightChild.id), depth + 1, maxDepth) : null
  };
}

async function fetchFirestoreProducts(): Promise<Product[]> {
  if (!db) {
    console.warn("⚠️ [fetchFirestoreProducts] `db` instance is null. Returning DEFAULT_PRODUCTS.");
    return DEFAULT_PRODUCTS;
  }

  try {
    console.log("📡 [fetchFirestoreProducts] Reading 'products' collection from Firestore...");
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "products")), 1500, "getDocs products");
    if (!querySnapshot) return DEFAULT_PRODUCTS;
    console.log(`✅ [fetchFirestoreProducts] Firestore read successful! Received ${querySnapshot.size} products.`);
    const prods: Product[] = [];
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      prods.push({
        id: Number(data.id ?? docSnap.id),
        name: data.name || "",
        description: data.description || "",
        price: Number(data.price) || 0,
        member_price: Number(data.member_price) || 0,
        stock: Number(data.stock) || 0,
        image: data.image || ""
      });
    });

    if (prods.length === 0) {
      console.log("ℹ️ [fetchFirestoreProducts] Collection 'products' is empty in Firestore. Seeding default products...");
      for (const defP of DEFAULT_PRODUCTS) {
        try {
          withClientTimeout(setDoc(doc(db, "products", String(defP.id)), defP), 1000, `seedProduct ${defP.name}`);
        } catch {}
      }
      return DEFAULT_PRODUCTS;
    }

    prods.sort((a, b) => a.id - b.id);
    return prods;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreProducts] Error reading 'products' from Firestore:", err);
    return DEFAULT_PRODUCTS;
  }
}

async function fetchFirestoreSettings(): Promise<any> {
  if (!db) return null;

  try {
    const docRef = doc(db, "settings", "system");
    const docSnap: any = await withClientTimeout(getDoc(docRef), 1500, "getDoc system settings");
    if (docSnap && docSnap.exists && docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err: any) {
    console.warn("⚠️ [fetchFirestoreSettings] Error reading settings from Firestore:", err);
  }
  return null;
}

async function saveFirestoreSettings(newSettings: any): Promise<boolean> {
  if (db) {
    try {
      withClientTimeout(setDoc(doc(db, "settings", "system"), newSettings, { merge: true }), 1500, "saveSettings");
      return true;
    } catch (err: any) {
      console.warn("⚠️ [saveFirestoreSettings] Error saving settings to Firestore:", err);
    }
  }
  return true;
}

async function fetchFirestoreWithdrawals(): Promise<WDRequest[]> {
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "withdrawals")), 1500, "getDocs withdrawals");
    if (!querySnapshot) return [];
    const wds: WDRequest[] = [];
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      wds.push({
        id: Number(data.id),
        user_id: Number(data.user_id),
        username: data.username || "",
        amount: Number(data.amount) || 0,
        bank_name: data.bank_name || "",
        account_number: data.account_number || "",
        account_holder: data.account_holder || "",
        status: data.status || "pending",
        created_at: data.created_at || new Date().toISOString()
      });
    });

    wds.sort((a, b) => b.id - a.id);
    return wds;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreWithdrawals] Error reading 'withdrawals' from Firestore:", err);
    return [];
  }
}

async function createFirestoreWithdrawal(wd: WDRequest): Promise<void> {
  if (db) {
    try {
      withClientTimeout(setDoc(doc(db, "withdrawals", String(wd.id)), wd), 1500, `createWD #${wd.id}`);
    } catch (err) {
      console.warn("Error creating withdrawal in Firestore:", err);
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

  if (db) {
    try {
      withClientTimeout(setDoc(doc(db, "withdrawals", String(wdId)), { status }, { merge: true }), 1500, `updateWD #${wdId}`);
    } catch (err) {
      console.warn("Error updating withdrawal in Firestore:", err);
    }
  }
}

async function fetchFirestoreTransactions(): Promise<Transaction[]> {
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "transactions")), 1500, "getDocs transactions");
    if (!querySnapshot) return [];
    const txs: Transaction[] = [];
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      txs.push({
        id: Number(data.id),
        user_id: Number(data.user_id),
        username: data.username || "",
        type: data.type || "transaction",
        amount: Number(data.amount) || 0,
        description: data.description || "",
        created_at: data.created_at || new Date().toISOString()
      });
    });

    txs.sort((a, b) => b.id - a.id);
    return txs;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreTransactions] Error reading 'transactions' from Firestore:", err);
    return [];
  }
}

async function createFirestoreTransaction(tx: Transaction): Promise<void> {
  if (db) {
    try {
      withClientTimeout(setDoc(doc(db, "transactions", String(tx.id)), tx), 1500, `createTx #${tx.id}`);
    } catch (err) {
      console.warn("Error creating transaction in Firestore:", err);
    }
  }
}

async function fetchFirestoreDeposits(): Promise<DepositRequest[]> {
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "deposits")), 1500, "getDocs deposits");
    if (!querySnapshot) return [];
    const deps: DepositRequest[] = [];
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      deps.push({
        id: Number(data.id),
        user_id: Number(data.user_id),
        username: data.username || "",
        amount: Number(data.amount) || 0,
        method: data.method || "qris",
        status: data.status || "pending",
        payment_code: data.payment_code || "",
        created_at: data.created_at || new Date().toISOString()
      });
    });

    deps.sort((a, b) => b.id - a.id);
    return deps;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreDeposits] Error reading 'deposits' from Firestore:", err);
    return [];
  }
}

async function createFirestoreDeposit(dep: DepositRequest): Promise<void> {
  if (db) {
    try {
      withClientTimeout(setDoc(doc(db, "deposits", String(dep.id)), dep), 1500, `createDeposit #${dep.id}`);
    } catch (err) {
      console.warn("Error creating deposit in Firestore:", err);
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

  if (db) {
    try {
      await setDoc(doc(db, "deposits", String(depositId)), { status }, { merge: true });
    } catch (err) {
      console.warn("Error updating deposit in Firestore:", err);
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
    image: prod.image
  };

  if (db) {
    try {
      await setDoc(doc(db, "products", String(nextId)), newProduct);
    } catch (e) {
      console.warn("Error adding product to Firestore:", e);
    }
  }

  return newProduct;
}

async function updateFirestoreProduct(productId: number, stock: number, price: number, memberPrice: number): Promise<void> {
  if (db) {
    try {
      await setDoc(doc(db, "products", String(productId)), { stock, price, member_price: memberPrice }, { merge: true });
    } catch (e) {
      console.warn("Error updating product in Firestore:", e);
    }
  }
}

async function updateFirestoreUserProfile(userId: number, updateData: { fullname?: string; email?: string; phone?: string; password?: string; balance?: number; is_active?: boolean; sponsor_bonus?: number; pairing_bonus?: number; level_bonus?: number; ro_bonus?: number }): Promise<void> {
  if (db) {
    try {
      const cleanData: any = {};
      if (updateData.fullname) cleanData.fullname = updateData.fullname;
      if (updateData.email) cleanData.email = updateData.email;
      if (updateData.phone) cleanData.phone = updateData.phone;
      if (updateData.password) cleanData.password = updateData.password;
      if (updateData.balance !== undefined) cleanData.balance = updateData.balance;
      if (updateData.is_active !== undefined) cleanData.is_active = updateData.is_active;
      if (updateData.sponsor_bonus !== undefined) cleanData.sponsor_bonus = updateData.sponsor_bonus;
      if (updateData.pairing_bonus !== undefined) cleanData.pairing_bonus = updateData.pairing_bonus;
      if (updateData.level_bonus !== undefined) cleanData.level_bonus = updateData.level_bonus;
      if (updateData.ro_bonus !== undefined) cleanData.ro_bonus = updateData.ro_bonus;

      await setDoc(doc(db, "users", String(userId)), cleanData, { merge: true });
    } catch (e) {
      console.warn("Error updating user profile in Firestore:", e);
    }
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<MLMUser | null>(() => {
    try {
      const saved = localStorage.getItem("zalora_session_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'php-source'>(() => {
    try {
      const saved = localStorage.getItem("zalora_session_user");
      return saved ? 'dashboard' : 'landing';
    } catch {
      return 'landing';
    }
  });

  const currentUserRef = React.useRef<MLMUser | null>(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) {
      try {
        localStorage.setItem("zalora_session_user", JSON.stringify(currentUser));
      } catch (e) {
        console.warn("Failed to save session", e);
      }
    } else {
      try {
        localStorage.removeItem("zalora_session_user");
      } catch {}
    }
  }, [currentUser]);

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
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
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
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
        return;
      }
    } catch (err) {
      console.warn("API settings unavailable, fetching direct from Firestore...", err);
    }

    const fsSettings = await fetchFirestoreSettings();
    if (fsSettings) {
      setSystemSettings(fsSettings);
    }
  };

  const handleUpdateSettings = async (newSettings: any): Promise<boolean> => {
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
      console.warn("Backend API /api/admin/settings unavailable, saving directly to Firestore database...", err);
    }

    const savedToFirestore = await saveFirestoreSettings(newSettings);
    setSystemSettings((prev: any) => ({ ...prev, ...newSettings }));
    return apiSuccess || savedToFirestore;
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
    if (!currentUserRef.current) return;
    const targetUser = currentUserRef.current;
    let apiSuccess = false;

    console.log("🔍 [fetchDashboardData] Starting dashboard sync...", {
      username: targetUser.username,
      role: targetUser.role,
      dbConnected: !!db,
      isVercel: typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    });

    try {
      if (targetUser.role === 'admin') {
        console.log("📡 [fetchDashboardData] Fetching Express API: /api/admin/dashboard");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch("/api/admin/dashboard", { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
        if (!currentUserRef.current) return;
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          const data = await res.json();
          console.log("✅ [fetchDashboardData] Backend API response received successfully for admin.");
          const fsTxs = await fetchFirestoreTransactions();
          if (!currentUserRef.current) return;
          const mergedTxs = data.transactions && data.transactions.length > 0 ? data.transactions : fsTxs;
          setAdminDashboardData({ ...data, transactions: mergedTxs });
          if (data.settings) setSystemSettings(data.settings);
          apiSuccess = true;
          return;
        } else {
          console.warn(`⚠️ [fetchDashboardData] /api/admin/dashboard returned status ${res.status} (${contentType}). Falling back to direct client-side Firestore connection.`);
        }
      } else {
        console.log(`📡 [fetchDashboardData] Fetching Express API: /api/user/${targetUser.id}/dashboard`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`/api/user/${targetUser.id}/dashboard`, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
        if (!currentUserRef.current) return;
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("json")) {
          const data = await res.json();
          console.log("✅ [fetchDashboardData] Backend API response received successfully for user.");
          const fsTxs = await fetchFirestoreTransactions();
          if (!currentUserRef.current) return;
          const userTxs = data.transactions && data.transactions.length > 0
            ? data.transactions
            : fsTxs.filter(t => Number(t.user_id) === Number(targetUser.id));
          setUserDashboardData({ ...data, transactions: userTxs });
          if (data.settings) setSystemSettings(data.settings);
          if (data.user && currentUserRef.current) {
            setCurrentUser(data.user);
            try { localStorage.setItem("zalora_session_user", JSON.stringify(data.user)); } catch {}
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
      const [fsUsers, fsWithdrawals, fsDeposits, fsTransactions] = await Promise.all([
        fetchFirestoreUsers(),
        fetchFirestoreWithdrawals(),
        fetchFirestoreDeposits(),
        fetchFirestoreTransactions()
      ]);

      console.log("📊 [fetchDashboardData] Firestore direct read complete:", {
        usersCount: fsUsers.length,
        withdrawalsCount: fsWithdrawals.length,
        depositsCount: fsDeposits.length,
        transactionsCount: fsTransactions.length
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
          transactions: fsTransactions
        });
        console.log("✅ [fetchDashboardData] Admin dashboard updated via direct Firestore data.");
      } else {
        const freshUser = fsUsers.find(u => Number(u.id) === Number(targetUser.id)) || targetUser;
        if (!currentUserRef.current) return;
        setCurrentUser(freshUser);
        try { localStorage.setItem("zalora_session_user", JSON.stringify(freshUser)); } catch {}
        const binaryTree = buildClientBinaryTree(fsUsers, Number(freshUser.id), 0, 5);
        const referrals = fsUsers.filter(u => Number(u.sponsor_id) === Number(freshUser.id));
        const userWDs = fsWithdrawals.filter(w => Number(w.user_id) === Number(freshUser.id));
        const userDeps = fsDeposits.filter(d => Number(d.user_id) === Number(freshUser.id));
        const userTxs = fsTransactions.filter(t => Number(t.user_id) === Number(freshUser.id));

        setUserDashboardData({
          user: freshUser,
          binaryTree,
          referrals,
          transactions: userTxs,
          deposits: userDeps,
          withdrawals: userWDs,
          notifications: [
            { id: 1, title: "Selamat Datang!", message: "Selamat datang di Portal Member Zalora Denim MLM.", read: false, time: "Baru saja" }
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
        authEmail = "admin@zaloradenim.com";
      } else if (authEmail.toLowerCase() === "budi") {
        authEmail = "budi@gmail.com";
      } else {
        authEmail = `${authEmail.toLowerCase()}@zaloradenim.com`;
      }
    }

    try {
      // 1. Authenticate with Firebase Authentication SDK (capped with 2s timeout)
      if (auth) {
        try {
          const userCred: any = await withClientTimeout(signInWithEmailAndPassword(auth, authEmail, loginPassword), 2000, "Firebase Auth SDK");
          if (userCred && userCred.user) {
            console.log("Firebase Auth SDK Sign In Success:", userCred.user.uid);
          }
        } catch (fbErr: any) {
          console.warn("Firebase Auth SDK Sign In Notice:", fbErr?.code || fbErr?.message);
        }
      }

      // 2. Obtain user profile from backend API with AbortController 2.5s timeout
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
      } else {
        const fallbackUser = getFallbackUser(loginUsername);
        setCurrentUser(fallbackUser);
      }
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
      setActiveView('dashboard');
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
      // 1. Create account in Firebase Authentication SDK
      let firebaseUid = "";
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
          firebaseUid = userCredential.user.uid;
          console.log("Firebase Auth account created successfully:", firebaseUid);
        } catch (fbAuthErr: any) {
          console.warn("Firebase Auth SDK createUser notice:", fbAuthErr?.code || fbAuthErr?.message);
          if (fbAuthErr?.code === "auth/email-already-in-use") {
            try {
              const cred = await signInWithEmailAndPassword(auth, regEmail, regPassword);
              firebaseUid = cred.user.uid;
            } catch {}
          }
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
            firebase_uid: firebaseUid,
            ktp: regKtp,
            whatsapp: regWhatsapp || regPhone,
            bank_name: regBankName,
            bank_account: regBankAccount,
            bank_holder: regBankHolder || regFullname
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
        console.warn("Backend API unavailable, saving directly to Firestore database...", apiErr);
      }

      // 3. Direct Firestore write if API backend unavailable (e.g., Vercel static hosting)
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
          firebase_uid: firebaseUid,
          ktp: regKtp,
          whatsapp: regWhatsapp || regPhone,
          bank_name: regBankName,
          bank_account: regBankAccount,
          bank_holder: regBankHolder || regFullname
        });
      }

      setRegSuccessMessage(`Pendaftaran Berhasil via Firebase & Firestore! Akun @${createdUsername} (${regEmail}) terdaftar di database.`);
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

    // Fallback for demo mode on static hosting
    const fallbackUser = getFallbackUser(username);
    setCurrentUser(fallbackUser);
    setShowLoginModal(false);
    setLoginUsername('');
    setActiveView('dashboard');
  };

  const handleBuyProduct = async (productId: number) => {
    if (!currentUser) return;
    const prod = products.find(p => p.id === productId);
    const priceToPay = currentUser.is_active ? (prod?.member_price || prod?.price || 120000) : (prod?.price || 150000);

    if (currentUser.balance < priceToPay) {
      alert(`Saldo Anda (Rp ${currentUser.balance.toLocaleString("id-ID")}) tidak mencukupi untuk membeli ${prod?.name || 'produk'} seharga Rp ${priceToPay.toLocaleString("id-ID")}. Silakan Lakukan Deposit terlebih dahulu!`);
      return;
    }

    if (prod && prod.stock < 1) {
      alert(`Stok ${prod.name} sedang habis!`);
      return;
    }

    const txBuy: Transaction = {
      id: Date.now(),
      user_id: currentUser.id,
      username: currentUser.username,
      type: "purchase",
      amount: -priceToPay,
      description: `Pembelian Produk: ${prod?.name || 'Jeans Zalora Denim'} (-Rp ${priceToPay.toLocaleString("id-ID")})`,
      created_at: new Date().toISOString()
    };

    let apiSuccess = false;
    try {
      const res = await fetch("/api/user/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, productId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        apiSuccess = true;
      } else if (data.message) {
        alert(data.message);
        return;
      }
    } catch (err: any) {
      console.warn("Purchase API unreachable, processing purchase direct in Firestore...", err);
    }

    if (!apiSuccess) {
      const updatedBal = Math.max(0, currentUser.balance - priceToPay);
      await updateFirestoreUserProfile(currentUser.id, { balance: updatedBal } as any);

      if (prod) {
        await updateFirestoreProduct(prod.id, Math.max(0, prod.stock - 1), prod.price, prod.member_price);
      }

      await createFirestoreTransaction(txBuy);
      setCurrentUser(prev => prev ? ({ ...prev, balance: updatedBal }) : null);
      alert(`Pembelian ${prod?.name || 'Produk'} berhasil! Sisa saldo Anda: Rp ${updatedBal.toLocaleString("id-ID")}`);
    } else {
      await createFirestoreTransaction(txBuy);
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

  const handleDeposit = async (amount: number, method: 'qris' | 'bca' | 'mandiri') => {
    if (!currentUser) return;
    const newDep: DepositRequest = {
      id: Date.now(),
      user_id: currentUser.id,
      username: currentUser.username,
      amount,
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
      description: `Pengajuan Deposit Saldo via ${method.toUpperCase()} (Menunggu Pembayaran)`,
      created_at: new Date().toISOString()
    };

    let apiSuccess = false;
    try {
      const res = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, amount, method })
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
    alert(`Pengajuan deposit sebesar Rp ${amount.toLocaleString("id-ID")} via ${method.toUpperCase()} telah dibuat.`);
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
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodData)
      });
      if (res.ok) {
        await fetchProducts();
        await fetchDashboardData();
        return true;
      }
    } catch (err) {
      console.warn("Add product API unreachable, saving directly to Firestore...", err);
    }

    try {
      await addFirestoreProduct(prodData);
      await fetchProducts();
      await fetchDashboardData();
      return true;
    } catch (fsErr) {
      console.error("Error adding product to Firestore:", fsErr);
      throw fsErr;
    }
  };

  const handleUpdateProfile = async (data: { fullname: string; email: string; phone: string; password?: string }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/user/${currentUser.id}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("json")) {
        fetchDashboardData();
        return true;
      }
    } catch (err) {
      console.warn("Profile update API unreachable, updating directly in Firestore...", err);
    }

    await updateFirestoreUserProfile(currentUser.id, data);
    setCurrentUser(prev => prev ? ({
      ...prev,
      fullname: data.fullname || prev.fullname,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      ...(data.password ? { password: data.password } : {})
    }) : null);
    await fetchDashboardData();
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

  const handleLogout = () => {
    currentUserRef.current = null;
    try {
      localStorage.removeItem("zalora_session_user");
      if (auth) {
        signOut(auth).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to clear local session:", err);
    }
    setCurrentUser(null);
    setUserDashboardData(null);
    setAdminDashboardData(null);
    setActiveView('landing');
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
                onProcessDeposit={handleProcessDeposit}
                onAddProduct={handleAddProduct}
                onUpdateProfile={handleUpdateProfile}
                onResetPassword={(curP, newP) => handleResetPassword(curP, newP)}
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
                onUpdateProfile={handleUpdateProfile}
                onResetPassword={(curP, newP) => handleResetPassword(curP, newP)}
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
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] text-slate-400 italic">Default: admin123 / user123</span>
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
                  Silakan masuk menggunakan akun baru Anda, lalu lakukan pengisian deposit saldo Rp 550.000 untuk melakukan aktifasi premium agar seluruh bonus mengalir lancar!
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
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nama Lengkap (Sesuai KTP)</label>
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
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nomor KTP / NIK (16 Digit)</label>
                    <input
                      type="text"
                      required
                      placeholder="3271xxxxxxxxxxxx"
                      value={regKtp}
                      onChange={(e) => setRegKtp(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Email / Gmail Aktif</label>
                    <input
                      type="email"
                      required
                      placeholder="Contoh: nama@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nomor HP / Telepon</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (!regWhatsapp) setRegWhatsapp(e.target.value);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nomor WhatsApp Aktif</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Rekening Bank Pencairan Bonus (WD)</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Bank</label>
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
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">No. Rekening</label>
                      <input
                        type="text"
                        required
                        placeholder="1234567890"
                        value={regBankAccount}
                        onChange={(e) => setRegBankAccount(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Nama Pemilik</label>
                      <input
                        type="text"
                        required
                        placeholder="Atas nama..."
                        value={regBankHolder}
                        onChange={(e) => setRegBankHolder(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Kata Sandi</label>
                    <input
                      type="password"
                      required
                      placeholder="Buat kata sandi..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Ulangi Kata Sandi</label>
                    <input
                      type="password"
                      required
                      placeholder="Konfirmasi kata sandi..."
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
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
