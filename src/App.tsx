import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, onSnapshot, deleteDoc } from "firebase/firestore";
import { app, auth, db } from "./lib/firebase";
import { resolvedFirebaseConfig } from "./lib/firebaseConfig";
import LandingPage from "./components/LandingPage";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PHPSourceViewer from "./components/PHPSourceViewer";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, BinaryTreeNode, Order } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { DEFAULT_USERS } from "./data/defaultUsers";
import { DEFAULT_ORDERS } from "./data/defaultOrders";
import { LogIn, Key, ShieldCheck, Download, Award, X, Copy, Check, Info, RefreshCw, CheckCircle, Mail, Lock, Send, User, CreditCard, ShoppingBag, Users } from "lucide-react";

// Client-side timeout helper to prevent hanging on Firestore network stalls
function withClientTimeout<T>(promise: Promise<T>, ms: number = 8000, label = "Operation"): Promise<T | null> {
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

// Localstorage persistence helpers for client-side user fallback
function getLocalStoredUsers(): MLMUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('zalora_local_users');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalStoredUser(user: MLMUser): void {
  if (typeof window === 'undefined' || !user) return;
  try {
    const existing = getLocalStoredUsers();
    const idx = existing.findIndex(u => Number(u.id) === Number(user.id) || (u.username && u.username.toLowerCase() === (user.username || "").toLowerCase()));
    if (idx >= 0) {
      existing[idx] = user;
    } else {
      existing.push(user);
    }
    localStorage.setItem('zalora_local_users', JSON.stringify(existing));
  } catch (e) {
    console.warn("Failed saving local user to localStorage:", e);
  }
}

// Firebase Firestore Direct Data Helpers
async function fetchFirestoreUsers(): Promise<MLMUser[]> {
  console.log("🔍 [fetchFirestoreUsers] Checking Firestore `db` status...", {
    dbConnected: !!db,
    projectId: resolvedFirebaseConfig.projectId || "MISSING",
    apiKeyConfigured: !!resolvedFirebaseConfig.apiKey,
    isVercel: typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
  });

  // Check localStorage reset flag (set during active session)
  const localResetFlag = typeof window !== 'undefined' && localStorage.getItem('zalora_reset_members') === 'true';

  if (!db) {
    console.warn("⚠️ [fetchFirestoreUsers] Firestore `db` instance is NULL! Using local cache & default users.");
    const cachedUsers = getLocalStoredUsers();
    const combinedMap = new Map<number, MLMUser>();
    if (!localResetFlag) {
      DEFAULT_USERS.forEach(u => combinedMap.set(Number(u.id), u));
    } else {
      DEFAULT_USERS.filter(u => u.role === 'admin' || Number(u.id) === 1).forEach(u => combinedMap.set(Number(u.id), u));
    }
    cachedUsers.forEach(u => combinedMap.set(Number(u.id), u));
    return Array.from(combinedMap.values()).sort((a, b) => Number(a.id) - Number(b.id));
  }

  try {
    // Check Firestore-persisted reset flag so even fresh server instances know
    let firestoreResetFlag = false;
    try {
      const ctrlDoc: any = await withClientTimeout(getDoc(doc(db, "settings", "adminControl")), 3000, "getDoc adminControl");
      if (ctrlDoc && ctrlDoc.exists && typeof ctrlDoc.exists === 'function' && ctrlDoc.exists()) {
        firestoreResetFlag = ctrlDoc.data()?.membersReset === true;
      }
    } catch (e) { /* ignore */ }

    const isReset = localResetFlag || firestoreResetFlag;

    console.log("📡 [fetchFirestoreUsers] Reading 'users' collection from Firestore...", { isReset });
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "users")), 8000, "getDocs users");
    const usersMap = new Map<number, MLMUser>();

    if (querySnapshot) {
      console.log(`✅ [fetchFirestoreUsers] Firestore read successful! Received ${querySnapshot.size} user documents.`);
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
            password: data.password || (parsedId === 1 || data.role === "admin" || data.username === "admin" ? "admin123" : "user123"),
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : (parsedId === 1 || data.role === "admin" || data.username === "admin"),
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
            bank_holder: data.bank_holder || "",
            address: data.address || "",
            city: data.city || "",
            profile_photo: data.profile_photo || ""
          });
        }
      });
    } else {
      console.warn("⚠️ [fetchFirestoreUsers] Firestore read timed out or failed.");
    }

    // Merge locally cached registered users
    const cachedUsers = getLocalStoredUsers();
    cachedUsers.forEach(lu => {
      if (lu && lu.id && !usersMap.has(Number(lu.id))) {
        usersMap.set(Number(lu.id), lu);
      }
    });

    // Always ensure default admin user exists in usersMap
    if (!usersMap.has(1)) {
      const defaultAdmin = DEFAULT_USERS.find(u => u.id === 1 || u.username === "admin") || DEFAULT_USERS[0];
      if (defaultAdmin) {
        usersMap.set(1, defaultAdmin);
      }
    }

    // If users collection and local cache are empty:
    if (usersMap.size === 0) {
      if (isReset) {
        const adminOnly = DEFAULT_USERS.filter(u => u.role === 'admin' || Number(u.id) === 1);
        console.log("ℹ️ [fetchFirestoreUsers] Reset active. Returning admin only, skipping seed.");
        return adminOnly;
      } else {
        console.log("ℹ️ [fetchFirestoreUsers] Collection 'users' is empty (fresh install). Seeding default users...");
        for (const defU of DEFAULT_USERS) {
          usersMap.set(defU.id, defU);
          try {
            withClientTimeout(setDoc(doc(db, "users", String(defU.id)), defU), 1000, `seedUser ${defU.username}`);
          } catch (e) {
            console.warn(`Failed seeding user ${defU.username} to Firestore:`, e);
          }
        }
      }
    }

    let finalUsers = Array.from(usersMap.values());
    const hasNonAdminUsers = finalUsers.some(u => u.role !== 'admin' && Number(u.id) !== 1 && u.username !== 'admin');
    if (hasNonAdminUsers && isReset) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zalora_reset_members');
      }
      if (db) {
        setDoc(doc(db, "settings", "adminControl"), { membersReset: false }, { merge: true }).catch(() => {});
      }
    }
    finalUsers.sort((a, b) => Number(a.id) - Number(b.id));
    return finalUsers;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreUsers] Error reading 'users' from Firestore:", err);
    if (localResetFlag) {
      return DEFAULT_USERS.filter(u => u.role === 'admin' || Number(u.id) === 1 || u.username === 'admin');
    }
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
  address?: string;
  city?: string;
}): Promise<MLMUser> {
  // Clear membersReset flag when a new member registers so user is visible everywhere
  if (typeof window !== 'undefined') {
    localStorage.removeItem('zalora_reset_members');
  }
  if (db) {
    try {
      await setDoc(doc(db, "settings", "adminControl"), {
        membersReset: false
      }, { merge: true }).catch(() => {});
    } catch (e) { /* ignore */ }
  }

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
    is_active: false, // Default Free Member (Harus bayar registrasi Rp 550.000 untuk status Verified)
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
  saveLocalStoredUser(newUser);

  if (db) {
    try {
      await setDoc(doc(db, "users", String(newUserId)), newUser);
      await updateAncestorCountsClient(updatedUsers, uplineId, finalPos);

      // Auto-create initial pending deposit request for Rp 550.000 for member activation
      const actCode = 100 + (newUserId * 37) % 899;
      const initialDep: DepositRequest = {
        id: Date.now(),
        user_id: newUserId,
        username: normalizedUsername,
        amount: 550000,
        unique_code: actCode,
        method: "transfer_bank",
        status: "pending",
        payment_code: `ACT-${newUserId}`,
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, "deposits", String(initialDep.id)), initialDep);
    } catch (e) {
      console.warn("Firestore setDoc failed for user registration:", e);
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
  if (!db) {
    console.warn("⚠️ [fetchFirestoreProducts] `db` instance is null. Returning DEFAULT_PRODUCTS.");
    return DEFAULT_PRODUCTS;
  }

  try {
    console.log("📡 [fetchFirestoreProducts] Reading 'products' collection from Firestore...");
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "products")), 8000, "getDocs products");
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
        image: data.image || "",
        sizes: data.sizes,
        colors: data.colors,
        badge: data.badge
      });
    });

    if (prods.length === 0) {
      console.log("ℹ️ [fetchFirestoreProducts] Collection 'products' is empty in Firestore. Seeding default products...");
      for (const defP of DEFAULT_PRODUCTS) {
        try {
          withClientTimeout(setDoc(doc(db, "products", String(defP.id)), defP), 8000, `seedProduct ${defP.name}`);
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
    const docSnap: any = await withClientTimeout(getDoc(docRef), 5000, "getDoc system settings");
    if (docSnap && docSnap.exists && typeof docSnap.exists === 'function' && docSnap.exists()) {
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
      await withClientTimeout(setDoc(doc(db, "settings", "system"), newSettings, { merge: true }), 5000, "saveSettings");
      return true;
    } catch (err: any) {
      console.warn("⚠️ [saveFirestoreSettings] Error saving settings to Firestore:", err);
    }
  }
  return true;
}

async function fetchFirestoreWithdrawals(): Promise<WDRequest[]> {
  if (typeof window !== 'undefined' && localStorage.getItem('zalora_reset_sales') === 'true') {
    return [];
  }
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "withdrawals")), 8000, "getDocs withdrawals");
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
      withClientTimeout(setDoc(doc(db, "withdrawals", String(wd.id)), wd), 8000, `createWD #${wd.id}`);
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
      withClientTimeout(setDoc(doc(db, "withdrawals", String(wdId)), { status }, { merge: true }), 8000, `updateWD #${wdId}`);
    } catch (err) {
      console.warn("Error updating withdrawal in Firestore:", err);
    }
  }
}

async function fetchFirestoreTransactions(): Promise<Transaction[]> {
  if (typeof window !== 'undefined' && localStorage.getItem('zalora_reset_sales') === 'true') {
    return [];
  }
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "transactions")), 8000, "getDocs transactions");
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
      withClientTimeout(setDoc(doc(db, "transactions", String(tx.id)), tx), 8000, `createTx #${tx.id}`);
    } catch (err) {
      console.warn("Error creating transaction in Firestore:", err);
    }
  }
}

async function fetchFirestoreDeposits(): Promise<DepositRequest[]> {
  if (typeof window !== 'undefined' && localStorage.getItem('zalora_reset_sales') === 'true') {
    return [];
  }
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "deposits")), 8000, "getDocs deposits");
    if (!querySnapshot) return [];
    const deps: DepositRequest[] = [];
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      deps.push({
        id: Number(data.id),
        user_id: Number(data.user_id),
        username: data.username || "",
        amount: Number(data.amount) || 0,
        unique_code: data.unique_code !== undefined ? Number(data.unique_code) : (100 + (Number(data.id) || 1) % 899),
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
      withClientTimeout(setDoc(doc(db, "deposits", String(dep.id)), dep), 8000, `createDeposit #${dep.id}`);
    } catch (err) {
      console.warn("Error creating deposit in Firestore:", err);
    }
  }
}

async function fetchFirestoreOrders(): Promise<Order[]> {
  if (typeof window !== 'undefined' && localStorage.getItem('zalora_reset_sales') === 'true') {
    return [];
  }
  if (!db) return [];

  try {
    const querySnapshot: any = await withClientTimeout(getDocs(collection(db, "orders")), 8000, "getDocs orders");
    if (!querySnapshot || querySnapshot.empty) {
      // After reset or if db_initialized flag is set, never re-seed orders
      if (typeof window !== 'undefined' && (localStorage.getItem('zalora_reset_sales') === 'true' || localStorage.getItem('zalora_db_initialized') === 'true')) {
        return [];
      }
      // Only seed on fresh install (no flag set)
      if (typeof window !== 'undefined' && !localStorage.getItem('zalora_db_initialized')) {
        for (const ord of DEFAULT_ORDERS) {
          withClientTimeout(setDoc(doc(db, "orders", String(ord.id)), ord), 8000, `seedOrder #${ord.id}`);
        }
        localStorage.setItem('zalora_db_initialized', 'true');
        return DEFAULT_ORDERS;
      }
      return [];
    }

    const ords: Order[] = [];
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      ords.push({
        id: Number(data.id),
        invoice_no: data.invoice_no || `INV-${data.id}`,
        user_id: Number(data.user_id) || 0,
        username: data.username || "",
        fullname: data.fullname || "",
        phone: data.phone || "",
        address: data.address || "",
        product_name: data.product_name || "Produk Denim",
        amount: Number(data.amount) || 0,
        unique_code: data.unique_code !== undefined ? Number(data.unique_code) : (100 + (Number(data.id) || 1) % 899),
        payment_method: data.payment_method || "Transfer Bank",
        status: data.status || "DIPROSES",
        courier: data.courier || "JNE REGULER",
        tracking_number: data.tracking_number || "",
        notes: data.notes || "",
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        steps: Array.isArray(data.steps) ? data.steps : []
      });
    });

    ords.sort((a, b) => b.id - a.id);
    return ords;
  } catch (err: any) {
    console.error("❌ [fetchFirestoreOrders] Error reading 'orders' from Firestore:", err);
    return DEFAULT_ORDERS;
  }
}

async function saveFirestoreOrder(ord: Order): Promise<void> {
  if (db) {
    try {
      await withClientTimeout(setDoc(doc(db, "orders", String(ord.id)), ord, { merge: true }), 8000, `saveOrder #${ord.id}`);
    } catch (err) {
      console.warn("Error saving order in Firestore:", err);
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
      const isActivating = !targetUser.is_active && depData.amount >= 550000;
      const newBal = isActivating ? (Number(targetUser.balance) || 0) : ((Number(targetUser.balance) || 0) + depData.amount);
      await updateFirestoreUserProfile(targetUser.id, { 
        balance: newBal, 
        is_active: isActivating ? true : targetUser.is_active 
      });
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
    image: prod.image,
    sizes: prod.sizes,
    colors: prod.colors,
    badge: prod.badge
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

async function updateFirestoreProductFull(product: Product): Promise<void> {
  if (db) {
    try {
      const cleanData: any = {
        id: Number(product.id),
        name: product.name || "",
        description: product.description || "",
        price: Number(product.price) || 0,
        member_price: Number(product.member_price) || 0,
        stock: Number(product.stock) || 0,
        image: product.image || "",
        sizes: product.sizes || [],
        colors: product.colors || [],
        badge: product.badge || ""
      };
      await setDoc(doc(db, "products", String(product.id)), cleanData, { merge: true });
    } catch (e) {
      console.warn("Error updating full product in Firestore:", e);
    }
  }
}

async function deleteFirestoreProduct(productId: number): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, "products", String(productId)));
    } catch (e) {
      console.warn("Error deleting product from Firestore:", e);
    }
  }
}

async function updateFirestoreUserProfile(userId: number, updateData: { fullname?: string; email?: string; phone?: string; whatsapp?: string; bank_name?: string; bank_account?: string; bank_holder?: string; address?: string; city?: string; password?: string; balance?: number; is_active?: boolean; sponsor_bonus?: number; pairing_bonus?: number; level_bonus?: number; ro_bonus?: number; wishlist?: number[]; profile_photo?: string }): Promise<void> {
  if (db) {
    try {
      const cleanData: any = {};
      if (updateData.fullname !== undefined) cleanData.fullname = updateData.fullname;
      if (updateData.email !== undefined) cleanData.email = updateData.email;
      if (updateData.phone !== undefined) cleanData.phone = updateData.phone;
      if (updateData.whatsapp !== undefined) cleanData.whatsapp = updateData.whatsapp;
      if (updateData.bank_name !== undefined) cleanData.bank_name = updateData.bank_name;
      if (updateData.bank_account !== undefined) cleanData.bank_account = updateData.bank_account;
      if (updateData.bank_holder !== undefined) cleanData.bank_holder = updateData.bank_holder;
      if (updateData.address !== undefined) cleanData.address = updateData.address;
      if (updateData.city !== undefined) cleanData.city = updateData.city;
      if (updateData.password !== undefined) cleanData.password = updateData.password;
      if (updateData.wishlist !== undefined) cleanData.wishlist = updateData.wishlist;
      if (updateData.balance !== undefined) cleanData.balance = updateData.balance;
      if (updateData.is_active !== undefined) cleanData.is_active = updateData.is_active;
      if (updateData.sponsor_bonus !== undefined) cleanData.sponsor_bonus = updateData.sponsor_bonus;
      if (updateData.pairing_bonus !== undefined) cleanData.pairing_bonus = updateData.pairing_bonus;
      if (updateData.level_bonus !== undefined) cleanData.level_bonus = updateData.level_bonus;
      if (updateData.ro_bonus !== undefined) cleanData.ro_bonus = updateData.ro_bonus;
      if (updateData.profile_photo !== undefined) cleanData.profile_photo = updateData.profile_photo;

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
    try {
      if (currentUser) {
        localStorage.setItem("zalora_session_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("zalora_session_user");
      }
    } catch {}
  }, [currentUser]);

  // Listen for Firebase Auth state changes directly
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (fbUser: any) => {
      if (fbUser && !currentUserRef.current) {
        console.log("🔥 [Firebase Auth] Active Firebase Auth session detected for:", fbUser.email);
        const fsUsers = await fetchFirestoreUsers();
        const foundUser = fsUsers.find(u =>
          (u.firebase_uid && u.firebase_uid === fbUser.uid) ||
          (u.email && fbUser.email && u.email.toLowerCase().trim() === fbUser.email.toLowerCase().trim())
        );
        if (foundUser) {
          setCurrentUser(foundUser);
          setActiveView('dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("zalora_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("zalora_products", JSON.stringify(products));
    } catch {}
  }, [products]);
  
  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'member' | 'admin'>('member');

  // Detect URL parameter for dedicated Admin Login (?admin, /admin, #admin)
  useEffect(() => {
    const checkAdminUrl = () => {
      if (typeof window === "undefined") return;
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (search.includes("admin") || hash.includes("admin") || path.endsWith("/admin") || path === "/admin") {
        setLoginMode('admin');
        setShowLoginModal(true);
      }
    };
    checkAdminUrl();
    window.addEventListener("popstate", checkAdminUrl);
    return () => window.removeEventListener("popstate", checkAdminUrl);
  }, []);

  const openMemberLogin = () => {
    setLoginMode('member');
    setLoginError('');
    setShowLoginModal(true);
  };

  const openAdminLogin = () => {
    setLoginMode('admin');
    setLoginError('');
    setShowLoginModal(true);
  };

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
  const [regProductSeries, setRegProductSeries] = useState('HTR-RAW-01 (Hedtro Raw Denim Premium 15oz)');
  const [regProductColor, setRegProductColor] = useState('Indigo Blue Classic');
  const [regProductSize, setRegProductSize] = useState('32');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

  // Dynamic branding & configuration settings
  const [systemSettings, setSystemSettings] = useState<any>(() => {
    const defaults = {
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
    };
    try {
      const saved = localStorage.getItem("zalora_system_settings");
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {}
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem("zalora_system_settings", JSON.stringify(systemSettings));
    } catch {}
  }, [systemSettings]);

  // Active user data
  const [userDashboardData, setUserDashboardData] = useState<{
    user: MLMUser;
    transactions: Transaction[];
    deposits: DepositRequest[];
    withdrawals: WDRequest[];
    orders?: Order[];
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
    orders?: Order[];
  } | null>(null);

  // Orders & Shipping Resi State
  const [orders, setOrders] = useState<Order[]>(DEFAULT_ORDERS);

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
    const numId = Number(orderId);
    try {
      await fetch("/api/admin/orders/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId })
      }).catch(e => console.warn("Delete order API warning:", e));

      if (db) {
        try {
          await deleteDoc(doc(db, "orders", String(orderId)));
        } catch (err) {
          console.warn("Firestore delete order doc warning:", err);
        }
      }

      setOrders(prev => prev.filter(o => Number(o.id) !== numId && String(o.id) !== String(orderId)));

      setAdminDashboardData(prev => prev ? ({
        ...prev,
        orders: prev.orders ? prev.orders.filter(o => Number(o.id) !== numId && String(o.id) !== String(orderId)) : []
      }) : null);

      setUserDashboardData(prev => prev ? ({
        ...prev,
        orders: prev.orders ? prev.orders.filter(o => Number(o.id) !== numId && String(o.id) !== String(orderId)) : []
      }) : null);

      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error deleting order:", err);
      return false;
    }
  };

  // Real-time Firestore subscription for System Settings
  useEffect(() => {
    if (!db) return;
    console.log("🔥 [Firebase Realtime] Subscribing to 'settings/system' Firestore document...");
    const unsub = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
      if (docSnap && docSnap.exists && typeof docSnap.exists === 'function' && docSnap.exists()) {
        const data = docSnap.data();
        console.log("🔥 [Firebase Realtime] Received live settings update from Firebase:", data);
        setSystemSettings((prev: any) => ({ ...prev, ...data }));
      }
    }, (err) => {
      console.warn("⚠️ [Firebase Realtime] Error in settings listener:", err);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore subscriptions for Database Collections (Users, WDs, Deposits, Txs, Products)
  useEffect(() => {
    if (!db) return;
    console.log("🔥 [Firebase Realtime] Subscribing to live Firestore database collections...");

    const unsubUsers = onSnapshot(collection(db, "users"), () => {
      console.log("🔥 [Firebase Realtime] Live change in 'users' collection detected!");
      if (currentUserRef.current) fetchDashboardData();
    });

    const unsubWd = onSnapshot(collection(db, "withdrawals"), () => {
      console.log("🔥 [Firebase Realtime] Live change in 'withdrawals' collection detected!");
      if (currentUserRef.current) fetchDashboardData();
    });

    const unsubDep = onSnapshot(collection(db, "deposits"), () => {
      console.log("🔥 [Firebase Realtime] Live change in 'deposits' collection detected!");
      if (currentUserRef.current) fetchDashboardData();
    });

    const unsubTx = onSnapshot(collection(db, "transactions"), () => {
      console.log("🔥 [Firebase Realtime] Live change in 'transactions' collection detected!");
      if (currentUserRef.current) fetchDashboardData();
    });

    const unsubProd = onSnapshot(collection(db, "products"), () => {
      console.log("🔥 [Firebase Realtime] Live change in 'products' collection detected!");
      fetchProducts();
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), () => {
      console.log("🔥 [Firebase Realtime] Live change in 'orders' collection detected!");
      fetchOrders();
    });

    return () => {
      unsubUsers();
      unsubWd();
      unsubDep();
      unsubTx();
      unsubProd();
      unsubOrders();
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
        left_count: 0,
        right_count: 0,
        left_sales: 0,
        right_sales: 0,
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
        totalTurnover: 0,
        totalBonusesPaid: 0,
        pendingWDCount: 0,
        pendingWDAmount: 0,
        isAutoPayout: false
      },
      users: DEFAULT_USERS,
      withdrawals: [],
      deposits: [],
      transactions: [],
      orders: []
    };
  };

  const getDefaultUserDashboard = (user: MLMUser) => ({
    user,
    transactions: [],
    deposits: [],
    withdrawals: [],
    orders: [],
    notifications: [
      { id: 1, title: "Selamat Datang!", message: "Selamat datang di Portal Afiliasi HEDTRO JEANS.", read: false, time: "Baru saja" }
    ],
    binaryTree: {
      user: user,
      left: null,
      right: null
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
        const timeoutId = setTimeout(() => controller.abort(), 8000);
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
        const timeoutId = setTimeout(() => controller.abort(), 8000);
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
        const memberUsers = fsUsers.filter(u => u.role !== 'admin' && Number(u.id) !== 1 && u.username !== 'admin');
        const activeCount = memberUsers.filter(u => u.is_active).length;
        const pendingWDs = fsWithdrawals.filter(w => w.status === 'pending');
        const purchaseTxs = fsTransactions.filter(t => t.type === 'purchase');
        const purchaseTurnover = Math.abs(purchaseTxs.reduce((acc, t) => acc + t.amount, 0));
        const activationTurnover = activeCount * 550000;
        const totalTurnover = activationTurnover + purchaseTurnover;
        const bonusTxs = fsTransactions.filter(t => ['sponsor_bonus', 'pairing_bonus', 'level_bonus', 'ro_bonus'].includes(t.type));
        const totalBonusesPaid = bonusTxs.reduce((acc, t) => acc + t.amount, 0);
        setAdminDashboardData({
          metrics: {
            totalMembers: memberUsers.length,
            activeMembers: activeCount,
            inactiveMembers: memberUsers.length - activeCount,
            totalTurnover,
            totalBonusesPaid,
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
        console.log("✅ [fetchDashboardData] Admin dashboard updated via direct Firestore data.");
      } else {
        const freshUser = fsUsers.find(u => Number(u.id) === Number(targetUser.id)) || targetUser;
        if (!currentUserRef.current) return;
        setCurrentUser(freshUser);
        const binaryTree = buildClientBinaryTree(fsUsers, Number(freshUser.id), 0, 30);
        const referrals = fsUsers.filter(u => Number(u.sponsor_id) === Number(freshUser.id));
        const userWDs = fsWithdrawals.filter(w => Number(w.user_id) === Number(freshUser.id));
        let userDeps = fsDeposits.filter(d => Number(d.user_id) === Number(freshUser.id));
        let userTxs = fsTransactions.filter(t => Number(t.user_id) === Number(freshUser.id));
        let userOrds = fsOrders.filter(o => Number(o.user_id) === Number(freshUser.id));

        // Auto-ensure unactivated member has an activation deposit, order, & transaction item
        if (!freshUser.is_active) {
          const actCode = 100 + (Number(freshUser.id) * 37) % 899;

          let hasActDep = userDeps.some(d => Number(d.amount) === 550000);
          if (!hasActDep) {
            const newActDep: DepositRequest = {
              id: Date.now(),
              user_id: Number(freshUser.id),
              username: freshUser.username,
              amount: 550000,
              unique_code: actCode,
              method: "transfer_bank",
              status: "pending",
              payment_code: `ACT-${freshUser.id}`,
              created_at: new Date().toISOString()
            };
            userDeps = [newActDep, ...userDeps];
            createFirestoreDeposit(newActDep).catch(() => {});
          }

          let hasActOrd = userOrds.some(o => Number(o.amount) === 550000);
          if (!hasActOrd) {
            const newActOrd: Order = {
              id: Date.now() + 1,
              invoice_no: `INV-ACT-${freshUser.id}-${Date.now().toString().slice(-4)}`,
              user_id: Number(freshUser.id),
              username: freshUser.username,
              fullname: freshUser.fullname,
              phone: freshUser.phone || "-",
              address: freshUser.address || "Alamat Pembeli",
              product_name: "Paket Perdana Member Premium - Hedtro Raw Denim 15oz",
              amount: 550000,
              unique_code: actCode,
              payment_method: "Transfer Bank",
              status: "DIPROSES",
              courier: "JNE REGULER",
              tracking_number: `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`,
              notes: "Pesanan Pendaftaran & Aktivasi Member Premium",
              created_at: new Date().toISOString()
            };
            userOrds = [newActOrd, ...userOrds];
            saveFirestoreOrder(newActOrd).catch(() => {});
          }

          let hasActTx = userTxs.some(t => t.type === 'activation' || (Number(t.amount) === 550000 && t.type === 'deposit'));
          if (!hasActTx) {
            const newActTx: Transaction = {
              id: Date.now() + 2,
              user_id: Number(freshUser.id),
              username: freshUser.username,
              type: "activation",
              amount: 550000,
              description: "Tagihan Aktivasi Member Premium & Paket Perdana Hedtro Jeans",
              status: "pending",
              created_at: new Date().toISOString()
            };
            userTxs = [newActTx, ...userTxs];
            createFirestoreTransaction(newActTx).catch(() => {});
          }
        }

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
        } else if (res.status === 401) {
          // Explicit wrong password error from backend
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
      const uSearchRaw = loginUsername.trim().toLowerCase();
      const uSearchClean = loginUsername.toLowerCase().replace(/\s+/g, "").trim();
      const matched = fsUsers.find(u => {
        const uname = (u.username || "").trim().toLowerCase();
        const uemail = (u.email || "").trim().toLowerCase();
        return uname === uSearchClean || uemail === uSearchRaw || uemail === uSearchClean;
      });

      if (matched) {
        const isAdmin = matched.role === 'admin' || matched.username === 'admin' || Number(matched.id) === 1;
        if (isAdmin) {
          const validAdminPasses = ["admin123", "password123", "admin", matched.password].filter(Boolean);
          if (loginPassword && !validAdminPasses.includes(loginPassword)) {
            setLoginError("Kata sandi yang Anda masukkan salah!");
            return;
          }
          matched.password = "admin123";
        } else if (matched.password && loginPassword && matched.password !== loginPassword) {
          setLoginError("Kata sandi yang Anda masukkan salah!");
          return;
        }
        setCurrentUser(matched);
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        setActiveView('dashboard');
      } else {
        if (uSearchClean === 'admin' || uSearchRaw === 'admin' || uSearchClean === 'admin@hedtrojeans.com') {
          const fallbackAdmin = DEFAULT_USERS.find(u => u.username === 'admin') || DEFAULT_USERS[0];
          if (fallbackAdmin) {
            setCurrentUser(fallbackAdmin);
            setShowLoginModal(false);
            setLoginUsername('');
            setLoginPassword('');
            setActiveView('dashboard');
            return;
          }
        }
        setLoginError("Username atau email tidak terdaftar atau akun telah dihapus.");
      }
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRegister) return;
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

    setIsSubmittingRegister(true);
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
      let registeredUser: MLMUser | null = null;
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
            bank_holder: regBankHolder || regFullname,
            address: regAddress,
            city: regCity,
            product_series: regProductSeries,
            product_color: regProductColor,
            product_size: regProductSize
          })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.user) registeredUser = data.user;
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
        registeredUser = await registerUserToFirestoreDirect({
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
          bank_holder: regBankHolder || regFullname,
          address: regAddress,
          city: regCity
        });
      }

      // 4. Create initial order record for new member
      const assignedUserId = registeredUser ? Number(registeredUser.id) : 0;
      const newOrdId = Date.now();
      const newResi = `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const regOrder: Order = {
        id: newOrdId,
        invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`,
        user_id: assignedUserId,
        username: createdUsername,
        fullname: regFullname,
        phone: regPhone,
        address: `${regAddress}${regCity ? ', ' + regCity : ''}`,
        product_name: `Paket Perdana Member - Hedtro Jeans (${regProductSeries})`,
        amount: 550000,
        payment_method: "Transfer Bank / QRIS",
        status: "DIPROSES",
        courier: "JNE REGULER",
        tracking_number: newResi,
        notes: `Pesanan Pendaftaran Member. Varian Dipilih: Seri ${regProductSeries} | Warna: ${regProductColor} | Ukuran Size: ${regProductSize}. Celana Jeans Perdana sedang diproses di gudang.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        steps: [
          { title: "Registrasi Akun & Invoice Dibuat", time: new Date().toLocaleString("id-ID"), done: true, description: "Pendaftaran member berhasil" },
          { title: "Gudang Memproses & Quality Control", time: new Date().toLocaleString("id-ID"), done: true, description: `Menyiapkan Celana Jeans Seri ${regProductSeries} (Warna: ${regProductColor}, Size: ${regProductSize})` },
          { title: "Diserahkan ke Kurir Ekspedisi (JNE)", time: "Sedang Diproses", done: false, description: `Nomor Resi: ${newResi}` },
          { title: "Dalam Pengiriman", time: "-", done: false, description: "-" },
          { title: "Pesanan Diterima Pemesan", time: "-", done: false, description: "-" }
        ]
      };
      await saveFirestoreOrder(regOrder);
      setOrders(prev => [regOrder, ...prev]);

      // Clear members reset flag when new member registers (reset is "done")
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zalora_reset_members');
      }
      if (db) {
        try {
          await setDoc(doc(db, "settings", "adminControl"), {
            membersReset: false
          }, { merge: true }).catch(() => {});
        } catch (e) { /* ignore */ }
      }

      setRegSuccessMessage(`Pendaftaran Berhasil! Order ID Invoice: ${regOrder.invoice_no} (Resi: ${newResi}) telah dibuat & terhubung ke sistem lacak pesanan.`);

      if (registeredUser) {
        saveLocalStoredUser(registeredUser);
        setCurrentUser(registeredUser);
        setShowRegisterModal(false);
        setShowLoginModal(false);
        setActiveView('dashboard');
      } else {
        setLoginUsername(regEmail);
        setLoginPassword(regPassword);
      }

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
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handleQuickLogin = async (role: 'user' | 'admin') => {
    setLoginError('');
    if (role === 'admin') {
      const username = 'admin';
      const password = 'admin123';
      setLoginUsername(username);
      setLoginPassword(password);
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
            setActiveView('dashboard');
            return;
          }
        }
      } catch {}
      const fallbackAdmin = getFallbackUser('admin');
      if (fallbackAdmin) {
        setCurrentUser(fallbackAdmin);
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        setActiveView('dashboard');
      }
      return;
    }

    // Role 'user' (Demo Member Quick Login)
    try {
      const fsUsers = await fetchFirestoreUsers();
      const demoMember = fsUsers.find(u => u.role !== 'admin' && u.username !== 'admin');
      if (demoMember) {
        setLoginUsername(demoMember.username);
        setLoginPassword(demoMember.password || 'user123');
        setCurrentUser(demoMember);
        setShowLoginModal(false);
        setActiveView('dashboard');
      } else {
        setLoginError("Tidak ada akun member terdaftar dalam database. Silakan lakukan pendaftaran member baru.");
      }
    } catch {
      setLoginError("Gagal menghubungkan ke data member.");
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
      const newUser = await registerUserToFirestoreDirect({
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
      alert(`✅ Member baru berhasil ditambahkan!\nUsername: ${newUser.username}\nNama: ${newUser.fullname}\nID Member: #${newUser.id}\n\nMember dapat login menggunakan username dan password yang telah diset.`);
      return true;
    } catch (err: any) {
      console.error("Error adding user in admin:", err);
      alert(`❌ Gagal menambah member baru:\n${err.message || "Terjadi kesalahan sistem"}`);
      return false;
    }
  };

  const handleUpdateUserAdmin = async (userId: number, updateData: Partial<MLMUser>): Promise<boolean> => {
    try {
      if (db) {
        await setDoc(doc(db, "users", String(userId)), updateData, { merge: true });
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

      if (db) {
        try {
          await deleteDoc(doc(db, "users", String(userId)));
        } catch (err) {
          console.warn("Firestore delete doc warning:", err);
        }
      }

      if (currentUser && (Number(currentUser.id) === targetNumId || String(currentUser.id) === String(userId))) {
        setCurrentUser(null);
        localStorage.removeItem("zalora_session_user");
        setActiveView('landing');
      }

        // Re-assign orphan children in Firestore to ID 1 so network tree stays intact
        try {
          const currentFsUsers = await fetchFirestoreUsers();
          for (const u of currentFsUsers) {
            if (Number(u.upline_id) === targetNumId || Number(u.sponsor_id) === targetNumId) {
              const updated = {
                ...u,
                upline_id: Number(u.upline_id) === targetNumId ? 1 : u.upline_id,
                sponsor_id: Number(u.sponsor_id) === targetNumId ? 1 : u.sponsor_id
              };
              await setDoc(doc(db, "users", String(u.id)), updated, { merge: true });
            }
          }
        } catch (e) {
          console.warn("Error cleaning orphan downlines in Firestore:", e);
        }

      setAdminDashboardData(prev => {
        if (!prev) return null;
        const newUsers = prev.users
          .filter(u => Number(u.id) !== targetNumId && String(u.id) !== String(userId))
          .map(u => ({
            ...u,
            upline_id: Number(u.upline_id) === targetNumId ? 1 : u.upline_id,
            sponsor_id: Number(u.sponsor_id) === targetNumId ? 1 : u.sponsor_id
          }));
        const activeCount = newUsers.filter(u => u.is_active).length;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            totalMembers: newUsers.length,
            activeMembers: activeCount,
            inactiveMembers: newUsers.length - activeCount
          },
          users: newUsers
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
    const numId = Number(depositId);
    try {
      await fetch("/api/admin/deposits/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: depositId })
      }).catch(e => console.warn("Delete deposit API warning:", e));

      if (db) {
        try {
          await deleteDoc(doc(db, "deposits", String(depositId)));
        } catch (err) {
          console.warn("Firestore delete deposit doc warning:", err);
        }
      }

      setAdminDashboardData(prev => prev ? ({
        ...prev,
        deposits: prev.deposits.filter(d => Number(d.id) !== numId && String(d.id) !== String(depositId))
      }) : null);

      setUserDashboardData(prev => prev ? ({
        ...prev,
        deposits: prev.deposits.filter(d => Number(d.id) !== numId && String(d.id) !== String(depositId))
      }) : null);

      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error deleting deposit:", err);
      return false;
    }
  };

  const handleDeleteWithdrawal = async (wdId: number | string): Promise<boolean> => {
    const numId = Number(wdId);
    try {
      await fetch("/api/admin/withdrawals/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wdId })
      }).catch(e => console.warn("Delete withdrawal API warning:", e));

      if (db) {
        try {
          await deleteDoc(doc(db, "withdrawals", String(wdId)));
        } catch (err) {
          console.warn("Firestore delete withdrawal doc warning:", err);
        }
      }

      setAdminDashboardData(prev => prev ? ({
        ...prev,
        withdrawals: prev.withdrawals.filter(w => Number(w.id) !== numId && String(w.id) !== String(wdId))
      }) : null);

      setUserDashboardData(prev => prev ? ({
        ...prev,
        withdrawals: prev.withdrawals.filter(w => Number(w.id) !== numId && String(w.id) !== String(wdId))
      }) : null);

      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error("Error deleting withdrawal:", err);
      return false;
    }
  };

  const handleResetCategory = async (category: 'members' | 'web_settings' | 'mlm_network' | 'sales'): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`zalora_reset_${category}`, 'true');
      }

      // Call backend API to reset in-memory server state
      await fetch("/api/admin/reset-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category })
      }).catch(() => {});

      if (category === 'members') {
        // 1. Delete all non-admin users from Firestore directly from client
        if (db) {
          try {
            const snapshot = await withClientTimeout(getDocs(collection(db, "users")), 8000, "getDocs users reset");
            if (snapshot && snapshot.docs) {
              const deletePromises = snapshot.docs
                .filter((docSnap: any) => {
                  const data = docSnap.data();
                  return data.role !== 'admin' && Number(data.id) !== 1 && data.username !== 'admin';
                })
                .map((docSnap: any) => deleteDoc(doc(db, "users", docSnap.id)).catch(err => {
                  console.warn("Error deleting member doc from Firestore:", err);
                }));
              await Promise.all(deletePromises);
              console.log(`✅ [Reset Members] Deleted ${deletePromises.length} member docs from Firestore`);
            }
          } catch (err) {
            console.warn("Error getting users collection for reset:", err);
          }

          // 2. Persist reset flag to Firestore so ALL server instances know
          try {
            await setDoc(doc(db, "settings", "adminControl"), {
              membersReset: true,
              membersResetAt: new Date().toISOString()
            }, { merge: true });
            console.log("✅ [Reset Members] Persisted membersReset flag to Firestore adminControl");
          } catch (err) {
            console.warn("Error saving adminControl reset flag:", err);
          }
        }

        // 3. Update React state immediately without refetching (to prevent stale reload)
        setAdminDashboardData(prev => {
          if (!prev) return null;
          const adminOnly = prev.users.filter(u => u.role === 'admin' || Number(u.id) === 1 || u.username === 'admin');
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              totalMembers: 0,
              activeMembers: 0,
              inactiveMembers: 0,
              totalTurnover: 0,
              totalBonusesPaid: 0
            },
            users: adminOnly
          };
        });
        // DO NOT call fetchDashboardData here - it would reload stale server data
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
        if (db) {
          try {
            await setDoc(doc(db, "settings", "system"), defaultSettings);
          } catch (err) {}
        }
        setSystemSettings(defaultSettings);
        try {
          await fetchDashboardData();
        } catch (err) {}
        return true;
      }

      if (category === 'mlm_network') {
        try {
          const currentFsUsers = await fetchFirestoreUsers();
          const updatedUsers = currentFsUsers.map(u => {
            if (u.role === 'admin' || Number(u.id) === 1) {
              return {
                ...u,
                left_count: 0, right_count: 0, left_sales: 0, right_sales: 0,
                sponsor_bonus: 0, pairing_bonus: 0, level_bonus: 0, ro_bonus: 0
              };
            }
            return {
              ...u,
              upline_id: 1, sponsor_id: 1, position: 'L' as 'L' | 'R',
              left_count: 0, right_count: 0, left_sales: 0, right_sales: 0,
              balance: 0, sponsor_bonus: 0, pairing_bonus: 0, level_bonus: 0, ro_bonus: 0
            };
          });

          if (db) {
            for (const u of updatedUsers) {
              try {
                await setDoc(doc(db, "users", String(u.id)), u, { merge: true });
              } catch (err) {}
            }
          }
        } catch (err) {}
        try {
          await fetchDashboardData();
        } catch (err) {}
        return true;
      }

      if (category === 'sales') {
        if (db) {
          try {
            const ordSnap = await withClientTimeout(getDocs(collection(db, "orders")), 5000, "getDocs orders reset");
            if (ordSnap && ordSnap.docs) {
              for (const d of ordSnap.docs) {
                try { await deleteDoc(doc(db, "orders", d.id)); } catch (err) {}
              }
            }
            const txSnap = await withClientTimeout(getDocs(collection(db, "transactions")), 5000, "getDocs tx reset");
            if (txSnap && txSnap.docs) {
              for (const d of txSnap.docs) {
                try { await deleteDoc(doc(db, "transactions", d.id)); } catch (err) {}
              }
            }
            const depSnap = await withClientTimeout(getDocs(collection(db, "deposits")), 5000, "getDocs dep reset");
            if (depSnap && depSnap.docs) {
              for (const d of depSnap.docs) {
                try { await deleteDoc(doc(db, "deposits", d.id)); } catch (err) {}
              }
            }
            const wdSnap = await withClientTimeout(getDocs(collection(db, "withdrawals")), 5000, "getDocs wd reset");
            if (wdSnap && wdSnap.docs) {
              for (const d of wdSnap.docs) {
                try { await deleteDoc(doc(db, "withdrawals", d.id)); } catch (err) {}
              }
            }
          } catch (err) {}
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('zalora_orders');
          localStorage.setItem('zalora_reset_sales', 'true');
        }

        setOrders([]);
        setAdminDashboardData(prev => prev ? ({
          ...prev,
          metrics: {
            ...prev.metrics,
            pendingWDCount: 0,
            pendingWDAmount: 0
          },
          orders: [],
          deposits: [],
          withdrawals: [],
          transactions: []
        }) : null);

        setUserDashboardData(prev => prev ? ({
          ...prev,
          orders: [],
          deposits: [],
          withdrawals: [],
          transactions: []
        }) : null);

        try {
          await fetchDashboardData();
        } catch (err) {}
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`zalora_reset_${category}`);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`zalora_reset_${category}`);
        localStorage.setItem('zalora_db_initialized', 'true');
      }

      if (category === 'members' || category === 'mlm_network') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('zalora_reset_members');
        }
        if (db) {
          try {
            await setDoc(doc(db, "settings", "adminControl"), {
              membersReset: false
            }, { merge: true }).catch(() => {});
          } catch (e) { /* ignore */ }
        }
      }

      await fetch("/api/admin/restore-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, data })
      }).catch(() => {});

      if (category === 'members' && Array.isArray(data)) {
        const restoredUsers: MLMUser[] = data;
        if (db) {
          try {
            const snapshot = await withClientTimeout(getDocs(collection(db, "users")), 5000, "getDocs users restore");
            if (snapshot && snapshot.docs) {
              for (const docSnap of snapshot.docs) {
                const d = docSnap.data();
                if (d.role !== 'admin' && Number(d.id) !== 1 && d.username !== 'admin') {
                  try { await deleteDoc(doc(db, "users", docSnap.id)); } catch (err) {}
                }
              }
            }
            for (const u of restoredUsers) {
              try { await setDoc(doc(db, "users", String(u.id)), u, { merge: true }); } catch (err) {}
            }
          } catch (err) {}
        }
        try { await fetchDashboardData(); } catch (err) {}
        return true;
      }

      if (category === 'web_settings' && data && typeof data === 'object') {
        if (db) {
          try { await setDoc(doc(db, "settings", "system"), data, { merge: true }); } catch (err) {}
        }
        setSystemSettings((prev: any) => ({ ...prev, ...data }));
        try { await fetchDashboardData(); } catch (err) {}
        return true;
      }

      if (category === 'mlm_network' && Array.isArray(data)) {
        if (db) {
          for (const u of data) {
            try { await setDoc(doc(db, "users", String(u.id)), u, { merge: true }); } catch (err) {}
          }
        }
        try { await fetchDashboardData(); } catch (err) {}
        return true;
      }

      if (category === 'sales' && data && typeof data === 'object') {
        const { orders: restOrders, transactions: restTxs, deposits: restDeps, withdrawals: restWds } = data;

        if (db) {
          try {
            const ordSnap = await withClientTimeout(getDocs(collection(db, "orders")), 5000, "getDocs restore orders");
            if (ordSnap && ordSnap.docs) {
              for (const d of ordSnap.docs) { try { await deleteDoc(doc(db, "orders", d.id)); } catch (err) {} }
            }
            const txSnap = await withClientTimeout(getDocs(collection(db, "transactions")), 5000, "getDocs restore tx");
            if (txSnap && txSnap.docs) {
              for (const d of txSnap.docs) { try { await deleteDoc(doc(db, "transactions", d.id)); } catch (err) {} }
            }
            const depSnap = await withClientTimeout(getDocs(collection(db, "deposits")), 5000, "getDocs restore dep");
            if (depSnap && depSnap.docs) {
              for (const d of depSnap.docs) { try { await deleteDoc(doc(db, "deposits", d.id)); } catch (err) {} }
            }
            const wdSnap = await withClientTimeout(getDocs(collection(db, "withdrawals")), 5000, "getDocs restore wd");
            if (wdSnap && wdSnap.docs) {
              for (const d of wdSnap.docs) { try { await deleteDoc(doc(db, "withdrawals", d.id)); } catch (err) {} }
            }

            if (Array.isArray(restOrders)) for (const o of restOrders) { try { await setDoc(doc(db, "orders", String(o.id)), o, { merge: true }); } catch (err) {} }
            if (Array.isArray(restTxs)) for (const t of restTxs) { try { await setDoc(doc(db, "transactions", String(t.id)), t, { merge: true }); } catch (err) {} }
            if (Array.isArray(restDeps)) for (const d of restDeps) { try { await setDoc(doc(db, "deposits", String(d.id)), d, { merge: true }); } catch (err) {} }
            if (Array.isArray(restWds)) for (const w of restWds) { try { await setDoc(doc(db, "withdrawals", String(w.id)), w, { merge: true }); } catch (err) {} }
          } catch (err) {}
        }

        if (Array.isArray(restOrders)) {
          setOrders(restOrders);
        }
        try { await fetchDashboardData(); } catch (err) {}
        return true;
      }

      return false;
    } catch (e) {
      console.error(`Failed to restore ${category}:`, e);
      return false;
    }
  };

  const handleClearMembersReset = async (): Promise<boolean> => {
    try {
      // 1. Clear localStorage flag
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zalora_reset_members');
      }

      // 2. Clear Firestore flag directly (client-side)
      if (db) {
        try {
          await setDoc(doc(db, "settings", "adminControl"), {
            membersReset: false,
            membersResetClearedAt: new Date().toISOString()
          }, { merge: true });
          console.log("✅ [handleClearMembersReset] Firestore flag cleared via client SDK");
        } catch (e) {
          console.warn("⚠️ [handleClearMembersReset] Could not clear Firestore flag:", e);
        }
      }

      // 3. Call API endpoint to clear server-side flag and reload users
      try {
        const res = await fetch("/api/admin/clear-members-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("✅ [handleClearMembersReset] Server flag cleared:", data.message);
        }
      } catch (apiErr) {
        console.warn("⚠️ [handleClearMembersReset] API call failed (may be offline):", apiErr);
      }

      // 4. Refresh dashboard data
      await fetchDashboardData();
      return true;
    } catch (e) {
      console.error("Failed to clear members reset:", e);
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

      if (db) {
        try {
          await setDoc(doc(db, "deposits", String(depositId)), {
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          }, { merge: true });

          // Also sync to matching user order in Firestore
          const ords = await fetchFirestoreOrders();
          const targetDep = userDashboardData?.deposits.find(d => Number(d.id) === Number(depositId));
          const targetUserId = targetDep ? targetDep.user_id : currentUserRef.current?.id;
          if (targetUserId) {
            const matchOrd = ords.find(o => Number(o.user_id) === Number(targetUserId));
            if (matchOrd) {
              await setDoc(doc(db, "orders", String(matchOrd.id)), {
                proof_image: proofImage,
                proof_notes: proofNotes || '',
                proof_submitted_at: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        } catch (fErr) {
          console.warn("Firestore deposit proof setDoc warn:", fErr);
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
          } : d),
          orders: prev.orders ? prev.orders.map(o => {
            return {
              ...o,
              proof_image: proofImage,
              proof_notes: proofNotes || '',
              proof_submitted_at: new Date().toISOString()
            };
          }) : []
        };
      });

      setAdminDashboardData(prev => {
        if (!prev) return null;
        const targetDep = prev.deposits.find(d => Number(d.id) === Number(depositId));
        const uId = targetDep?.user_id;
        return {
          ...prev,
          deposits: prev.deposits.map(d => Number(d.id) === Number(depositId) ? {
            ...d,
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          } : d),
          orders: prev.orders.map(o => uId && Number(o.user_id) === Number(uId) ? {
            ...o,
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          } : o)
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

      if (db) {
        try {
          await setDoc(doc(db, "orders", String(orderId)), {
            proof_image: proofImage,
            proof_notes: proofNotes || '',
            proof_submitted_at: new Date().toISOString()
          }, { merge: true });

          // Also sync to matching user deposit in Firestore
          const deps = await fetchFirestoreDeposits();
          const targetOrd = userDashboardData?.orders.find(o => Number(o.id) === Number(orderId));
          const targetUserId = targetOrd ? targetOrd.user_id : currentUserRef.current?.id;
          if (targetUserId) {
            const matchDep = deps.find(d => Number(d.user_id) === Number(targetUserId));
            if (matchDep) {
              await setDoc(doc(db, "deposits", String(matchDep.id)), {
                proof_image: proofImage,
                proof_notes: proofNotes || '',
                proof_submitted_at: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        } catch (fErr) {
          console.warn("Firestore order proof setDoc warn:", fErr);
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
    if (auth) {
      signOut(auth).catch(() => {});
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
            onLoginClick={openMemberLogin}
            onAdminLoginClick={openAdminLogin}
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
                products={products}
                orders={orders}
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
                onClearMembersReset={handleClearMembersReset}
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
                orders={orders}
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
          LOGIN MODAL POPUP (With Demo Helpers)
          ========================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="login-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-5">
            <button
              id="btn-close-login"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Clean Header Banner */}
            <div className="space-y-1">
              <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                Portal Otentikasi
              </span>
              <h3 className="text-xl font-black text-slate-900">Masuk Akun</h3>
              <p className="text-xs text-slate-500">Silakan masukkan username & kata sandi terdaftar Anda.</p>
            </div>

            {loginError && <p className="bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-200 text-xs font-bold">{loginError}</p>}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block">Username / Email</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username atau email Anda..."
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
                <div className="flex justify-end items-center pt-1">
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
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingLogin ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Memproses Otentikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-blue-400" />
                    <span>Masuk Ke Portal →</span>
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

                {/* Section 5: Pilihan Varian Produk Perdana */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">5. Pilihan Varian Produk Perdana (Gratis Celana Jeans)</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-amber-900 block">Kode Seri Produk *</label>
                      <select
                        value={regProductSeries}
                        onChange={(e) => setRegProductSeries(e.target.value)}
                        className="w-full border border-amber-300 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none bg-white text-slate-800"
                      >
                        <option value="HTR-RAW-01 (Hedtro Raw Denim Premium 15oz)">HTR-RAW-01 (Raw Denim 15oz)</option>
                        <option value="HTR-SELVEDGE-02 (Hedtro Japanese Selvedge Denim 16oz)">HTR-SELVEDGE-02 (Selvedge 16oz)</option>
                        <option value="HTR-SLIM-03 (Hedtro Slim Fit Stretch Denim)">HTR-SLIM-03 (Slim Fit Stretch)</option>
                        <option value="HTR-BLACK-04 (Hedtro Deep Black Matte Denim)">HTR-BLACK-04 (Deep Black Matte)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-amber-900 block">Warna Denim *</label>
                      <select
                        value={regProductColor}
                        onChange={(e) => setRegProductColor(e.target.value)}
                        className="w-full border border-amber-300 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none bg-white text-slate-800"
                      >
                        <option value="Indigo Blue Classic">Indigo Blue Classic</option>
                        <option value="Raw Navy Deep">Raw Navy Deep</option>
                        <option value="Black Matte Denim">Black Matte Denim</option>
                        <option value="Biowash Medium Blue">Biowash Medium Blue</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-amber-900 block">Ukuran Size *</label>
                      <select
                        value={regProductSize}
                        onChange={(e) => setRegProductSize(e.target.value)}
                        className="w-full border border-amber-300 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none bg-white text-slate-800 font-mono font-bold"
                      >
                        {["28", "29", "30", "31", "32", "33", "34", "36", "38"].map(s => (
                          <option key={s} value={s}>Size {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-800 italic">
                    * Celana Jeans Perdana sesuai pilihan varian Seri, Warna & Size di atas akan langsung disiapkan dan dikirimkan oleh tim gudang ke alamat Anda.
                  </p>
                </div>

                {/* Section 6: Structure Placement */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-blue-200/60 pb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">6. Penempatan Tim Afiliasi (Placement)</h4>
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
                  disabled={isSubmittingRegister}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-xs shadow flex items-center justify-center gap-1.5 mt-2"
                >
                  {isSubmittingRegister ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-white animate-spin" /> Mendaftarkan Akun...
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 text-white" /> Daftar Sekarang
                    </>
                  )}
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
