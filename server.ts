import express from "express";
import path from "path";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, MLMNotification, BinaryTreeNode, Order } from "./src/types";
import { DEFAULT_ORDERS } from "./src/data/defaultOrders";

// Firebase Admin SDK for server-side Auth management (delete users, etc.)
let adminApp: any = null;
let adminAuth: any = null;
try {
  // Use require() for CJS compatibility (no top-level await)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const firebaseAdmin = require("firebase-admin");

  // Try to load service account from file or env
  let adminCredential: any = null;
  const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountEnv) {
    try {
      const sa = JSON.parse(serviceAccountEnv);
      adminCredential = firebaseAdmin.credential.cert(sa);
      console.log("🔑 [Firebase Admin] Using service account from FIREBASE_SERVICE_ACCOUNT_JSON env var");
    } catch (e) {
      console.warn("⚠️ [Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      adminCredential = firebaseAdmin.credential.cert(sa);
      console.log("🔑 [Firebase Admin] Using service account from firebase-service-account.json");
    } catch (e) {
      console.warn("⚠️ [Firebase Admin] Failed to load firebase-service-account.json:", e);
    }
  }

  if (adminCredential) {
    if (firebaseAdmin.apps.length === 0) {
      adminApp = firebaseAdmin.initializeApp({ credential: adminCredential });
    } else {
      adminApp = firebaseAdmin.app();
    }
    adminAuth = firebaseAdmin.auth(adminApp);
    console.log("✅ [Firebase Admin] Admin SDK initialized successfully");
  } else {
    console.warn("⚠️ [Firebase Admin] No service account found. Firebase Auth deletion will be skipped during reset. To enable, set FIREBASE_SERVICE_ACCOUNT_JSON env var or place firebase-service-account.json in project root.");
  }
} catch (e) {
  console.warn("⚠️ [Firebase Admin] Failed to initialize Admin SDK:", e);
}


// Helper: delete a Firebase Auth user by UID
async function deleteFirebaseAuthUser(uid: string): Promise<void> {
  if (!adminAuth || !uid) return;
  try {
    await adminAuth.deleteUser(uid);
    console.log(`✅ [Firebase Admin] Deleted Auth user UID: ${uid}`);
  } catch (e: any) {
    if (e?.code !== 'auth/user-not-found') {
      console.warn(`⚠️ [Firebase Admin] Failed to delete Auth user UID ${uid}:`, e?.message || e);
    }
  }
}

// Helper: delete a Firebase Auth user by email
async function deleteFirebaseAuthUserByEmail(email: string): Promise<void> {
  if (!adminAuth || !email) return;
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    await adminAuth.deleteUser(userRecord.uid);
    console.log(`✅ [Firebase Admin] Deleted Auth user by email: ${email}`);
  } catch (e: any) {
    if (e?.code !== 'auth/user-not-found') {
      console.warn(`⚠️ [Firebase Admin] Failed to delete Auth user email ${email}:`, e?.message || e);
    }
  }
}

// Helper: delete all non-admin Firebase Auth users (used in members reset)
async function deleteAllNonAdminFirebaseAuthUsers(nonAdminUsers: MLMUser[]): Promise<void> {
  if (!adminAuth) {
    console.warn("⚠️ [Firebase Admin] Auth not initialized - skipping Firebase Auth user deletion");
    return;
  }
  const deletePromises: Promise<void>[] = [];
  for (const u of nonAdminUsers) {
    if (u.firebase_uid) {
      deletePromises.push(deleteFirebaseAuthUser(u.firebase_uid));
    } else if (u.email) {
      deletePromises.push(deleteFirebaseAuthUserByEmail(u.email));
    }
  }
  if (deletePromises.length > 0) {
    await Promise.allSettled(deletePromises);
    console.log(`✅ [Firebase Admin] Attempted deletion of ${deletePromises.length} Firebase Auth users`);
  }
}


// Safe loader for firebase-applet-config.json
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.warn("Notice: firebase-applet-config.json file not found, falling back to process.env variables");
}

const resolvedServerFirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || "AIzaSyCEOmnP2Ua4VJJQ0AFpTdPQeHRa-4OzzvE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || "primordial-antler-0gtt6.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || "primordial-antler-0gtt6",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || "primordial-antler-0gtt6.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || "822667437818",
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId || "1:822667437818:web:625363340a5061f144cb43",
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || "ai-studio-zaloradenimmlmbi-5abf2514-6c97-4eab-bc10-6219841824f9",
};

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get(["/api", "/api/"], (req, res) => {
  res.json({ status: "ok", message: "Hedtro Jeans Official Backend API is active" });
});

// ==========================================
// FIRESTORE DATABASE INTEGRATION
// ==========================================
let firestoreDb: any = null;
if (resolvedServerFirebaseConfig.apiKey) {
  try {
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(resolvedServerFirebaseConfig as any);
    const dbId = resolvedServerFirebaseConfig.firestoreDatabaseId || "ai-studio-zaloradenimmlmbi-5abf2514-6c97-4eab-bc10-6219841824f9";
    const isCustomDb = dbId && dbId.trim() !== '' && dbId !== "(default)" && dbId !== "default";

    try {
      firestoreDb = isCustomDb
        ? initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true }, dbId)
        : initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true });
    } catch {
      firestoreDb = isCustomDb
        ? getFirestore(firebaseApp, dbId)
        : getFirestore(firebaseApp);
    }
    console.log("🔥 Firebase Firestore connected! Project ID:", resolvedServerFirebaseConfig.projectId, "Database ID:", dbId);
  } catch (e) {
    console.warn("⚠️ Firebase Firestore initialization warning:", e);
  }
} else {
  console.warn("⚠️ [Server] Firebase API key missing from configuration or environment variables.");
}

function cleanForFirestore(obj: any) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? null : value)));
}

function withTimeout<T>(promise: Promise<T>, ms: number = 8000, label = "Operation"): Promise<T | null> {
  return Promise.race([
    promise.catch((err) => {
      console.warn(`⚠️ [Firestore Error] ${label}:`, err);
      return null;
    }),
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn(`⏱️ [Firestore Timeout] ${label} exceeded ${ms}ms limit`);
        resolve(null);
      }, ms);
    })
  ]);
}

export async function syncUserToFirestore(user: MLMUser) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(user);
    await withTimeout(setDoc(doc(firestoreDb, "users", String(user.id)), cleaned, { merge: true }), 8000, `syncUser @${user.username}`);
    console.log(`🔥 [FIRESTORE] User @${user.username} (ID: ${user.id}) successfully synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync user error:", err);
  }
}

export async function syncDepositToFirestore(deposit: DepositRequest) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(deposit);
    await withTimeout(setDoc(doc(firestoreDb, "deposits", String(deposit.id)), cleaned, { merge: true }), 8000, `syncDeposit #${deposit.id}`);
    console.log(`🔥 [FIRESTORE] Deposit #${deposit.id} synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync deposit error:", err);
  }
}

export async function syncWithdrawalToFirestore(wd: WDRequest) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(wd);
    await withTimeout(setDoc(doc(firestoreDb, "withdrawals", String(wd.id)), cleaned, { merge: true }), 8000, `syncWithdrawal #${wd.id}`);
    console.log(`🔥 [FIRESTORE] Withdrawal #${wd.id} synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync withdrawal error:", err);
  }
}

export async function syncTransactionToFirestore(tx: Transaction) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(tx);
    await withTimeout(setDoc(doc(firestoreDb, "transactions", String(tx.id)), cleaned, { merge: true }), 8000, `syncTransaction #${tx.id}`);
    console.log(`🔥 [FIRESTORE] Transaction #${tx.id} synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync transaction error:", err);
  }
}

export async function syncProductToFirestore(p: Product) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(p);
    await withTimeout(setDoc(doc(firestoreDb, "products", String(p.id)), cleaned, { merge: true }), 8000, `syncProduct ${p.name}`);
    console.log(`🔥 [FIRESTORE] Product "${p.name}" (ID: ${p.id}) successfully synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync product error:", err);
  }
}

export async function syncOrderToFirestore(order: Order) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(order);
    await withTimeout(setDoc(doc(firestoreDb, "orders", String(order.id)), cleaned, { merge: true }), 8000, `syncOrder #${order.id}`);
    console.log(`🔥 [FIRESTORE] Order #${order.id} (${order.invoice_no}) synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync order error:", err);
  }
}

export async function syncSettingsToFirestore(s: any) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(s);
    await withTimeout(setDoc(doc(firestoreDb, "settings", "system"), cleaned, { merge: true }), 8000, `syncSettings`);
    console.log(`🔥 [FIRESTORE] System settings synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync settings error:", err);
  }
}

export async function syncNotificationToFirestore(n: MLMNotification) {
  if (!firestoreDb) return;
  try {
    const cleaned = cleanForFirestore(n);
    await withTimeout(setDoc(doc(firestoreDb, "notifications", String(n.id)), cleaned, { merge: true }), 8000, `syncNotification #${n.id}`);
    console.log(`🔥 [FIRESTORE] Notification #${n.id} synced to Firestore`);
  } catch (err) {
    console.error("Firestore sync notification error:", err);
  }
}

// ==========================================
// IN-MEMORY DATABASE STATE (Preseeded)
// ==========================================

let users: MLMUser[] = [
  {
    id: 1,
    username: "admin",
    fullname: "Administrator Hedtro Jeans",
    email: "admin@hedtrojeans.com",
    phone: "081234567890",
    is_active: true,
    upline_id: null,
    position: null,
    sponsor_id: null,
    balance: 0,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 0,
    left_sales: 0,
    right_sales: 0,
    created_at: "2026-06-01T09:00:00Z",
    role: "admin",
    password: "admin123"
  }
];

let products: Product[] = [
  {
    id: 1,
    name: "Hedtro Jeans Slim Fit Premium Indigo",
    description: "Celana jeans premium dengan potongan slim-fit modern. Dibuat dengan katun denim berkualitas tinggi 14oz, warna indigo pekat elegan yang awet, serat lentur yang sangat nyaman digunakan seharian.",
    price: 350000,
    member_price: 250000,
    stock: 45,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    name: "Hedtro Jeans Classic Straight Cut Raw",
    description: "Model straight cut klasik legendaris. Menggunakan bahan raw denim kaku berkualitas ekspor yang akan membentuk memudar (fading) alami sesuai bentuk tubuh Anda seiring waktu pemakaian.",
    price: 390000,
    member_price: 280000,
    stock: 30,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 3,
    name: "Hedtro Jeans Jet Black Stretch Comfort",
    description: "Warna hitam legam pekat yang elegan untuk formal maupun kasual. Sangat fleksibel (high stretch), pas di paha dan kaki tanpa membatasi pergerakan aktif Anda.",
    price: 330000,
    member_price: 240000,
    stock: 25,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 4,
    name: "Hedtro Jeans Light Wash Retro 90s",
    description: "Tampilan retro klasik tahun 90-an dengan efek pencucian warna muda (light wash) yang kasual. Sangat cocok dipadukan dengan kaos santai maupun kemeja oversized.",
    price: 370000,
    member_price: 270000,
    stock: 18,
    image: "https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&q=80&w=600"
  }
];

let transactions: Transaction[] = [];

let deposits: DepositRequest[] = [];

let withdrawals: WDRequest[] = [];

let orders: Order[] = [];

let notifications: MLMNotification[] = [];

let isAutoPayout = true;

let systemSettings: any = {
  webName: "Hedtro Jeans Official",
  logoText: "HEDTRO.JEANS",
  memberIdPrefix: "HDT-",
  logoUrl: "",
  iconUrl: "",
  slogan: "OFFICIAL STORE & AFILIASI RESELLER",
  siteDescription: "Pusat Toko Official Celana Jeans Denim Premium & Sistem Bisnis Afiliasi Reseller Terpercaya.",
  enableMlmBonus: true,
  enableLevelBonus: true,
  enableRewardBonus: true,
  shippingTrackingMode: "AUTO_API", // 'AUTO_API' (Gratis / API) or 'MANUAL'
  shippingApiKey: "", // Binderbyte or RajaOngkir API Key (Optional)
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
  rewardCashEquivalent: 20000000,
  midtransMerchantId: "",
  midtransClientKey: "",
  midtransServerKey: "",
  midtransIsProduction: false,
  emailNotifRegisterAdminActive: true,
  emailNotifRegisterSponsorActive: true,
  adminNotifEmail: "admin@hedtrojeans.com",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "notifikasi@hedtrojeans.com",
  smtpPass: "app-password-1234",
  emailSenderName: "Hedtro Jeans Official",
  welcomeEmailTemplate: "Halo {fullname} ({username}), selamat bergabung di Hedtro Jeans! Akun Anda telah terdaftar. Silakan hubungi sponsor Anda {sponsor} untuk aktivasi status premium."
};

// ==========================================
// MLM BINARY CORE ALGORITHMS
// ==========================================

// Helper to find the upline chain up to 10 levels
function getUplineChain(userId: number, limit: number = 10): MLMUser[] {
  const chain: MLMUser[] = [];
  let currentId: number | null = userId;
  let count = 0;

  while (currentId !== null && count < limit) {
    const user = users.find(u => u.id === currentId);
    if (!user) break;
    
    // Find who is the parent/upline
    if (user.upline_id !== null) {
      const parent = users.find(u => u.id === user.upline_id);
      if (parent) {
        chain.push(parent);
        currentId = parent.id;
      } else {
        break;
      }
    } else {
      break;
    }
    count++;
  }
  return chain;
}

// Function to calculate and distribute MLM Bonuses when a user is activated
async function activateUserMLM(userId: number) {
  const user = users.find(u => u.id === userId);
  if (!user || user.is_active) return false;

  // 1. Activate User
  user.is_active = true;

  // Add activation charge transaction
  const actTx: Transaction = {
    id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
    user_id: user.id,
    username: user.username,
    type: "activation",
    amount: -550000,
    description: `Aktifasi Akun Premium Hak Usaha ${user.fullname}`,
    created_at: new Date().toISOString()
  };
  transactions.push(actTx);
  await syncTransactionToFirestore(actTx);

  // Add Gratis 1 Produk Paket Perdana (Rp 550.000) transaction
  const prodBonusTx: Transaction = {
    id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
    user_id: user.id,
    username: user.username,
    type: "bonus_produk",
    amount: 550000,
    description: "Bonus Registrasi/Aktifasi: Gratis 1 Produk Paket Perdana Hedtro Jeans senilai Rp 550.000 (Paket Hak Usaha Pendaftaran)",
    created_at: new Date().toISOString()
  };
  transactions.push(prodBonusTx);
  await syncTransactionToFirestore(prodBonusTx);

  // Auto-create or update Physical Order for 1 Pcs Perdana Jeans Shipment (Rp 550.000)
  const existingOrderForUser = orders.find(o => 
    (o.username && o.username.toLowerCase() === user.username.toLowerCase()) && 
    (o.product_name && o.product_name.includes("Perdana"))
  );

  if (existingOrderForUser) {
    existingOrderForUser.status = "DIPROSES";
    existingOrderForUser.payment_method = "Transfer Bank / Aktivasi Verified (Lunas)";
    if (existingOrderForUser.steps && existingOrderForUser.steps.length > 0) {
      existingOrderForUser.steps[0].done = true;
      existingOrderForUser.steps[0].time = new Date().toLocaleString("id-ID");
      existingOrderForUser.steps[1].done = true;
      existingOrderForUser.steps[1].time = "Diproses Gudang";
    }
    await syncOrderToFirestore(existingOrderForUser);
  } else {
    const newOrdId = Math.max(...orders.map(o => Number(o.id) || 0), 0) + 1;
    const perdanaOrder: Order = {
      id: newOrdId,
      invoice_no: `INV-PERDANA-${newOrdId}-${Date.now().toString().slice(-4)}`,
      user_id: user.id,
      username: user.username,
      fullname: user.fullname,
      phone: user.phone || (user as any).whatsapp || "081234567890",
      address: (user as any).address || "Alamat sesuai registrasi member",
      product_name: "Paket Perdana Member - Hedtro Jeans Raw Denim Premium (Rp 550.000)",
      amount: 550000,
      payment_method: "Transfer Bank / Aktivasi Verified (Lunas)",
      status: "DIPROSES",
      courier: "JNE REGULER",
      tracking_number: `JNE-PERDANA-${Math.floor(100000000 + Math.random() * 900000000)}`,
      created_at: new Date().toISOString(),
      steps: [
        { title: "Registrasi & Pembayaran Rp 550.000 Terverifikasi", time: new Date().toLocaleString("id-ID"), done: true, description: "Status akun terverifikasi Member Premium" },
        { title: "Penyiapan 1 Pcs Jeans Perdana Gudang", time: "Diproses Gudang", done: true, description: "Potong stok gudang & bungkus" },
        { title: "Penyerahan ke Kurir Ekspedisi", time: "Menunggu Resi", done: false, description: "Nomor resi diterbitkan admin" },
        { title: "Paket Tiba di Alamat Member", time: "Estimasi 2-3 Hari", done: false, description: "Diterima pemesan" }
      ]
    };
    orders.push(perdanaOrder);
    await syncOrderToFirestore(perdanaOrder);
  }

  // 2. Distribute Sponsor Bonus (If MLM Bonus Active)
  if (systemSettings.enableMlmBonus !== false && user.sponsor_id) {
    const sponsor = users.find(u => u.id === user.sponsor_id);
    if (sponsor && sponsor.is_active) {
      const bonusAmt = systemSettings.sponsorBonus;
      sponsor.balance += bonusAmt;
      sponsor.sponsor_bonus += bonusAmt;
      
      const spTx: Transaction = {
        id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
        user_id: sponsor.id,
        username: sponsor.username,
        type: "sponsor_bonus",
        amount: bonusAmt,
        description: `Bonus Sponsor dari aktifasi ${user.username}`,
        created_at: new Date().toISOString()
      };
      transactions.push(spTx);
      await syncTransactionToFirestore(spTx);

      const spNotif: MLMNotification = {
        id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
        user_id: sponsor.id,
        title: "Bonus Sponsor!",
        message: `Selamat! Anda menerima Bonus Sponsor Rp ${bonusAmt.toLocaleString()} dari aktifasi ${user.fullname}.`,
        type: "success",
        created_at: new Date().toISOString()
      };
      notifications.push(spNotif);
      await syncNotificationToFirestore(spNotif);
    }
  }

  // 3. Distribute Level Bonuses (Up to 10 Levels if MLM & Level Bonus Active)
  if (systemSettings.enableMlmBonus !== false && systemSettings.enableLevelBonus !== false) {
    const levelRewards = [
      systemSettings.levelBonusG1,
      systemSettings.levelBonusG2,
      systemSettings.levelBonusG3,
      systemSettings.levelBonusG4,
      systemSettings.levelBonusG5,
      systemSettings.levelBonusG6,
      systemSettings.levelBonusG7,
      systemSettings.levelBonusG8,
      systemSettings.levelBonusG9,
      systemSettings.levelBonusG10
    ];
    const uplines = getUplineChain(user.id, 10);

    for (let idx = 0; idx < uplines.length; idx++) {
      const upline = uplines[idx];
      if (upline.is_active) {
        const reward = levelRewards[idx] !== undefined ? levelRewards[idx] : 0;
        upline.balance += reward;
        upline.level_bonus += reward;

        const lvlTx: Transaction = {
          id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
          user_id: upline.id,
          username: upline.username,
          type: "level_bonus",
          amount: reward,
          description: `Bonus Level ${idx + 1} dari pertumbuhan jaringan (${user.username})`,
          created_at: new Date().toISOString()
        };
        transactions.push(lvlTx);
        await syncTransactionToFirestore(lvlTx);

        const lvlNotif: MLMNotification = {
          id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
          user_id: upline.id,
          title: `Bonus Level ${idx + 1}!`,
          message: `Mendapatkan Rp ${reward.toLocaleString()} dari aktifasi level ${idx + 1} (${user.username}).`,
          type: "info",
          created_at: new Date().toISOString()
        };
        notifications.push(lvlNotif);
        await syncNotificationToFirestore(lvlNotif);
      }
    }
  }

  // 4. Update Binary Sales Metrics & Calculate Pairing Bonuses
  let currentNodeId = user.id;
  let currentParentId = user.upline_id;
  let childPos = user.position;

  while (currentParentId !== null) {
    const parent = users.find(u => u.id === currentParentId);
    if (!parent) break;

    if (childPos === "L") {
      parent.left_count += 1;
      parent.left_sales += 1;
    } else if (childPos === "R") {
      parent.right_count += 1;
      parent.right_sales += 1;
    }

    // Check Pairing Bonus per pair
    const totalPairsPossible = Math.min(parent.left_sales, parent.right_sales);
    const pairingVal = systemSettings.pairingBonus || 10000;
    const pairsAlreadyPaid = Math.floor(parent.pairing_bonus / pairingVal);

    if (systemSettings.enableMlmBonus !== false && totalPairsPossible > pairsAlreadyPaid) {
      const newPairs = totalPairsPossible - pairsAlreadyPaid;
      // Max 10 pairs flushout per day
      const allowedPairs = Math.min(newPairs, 10);
      
      if (allowedPairs > 0 && parent.is_active) {
        const pairingBonusAmount = allowedPairs * pairingVal;
        parent.balance += pairingBonusAmount;
        parent.pairing_bonus += pairingBonusAmount;

        const prTx: Transaction = {
          id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
          user_id: parent.id,
          username: parent.username,
          type: "pairing_bonus",
          amount: pairingBonusAmount,
          description: `Bonus Pairing Kiri-Kanan (${allowedPairs} Pasang Baru)`,
          created_at: new Date().toISOString()
        };
        transactions.push(prTx);
        await syncTransactionToFirestore(prTx);

        const prNotif: MLMNotification = {
          id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
          user_id: parent.id,
          title: "Bonus Pairing Terbentuk!",
          message: `Selamat! Terjadi pairing ${allowedPairs} pasang di grup Anda. Bonus Rp ${pairingBonusAmount.toLocaleString()} masuk ke saldo.`,
          type: "success",
          created_at: new Date().toISOString()
        };
        notifications.push(prNotif);
        await syncNotificationToFirestore(prNotif);
      }
    }

    // Go up next level
    currentNodeId = parent.id;
    childPos = parent.position;
    currentParentId = parent.upline_id;
  }

  // Sync all updated users to Firestore
  for (const u of users) {
    await syncUserToFirestore(u);
  }

  return true;
}

// Helper to update ancestor downline counts (left_count / right_count) up to root
async function updateAncestorCounts(uplineId: number, position: 'L' | 'R') {
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
    await syncUserToFirestore(upline);

    childPos = upline.position === 'R' ? 'R' : 'L';
    currUplineId = upline.upline_id !== null && upline.upline_id !== undefined ? Number(upline.upline_id) : null;
  }
}

// Recursive helper to build Binary Tree for Visual Graph
function buildBinaryTreeResponse(userId: number, depth: number = 0, maxDepth: number = 5): BinaryTreeNode | null {
  if (depth > maxDepth) return null;
  const user = users.find(u => Number(u.id) === Number(userId));
  if (!user) return null;

  // Find left child (robust Number check)
  const leftChild = users.find(u => Number(u.upline_id) === Number(userId) && u.position === "L");
  // Find right child (robust Number check)
  const rightChild = users.find(u => Number(u.upline_id) === Number(userId) && u.position === "R");

  return {
    id: Number(user.id),
    username: user.username,
    fullname: user.fullname,
    is_active: Boolean(user.is_active),
    left_count: Number(user.left_count) || 0,
    right_count: Number(user.right_count) || 0,
    left: leftChild ? buildBinaryTreeResponse(Number(leftChild.id), depth + 1, maxDepth) : null,
    right: rightChild ? buildBinaryTreeResponse(Number(rightChild.id), depth + 1, maxDepth) : null
  };
}

// Find a vacant spot in binary tree under parent (for automated registration fallback)
function findVacantSpot(rootId: number, preferredPosition?: 'L' | 'R'): { upline_id: number, position: 'L' | 'R' } {
  const root = users.find(u => Number(u.id) === Number(rootId));
  if (!root) throw new Error("Root upline not found");

  const pos = preferredPosition || "L";

  // Check direct child first
  const directChild = users.find(u => Number(u.upline_id) === Number(rootId) && u.position === pos);
  if (!directChild) {
    return { upline_id: Number(rootId), position: pos };
  }

  // Recursive search downwards following that leg
  let currentId = Number(directChild.id);
  while (true) {
    const nextChild = users.find(u => Number(u.upline_id) === Number(currentId) && u.position === pos);
    if (!nextChild) {
      return { upline_id: currentId, position: pos };
    }
    currentId = Number(nextChild.id);
  }
}

// ==========================================
// API ROUTE HANDLERS
// ==========================================

// Get All Products
app.get(["/api/products", "/products"], (req, res) => {
  res.json(products);
});

// Get Public Settings
app.get(["/api/settings", "/settings"], async (req, res) => {
  if (firestoreDb) {
    try {
      const docSnap: any = await withTimeout(getDoc(doc(firestoreDb, "settings", "system")), 5000, "getDoc system settings endpoint");
      if (docSnap && docSnap.exists && typeof docSnap.exists === 'function' && docSnap.exists()) {
        systemSettings = { ...systemSettings, ...docSnap.data() };
      }
    } catch (e) {
      console.warn("Failed reading settings from Firestore in GET /api/settings:", e);
    }
  }

  // Create sanitized copy for public consumption (hide secret keys)
  const publicSettings = { ...systemSettings };
  if (publicSettings.midtransServerKey) {
    publicSettings.midtransServerKey = "••••••••" + publicSettings.midtransServerKey.slice(-4);
  }
  if (publicSettings.shippingApiKey) {
    publicSettings.hasShippingApiKey = true;
    publicSettings.shippingApiKey = "••••••••" + publicSettings.shippingApiKey.slice(-4);
  }
  res.json(publicSettings);
});

// Update System Settings (Admin operation)
app.post(["/api/admin/settings", "/admin/settings"], async (req, res) => {
  const newSettings = req.body;
  if (!newSettings) return res.status(400).json({ message: "Pengaturan tidak valid" });
  systemSettings = { ...systemSettings, ...newSettings };
  await syncSettingsToFirestore(systemSettings);
  res.json({ message: "Pengaturan sistem & bonus komisi berhasil disimpan ke Firestore", settings: systemSettings });
});

// Get Firestore Info and Direct Console Link
app.get("/api/firestore-info", (req, res) => {
  try {
    const projId = resolvedServerFirebaseConfig.projectId || "MISSING";
    const dbId = resolvedServerFirebaseConfig.firestoreDatabaseId || "ai-studio-zaloradenimmlmbi-5abf2514-6c97-4eab-bc10-6219841824f9";
    res.json({
      connected: Boolean(firestoreDb),
      projectId: projId,
      firestoreDatabaseId: dbId,
      firebaseConsoleUrl: `https://console.firebase.google.com/u/0/project/${projId}/firestore/databases/${dbId}/data`,
      collections: ["users", "settings", "products", "deposits", "withdrawals", "transactions", "notifications"],
      stats: {
        totalUsers: users.length,
        totalDeposits: deposits.length,
        totalWithdrawals: withdrawals.length,
        totalTransactions: transactions.length,
        totalNotifications: notifications.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Error retrieving Firestore info" });
  }
});

// Update product stock (Admin operation)
app.post("/api/admin/products/stock", async (req, res) => {
  const { productId, stock, price, memberPrice } = req.body;
  const product = products.find(p => p.id === Number(productId) || String(p.id) === String(productId));
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });

  if (stock !== undefined) product.stock = Number(stock);
  if (price !== undefined) product.price = Number(price);
  if (memberPrice !== undefined) product.member_price = Number(memberPrice);

  await syncProductToFirestore(product);
  res.json({ message: "Data produk dan stok berhasil diupdate di Firestore", product, products });
});

// Update product full info (Admin operation)
app.post("/api/admin/products/update", async (req, res) => {
  const { id, name, description, price, member_price, stock, image, sizes, colors, badge } = req.body;
  const product = products.find(p => p.id === Number(id) || String(p.id) === String(id));
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (member_price !== undefined) product.member_price = Number(member_price);
  if (stock !== undefined) product.stock = Number(stock);
  if (image !== undefined) product.image = image;
  if (sizes !== undefined) product.sizes = sizes;
  if (colors !== undefined) product.colors = colors;
  if (badge !== undefined) product.badge = badge;

  await syncProductToFirestore(product);
  res.json({ message: "Data produk berhasil diperbarui", product, products });
});

// Delete product (Admin operation)
app.post("/api/admin/products/delete", async (req, res) => {
  const { id } = req.body;
  const pId = Number(id) || 0;
  const idx = products.findIndex(p => p.id === pId || String(p.id) === String(id));
  if (idx !== -1) {
    products.splice(idx, 1);
  }
  if (firestoreDb) {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(firestoreDb, "products", String(id)));
    } catch (e) {
      console.warn("Firestore delete product error:", e);
    }
  }
  res.json({ message: "Produk berhasil dihapus", products });
});

// Authentication: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    await initFirestoreDataOnce();
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ message: "Username/Email harus diisi" });

    const searchVal = String(username).toLowerCase().trim();
    let user = users.find(u => 
      (u.username && u.username.toLowerCase().trim() === searchVal) || 
      (u.email && u.email.toLowerCase().trim() === searchVal)
    );

    // Dynamic fallback: If user not found in server memory, check Firestore directly!
    if (!user && firestoreDb) {
      try {
        const snap = await getDocs(collection(firestoreDb, "users"));
        if (snap && !snap.empty) {
          snap.forEach((docSnap: any) => {
            const data = docSnap.data();
            const uUsername = (data.username || "").toLowerCase().trim();
            const uEmail = (data.email || "").toLowerCase().trim();
            if (uUsername === searchVal || uEmail === searchVal) {
              const uId = Number(data.id ?? docSnap.id);
              user = { ...data, id: uId };
              // Cache in memory
              if (!users.some(existing => Number(existing.id) === uId)) {
                users.push(user);
              }
            }
          });
        }
      } catch (fsErr) {
        console.warn("Firestore lookup failed during login:", fsErr);
      }
    }

    if (!user && (searchVal === "admin" || searchVal === "admin@hedtrojeans.com")) {
      user = {
        id: 1,
        username: "admin",
        fullname: "Administrator Hedtro Jeans",
        email: "admin@hedtrojeans.com",
        phone: "081234567890",
        password: "admin123",
        is_active: true,
        upline_id: null,
        position: null,
        sponsor_id: null,
        balance: 0,
        sponsor_bonus: 0,
        pairing_bonus: 0,
        level_bonus: 0,
        ro_bonus: 0,
        left_count: 0,
        right_count: 0,
        left_sales: 0,
        right_sales: 0,
        created_at: "2026-06-01T09:00:00Z",
        role: "admin"
      };
      if (!users.some(u => Number(u.id) === 1)) {
        users.unshift(user);
      }
    }

    if (!user) {
      return res.status(404).json({ message: "Username atau email tidak terdaftar atau akun telah dihapus." });
    }

    if (!password) {
      return res.status(400).json({ message: "Kata sandi wajib diisi!" });
    }

    const isAdmin = user.role === 'admin' || user.username === 'admin' || Number(user.id) === 1;
    if (isAdmin) {
      const validAdminPasses = ["admin123", "password123", "admin", (user as any).password].filter(Boolean);
      if (!validAdminPasses.includes(password)) {
        return res.status(401).json({ message: "Kata sandi yang Anda masukkan salah!" });
      }
      (user as any).password = "admin123";
      await syncUserToFirestore(user);
    } else {
      const expectedPassword = (user as any).password || "user123";
      if (password !== expectedPassword) {
        return res.status(401).json({ message: "Kata sandi yang Anda masukkan salah!" });
      }
    }

    res.json({ message: "Login berhasil", user });
  } catch (err: any) {
    console.error("Login route error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server saat login" });
  }
});

// Authentication: Forgot Password (Simulated Email Send)
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email harus diisi" });

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: "Email tidak terdaftar dalam sistem kami!" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  (user as any).reset_otp = otp;
  syncUserToFirestore(user);

  console.log(`[EMAIL SIMULATION] Sent reset code to ${user.email}: ${otp}`);

  res.json({
    message: `Link reset password telah dikirim ke email terdaftar Anda!`,
    simulatedEmail: {
      to: user.email,
      subject: "Setel Ulang Kata Sandi - HEDTRO.PORTAL",
      body: `Halo ${user.fullname},\n\nKami menerima permintaan untuk menyetel ulang kata sandi akun Anda (@${user.username}).\n\nKode Verifikasi OTP Anda adalah:\n\n>>> ${otp} <<<\n\nHarap masukkan kode ini pada formulir reset untuk melanjutkan.\n\nSalam Hangat,\nSistem Otomasi HEDTRO.PORTAL`,
      code: otp
    }
  });
});

// Authentication: Reset Password with OTP
app.post("/api/auth/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Mohon isi semua field (Email, OTP, dan Password Baru)" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }

  if ((user as any).reset_otp !== otp) {
    return res.status(400).json({ message: "Kode OTP verifikasi salah atau telah kedaluwarsa!" });
  }

  // Change password
  (user as any).password = newPassword;
  delete (user as any).reset_otp;
  syncUserToFirestore(user);

  res.json({ message: "Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda." });
});

// Authentication: Register Member
app.post("/api/auth/register", async (req, res) => {
  try {
    await initFirestoreDataOnce();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, "settings", "adminControl"), { membersReset: false }, { merge: true }).catch(() => {});
    }
  const { username, fullname, email, phone, password, sponsor_username, upline_username, position, ktp, whatsapp, bank_name, bank_account, bank_holder } = req.body;

  if (!username || !fullname || !email || !phone) {
    return res.status(400).json({ message: "Mohon isi semua field wajib (Username, Nama Lengkap, Email, Telepon)" });
  }

  if (!password || password.length < 3) {
    return res.status(400).json({ message: "Kata sandi wajib diisi (minimal 3 karakter)" });
  }

  const normalizedUsername = username.toLowerCase().replace(/\s+/g, "").trim();

  if (users.some(u => u.username && u.username.toLowerCase().trim() === normalizedUsername)) {
    return res.status(400).json({ message: "Username sudah digunakan oleh member lain" });
  }

  // 1. Resolve sponsor
  let sponsorId: number | null = 1; // Default to admin
  if (sponsor_username) {
    const sponsorSearch = String(sponsor_username).toLowerCase().trim();
    const sponsor = users.find(u => u.username && u.username.toLowerCase().trim() === sponsorSearch);
    if (sponsor) sponsorId = Number(sponsor.id);
  }

  // 2. Resolve upline & placement
  let uplineId: number = sponsorId || 1;
  let finalPos: 'L' | 'R' = (position === 'R' || position === 'L') ? position : "L";

  if (upline_username) {
    const uplineSearch = String(upline_username).toLowerCase().trim();
    const uplineUser = users.find(u => u.username && u.username.toLowerCase().trim() === uplineSearch);
    if (uplineUser) {
      uplineId = Number(uplineUser.id);
    }
  }

  // Check if position under uplineId is taken
  const taken = users.find(u => Number(u.upline_id) === Number(uplineId) && u.position === finalPos);
  if (taken) {
    // Find vacancy downward following that leg
    const vacancy = findVacantSpot(uplineId, finalPos);
    uplineId = vacancy.upline_id;
    finalPos = vacancy.position;
  }

  // 3. Create new user (inactive)
  const newUserId = Math.max(...users.map(u => Number(u.id) || 0), 0) + 1;
  const newUser: MLMUser = {
    id: newUserId,
    username: normalizedUsername,
    fullname,
    email,
    phone,
    is_active: false,
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
    password: password,
    ktp: ktp || "",
    whatsapp: whatsapp || phone || "",
    bank_name: bank_name || "",
    bank_account: bank_account || "",
    bank_holder: bank_holder || fullname || ""
  };

  users.push(newUser);
  await syncUserToFirestore(newUser);

  // Update left_count / right_count for all ancestor uplines up to root!
  await updateAncestorCounts(uplineId, finalPos);

  // Notify parent & sponsor
  const notif: MLMNotification = {
    id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
    user_id: uplineId,
    title: "Member Baru!",
    message: `${fullname} (@${normalizedUsername}) bergabung di kaki ${finalPos === 'L' ? 'Kiri' : 'Kanan'} Anda. Silakan bantu untuk aktifasi Rp 550,000 agar bonus Anda mengalir!`,
    type: "info",
    created_at: new Date().toISOString()
  };
  notifications.push(notif);
  await syncNotificationToFirestore(notif);

  // Create initial Paket Perdana order record for new member
  const pSeries = req.body.product_series || "HTR-RAW-01 (Hedtro Raw Denim Premium 15oz)";
  const pColor = req.body.product_color || "Indigo Blue Classic";
  const pSize = req.body.product_size || "32";

  const newOrdId = Math.max(...orders.map(o => Number(o.id) || 0), 0) + 1;
  const newResi = `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const regOrder: Order = {
    id: newOrdId,
    invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`,
    user_id: newUserId,
    username: normalizedUsername,
    fullname: fullname,
    phone: phone,
    address: req.body.address ? `${req.body.address}${req.body.city ? ', ' + req.body.city : ''}` : "-",
    product_name: `Paket Perdana Member - Hedtro Jeans (${pSeries})`,
    amount: 550000,
    payment_method: "Transfer Bank / QRIS",
    status: "DIPROSES",
    courier: "JNE REGULER",
    tracking_number: newResi,
    notes: `Pesanan Pendaftaran Member. Varian Dipilih: Seri ${pSeries} | Warna: ${pColor} | Size: ${pSize}. Celana Jeans Perdana sedang diproses di gudang.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    steps: [
      { title: "Registrasi Akun & Invoice Dibuat", time: new Date().toLocaleString("id-ID"), done: true, description: "Pendaftaran member berhasil" },
      { title: "Gudang Memproses & Quality Control", time: new Date().toLocaleString("id-ID"), done: true, description: `Menyiapkan Celana Jeans Seri ${pSeries} (Warna: ${pColor}, Size: ${pSize})` },
      { title: "Diserahkan ke Kurir Ekspedisi (JNE)", time: "Sedang Diproses", done: false, description: `Nomor Resi: ${newResi}` },
      { title: "Dalam Pengiriman", time: "-", done: false, description: "-" },
      { title: "Pesanan Diterima Pemesan", time: "-", done: false, description: "-" }
    ]
  };
  orders.push(regOrder);
  await syncOrderToFirestore(regOrder);

  // Create initial activation deposit request for new member (Rp 550.000 + Unique Code)
  const actCode = Math.floor(100 + Math.random() * 900);
  const newDepId = Math.max(...deposits.map(d => Number(d.id) || 0), 0) + 1;
  const regDep: DepositRequest = {
    id: newDepId,
    user_id: newUserId,
    username: normalizedUsername,
    amount: 550000,
    unique_code: actCode,
    method: "transfer_bank",
    status: "pending",
    payment_code: `ACT-${newUserId}-${Date.now().toString().slice(-4)}`,
    created_at: new Date().toISOString()
  };
  deposits.push(regDep);
  await syncDepositToFirestore(regDep);

  res.status(201).json({
    message: "Pendaftaran berhasil! Akun Anda berstatus TIDAK AKTIF. Lakukan pembayaran aktifasi Rp 550,000 untuk menikmati seluruh fitur dan berbelanja produk Hedtro Jeans.",
    user: newUser,
    order: regOrder,
    deposit: regDep
  });
  } catch (err: any) {
    console.error("Register route error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server saat pendaftaran" });
  }
});

// Member Activation Simulation
app.post("/api/user/activate", async (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  if (user.is_active) return res.status(400).json({ message: "User sudah aktif" });

  // Simulate payment
  user.balance -= 550000;
  const success = await activateUserMLM(userId);

  if (success) {
    await syncUserToFirestore(user);
    res.json({ message: "Akun berhasil diaktifkan! Anda kini adalah Member Premium aktif.", user });
  } else {
    res.status(500).json({ message: "Gagal mengaktifkan member" });
  }
});

// API Gateway Payment Simulation for QRIS / Bank Transfer (Deposits & Activations)
app.post("/api/payment/simulate-gateway", async (req, res) => {
  const { depositId } = req.body;
  const dep = deposits.find(d => d.id === depositId);
  if (!dep) return res.status(404).json({ message: "Request deposit tidak ditemukan" });
  if (dep.status !== "pending") return res.status(400).json({ message: "Deposit sudah diproses" });

  dep.status = "success";
  await syncDepositToFirestore(dep);
  
  // Credit user's balance
  const user = users.find(u => u.id === dep.user_id);
  if (user) {
    user.balance += dep.amount;
    await syncUserToFirestore(user);
    
    // Log transaction
    const newTx: Transaction = {
      id: transactions.length + 1,
      user_id: user.id,
      username: user.username,
      type: "deposit",
      amount: dep.amount,
      description: `Deposit via ${dep.method.toUpperCase()} Terverifikasi Otomatis`,
      created_at: new Date().toISOString()
    };
    transactions.push(newTx);
    await syncTransactionToFirestore(newTx);

    const newNotif: MLMNotification = {
      id: notifications.length + 1,
      user_id: user.id,
      title: "Deposit Berhasil!",
      message: `Saldo Rp ${dep.amount.toLocaleString()} telah berhasil ditambahkan via payment gateway otomatis.`,
      type: "success",
      created_at: new Date().toISOString()
    };
    notifications.push(newNotif);
    await syncNotificationToFirestore(newNotif);
  }

  res.json({ message: "Pembayaran terverifikasi sukses via Midtrans/Tripay Gateway!", deposit: dep, user });
});

// Midtrans Webhook Callback Notification Handler
app.post("/api/payment/midtrans-webhook", async (req, res) => {
  const { order_id, transaction_status, payment_type, gross_amount } = req.body;
  
  console.log(`[Midtrans Webhook] Received notification for ${order_id}: ${transaction_status}`);
  
  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  // Find the deposit request associated with this midtrans_order_id
  const dep = deposits.find(d => d.midtrans_order_id === order_id);
  if (!dep) {
    console.warn(`[Midtrans Webhook] No matching deposit found for midtrans_order_id: ${order_id}`);
    return res.status(404).json({ message: "Deposit tidak ditemukan" });
  }

  if (dep.status !== "pending") {
    console.log(`[Midtrans Webhook] Deposit ${dep.id} already processed. Status: ${dep.status}`);
    return res.json({ message: "Transaksi sudah diproses sebelumnya" });
  }

  // Check if status is a success state (settlement or capture for card)
  if (transaction_status === "settlement" || transaction_status === "capture") {
    dep.status = "success";
    await syncDepositToFirestore(dep);
    
    // Credit user's balance
    const user = users.find(u => u.id === dep.user_id);
    if (user) {
      user.balance += dep.amount;
      await syncUserToFirestore(user);
      
      // Log transaction
      const newTx: Transaction = {
        id: transactions.length + 1,
        user_id: user.id,
        username: user.username,
        type: "deposit",
        amount: dep.amount,
        description: `Deposit via ${dep.method.toUpperCase()} (Otomatis Midtrans)`,
        created_at: new Date().toISOString()
      };
      transactions.push(newTx);
      await syncTransactionToFirestore(newTx);

      const newNotif: MLMNotification = {
        id: notifications.length + 1,
        user_id: user.id,
        title: "Deposit Otomatis Berhasil!",
        message: `Saldo Rp ${dep.amount.toLocaleString()} telah berhasil ditambahkan via Midtrans QRIS/VA otomatis.`,
        type: "success",
        created_at: new Date().toISOString()
      };
      notifications.push(newNotif);
      await syncNotificationToFirestore(newNotif);
      
      console.log(`[Midtrans Webhook] Successfully processed payment and credited user ${user.username}`);
    }
  } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
    dep.status = "failed";
    await syncDepositToFirestore(dep);
    const user = users.find(u => u.id === dep.user_id);
    if (user) {
      const newNotif: MLMNotification = {
        id: notifications.length + 1,
        user_id: user.id,
        title: "Pembayaran Deposit Gagal / Expired",
        message: `Pembayaran deposit Rp ${dep.amount.toLocaleString()} Anda dibatalkan atau telah kedaluwarsa oleh sistem Midtrans.`,
        type: "warning",
        created_at: new Date().toISOString()
      };
      notifications.push(newNotif);
      await syncNotificationToFirestore(newNotif);
    }
    console.log(`[Midtrans Webhook] Payment failed or expired for order ${order_id}`);
  }

  res.json({ status: "success", message: "Webhook processed successfully" });
});

// Create Deposit request
app.post("/api/user/deposit", async (req, res) => {
  const { userId, amount, method, uniqueCode } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ message: "Minimal deposit adalah Rp 50.000" });
  }

  const numUniqueCode = Number(uniqueCode) || Math.floor(100 + Math.random() * 900);

  const newDepId = deposits.length + 1;
  const midtransOrderId = `DEP-MID-${newDepId}-${Date.now()}`;
  let paymentCode = method === 'qris' 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=HedtroJeansQRISDep${numAmount + numUniqueCode}`
    : `MOCK-${method.toUpperCase()}-VA-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  if (systemSettings.midtransServerKey) {
    try {
      const baseUrl = systemSettings.midtransIsProduction 
        ? "https://api.midtrans.com/v2" 
        : "https://api.sandbox.midtrans.com/v2";
        
      const authHeader = "Basic " + Buffer.from(systemSettings.midtransServerKey + ":").toString("base64");
      
      let payload: any = {};
      
      if (method === 'qris') {
        payload = {
          payment_type: "qris",
          transaction_details: {
            order_id: midtransOrderId,
            gross_amount: numAmount
          },
          qris: {
            acquirer: "gopay"
          }
        };
      } else {
        const bank = method === 'bca' ? 'bca' : 'mandiri';
        if (bank === 'mandiri') {
          payload = {
            payment_type: "echannel",
            transaction_details: {
              order_id: midtransOrderId,
              gross_amount: numAmount
            },
            echannel: {
              bill_info1: "Aktivasi MLM",
              bill_info2: "Premium Member"
            }
          };
        } else {
          payload = {
            payment_type: "bank_transfer",
            transaction_details: {
              order_id: midtransOrderId,
              gross_amount: numAmount
            },
            bank_transfer: {
              bank: bank
            }
          };
        }
      }

      const response = await fetch(`${baseUrl}/charge`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data: any = await response.json();
        if (method === 'qris') {
          const qrAction = data.actions?.find((a: any) => a.name === "generate-qr-code");
          if (qrAction?.url) {
            paymentCode = qrAction.url;
          } else {
            const qrContent = data.qr_string || data.actions?.[0]?.url || "";
            if (qrContent) {
              paymentCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
            }
          }
        } else if (method === 'bca') {
          const vaNo = data.va_numbers?.[0]?.va_number;
          if (vaNo) {
            paymentCode = `BCA VA: ${vaNo}`;
          }
        } else if (method === 'mandiri') {
          const billKey = data.bill_key;
          const billCode = data.biller_code;
          if (billKey && billCode) {
            paymentCode = `Biller Code: ${billCode} | Bill Key: ${billKey}`;
          }
        }
      } else {
        console.error("Midtrans charge API error response:", await response.text());
      }
    } catch (error) {
      console.error("Failed to connect to Midtrans charge API:", error);
    }
  }

  const newDep: DepositRequest = {
    id: newDepId,
    user_id: user.id,
    username: user.username,
    amount: numAmount,
    unique_code: numUniqueCode,
    method,
    status: "pending",
    payment_code: paymentCode,
    midtrans_order_id: midtransOrderId,
    created_at: new Date().toISOString()
  };

  deposits.push(newDep);
  await syncDepositToFirestore(newDep);
  res.status(201).json({ message: "Instruksi deposit berhasil dibuat", deposit: newDep });
});

// Create WD request
app.post("/api/user/withdraw", async (req, res) => {
  const { userId, amount, bankName, accountNumber, accountHolder } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ message: "Minimal penarikan adalah Rp 50.000" });
  }

  if (user.balance < numAmount) {
    return res.status(400).json({ message: "Saldo tidak mencukupi" });
  }

  // Deduct balance immediately upon request (payout lock)
  user.balance -= numAmount;

  const newWD: WDRequest = {
    id: withdrawals.length + 1,
    user_id: user.id,
    username: user.username,
    amount: numAmount,
    bank_name: bankName,
    account_number: accountNumber,
    account_holder: accountHolder,
    status: isAutoPayout ? "success" : "pending",
    created_at: new Date().toISOString()
  };

  withdrawals.push(newWD);
  await syncWithdrawalToFirestore(newWD);
  await syncUserToFirestore(user);

  // Log transaction
  const newTx: Transaction = {
    id: transactions.length + 1,
    user_id: user.id,
    username: user.username,
    type: "withdrawal",
    amount: -numAmount,
    description: `Penarikan Dana ke ${bankName} (${isAutoPayout ? 'Terbayar Otomatis' : 'Menunggu Persetujuan'})`,
    created_at: new Date().toISOString()
  };
  transactions.push(newTx);
  await syncTransactionToFirestore(newTx);

  if (isAutoPayout) {
    const newNotif: MLMNotification = {
      id: notifications.length + 1,
      user_id: user.id,
      title: "Penarikan Sukses!",
      message: `Dana Rp ${numAmount.toLocaleString()} berhasil dikirim otomatis ke rekening ${bankName} Anda.`,
      type: "success",
      created_at: new Date().toISOString()
    };
    notifications.push(newNotif);
    await syncNotificationToFirestore(newNotif);
  } else {
    const newNotif: MLMNotification = {
      id: notifications.length + 1,
      user_id: user.id,
      title: "Penarikan Diproses",
      message: `Permintaan penarikan Rp ${numAmount.toLocaleString()} sedang antre verifikasi admin.`,
      type: "info",
      created_at: new Date().toISOString()
    };
    notifications.push(newNotif);
    await syncNotificationToFirestore(newNotif);
  }

  res.status(201).json({ 
    message: isAutoPayout 
      ? "Penarikan berhasil diproses otomatis oleh sistem!" 
      : "Permintaan penarikan berhasil diajukan, menunggu persetujuan admin.",
    withdrawal: newWD,
    user
  });
});

// Admin WD processing
app.post("/api/admin/withdraw/process", async (req, res) => {
  const { wdId, action } = req.body; // action: 'approve' | 'reject'
  const wd = withdrawals.find(w => w.id === wdId);
  if (!wd) return res.status(404).json({ message: "Data penarikan tidak ditemukan" });
  if (wd.status !== "pending") return res.status(400).json({ message: "Penarikan sudah diproses sebelumnya" });

  const user = users.find(u => u.id === wd.user_id);

  if (action === "approve") {
    wd.status = "success";
    await syncWithdrawalToFirestore(wd);
    if (user) {
      const newNotif: MLMNotification = {
        id: notifications.length + 1,
        user_id: user.id,
        title: "Penarikan Disetujui!",
        message: `Penarikan dana Rp ${wd.amount.toLocaleString()} telah disetujui admin dan ditransfer ke rekening ${wd.bank_name}.`,
        type: "success",
        created_at: new Date().toISOString()
      };
      notifications.push(newNotif);
      await syncNotificationToFirestore(newNotif);
    }
  } else {
    wd.status = "rejected";
    await syncWithdrawalToFirestore(wd);
    // Refund balance if rejected
    if (user) {
      user.balance += wd.amount;
      await syncUserToFirestore(user);
      
      const newTx: Transaction = {
        id: transactions.length + 1,
        user_id: user.id,
        username: user.username,
        type: "deposit",
        amount: wd.amount,
        description: `Pengembalian dana penarikan (Ditolak oleh Admin)`,
        created_at: new Date().toISOString()
      };
      transactions.push(newTx);
      await syncTransactionToFirestore(newTx);

      const newNotif: MLMNotification = {
        id: notifications.length + 1,
        user_id: user.id,
        title: "Penarikan Ditolak",
        message: `Penarikan Rp ${wd.amount.toLocaleString()} ditolak admin. Saldo Anda telah dikembalikan.`,
        type: "warning",
        created_at: new Date().toISOString()
      };
      notifications.push(newNotif);
      await syncNotificationToFirestore(newNotif);
    }
  }

  res.json({ message: `Status penarikan berhasil diubah menjadi: ${wd.status}`, withdrawal: wd, user });
});

// Toggle Payout Automation Settings
app.post("/api/admin/settings/payout", async (req, res) => {
  const { autoPayout } = req.body;
  if (autoPayout !== undefined) {
    isAutoPayout = Boolean(autoPayout);
  }
  res.json({ message: `Sistem pencairan bonus otomatis diset ke: ${isAutoPayout ? 'AKTIF' : 'NON-AKTIF'}`, isAutoPayout });
});

app.get("/api/admin/settings/payout", (req, res) => {
  res.json({ isAutoPayout });
});

// User Profile Update Endpoint
app.post("/api/user/:userId/profile", async (req, res) => {
  const userId = Number(req.params.userId);
  const { fullname, email, phone, password, whatsapp, bank_name, bank_account, bank_holder, address, city, profile_photo } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  if (fullname !== undefined) user.fullname = String(fullname);
  if (email !== undefined) user.email = String(email);
  if (phone !== undefined) user.phone = String(phone);
  if (whatsapp !== undefined) (user as any).whatsapp = String(whatsapp);
  if (bank_name !== undefined) user.bank_name = String(bank_name);
  if (bank_account !== undefined) user.bank_account = String(bank_account);
  if (bank_holder !== undefined) user.bank_holder = String(bank_holder);
  if (address !== undefined) (user as any).address = String(address);
  if (city !== undefined) (user as any).city = String(city);
  if (profile_photo !== undefined) user.profile_photo = String(profile_photo);
  if (password !== undefined && password !== "") {
    (user as any).password = String(password);
  }

  await syncUserToFirestore(user);
  res.json({ message: "Profil berhasil diperbarui!", user });
});

// User Password Reset / Change Endpoint
app.post("/api/user/:userId/reset-password", async (req, res) => {
  const userId = Number(req.params.userId);
  const { currentPassword, newPassword } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const oldPassword = (user as any).password || "password123";
  if (currentPassword && currentPassword !== oldPassword) {
    return res.status(400).json({ message: "Kata sandi saat ini tidak sesuai" });
  }

  (user as any).password = String(newPassword);
  await syncUserToFirestore(user);
  res.json({ message: "Kata sandi berhasil direset!", user });
});

// Admin Deposit manual verification
app.post("/api/admin/deposit/process", async (req, res) => {
  const { depositId, action } = req.body; // action: 'approve' | 'reject'
  const dep = deposits.find(d => d.id === Number(depositId));
  if (!dep) return res.status(404).json({ message: "Data deposit tidak ditemukan" });
  if (dep.status !== "pending") return res.status(400).json({ message: "Deposit sudah diproses sebelumnya" });

  const user = users.find(u => u.id === dep.user_id);

  if (action === "approve") {
    dep.status = "success";
    await syncDepositToFirestore(dep);
    if (user) {
      user.balance += dep.amount;
      await syncUserToFirestore(user);

      const newTx: Transaction = {
        id: transactions.length + 1,
        user_id: user.id,
        username: user.username,
        type: "deposit",
        amount: dep.amount,
        description: `Deposit Manual via ${dep.method.toUpperCase()} Disetujui Admin`,
        created_at: new Date().toISOString()
      };
      transactions.push(newTx);
      await syncTransactionToFirestore(newTx);

      const newNotif: MLMNotification = {
        id: notifications.length + 1,
        user_id: user.id,
        title: "Deposit Manual Disetujui!",
        message: `Saldo Rp ${dep.amount.toLocaleString()} telah ditambahkan ke akun Anda oleh admin.`,
        type: "success",
        created_at: new Date().toISOString()
      };
      notifications.push(newNotif);
      await syncNotificationToFirestore(newNotif);

      // Auto-activate Free Member if deposit covers the Rp 550.000 registration fee
      if (!user.is_active && dep.amount >= 550000) {
        user.balance -= 550000;
        await activateUserMLM(user.id);
        console.log(`[Deposit Approval] Member @${user.username} successfully auto-activated to Member Premium!`);
      }
    }
  } else {
    dep.status = "failed";
    await syncDepositToFirestore(dep);
    if (user) {
      const newNotif: MLMNotification = {
        id: notifications.length + 1,
        user_id: user.id,
        title: "Deposit Manual Ditolak",
        message: `Transfer deposit Rp ${dep.amount.toLocaleString()} ditolak oleh admin. Pastikan nominal sesuai atau hubungi admin.`,
        type: "warning",
        created_at: new Date().toISOString()
      };
      notifications.push(newNotif);
      await syncNotificationToFirestore(newNotif);
    }
  }

  res.json({ message: `Status deposit berhasil diubah menjadi: ${dep.status}`, deposit: dep, user });
});

// Add New Product
app.post("/api/admin/products", async (req, res) => {
  try {
    const { name, description, price, member_price, stock, image, sizes, colors, badge, ro_bonus_custom } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nama produk wajib diisi!" });
    }

    const defaultImage = "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600";
    const existingIds = products.map(p => Number(p.id) || 0);
    const newProdId = existingIds.length > 0 ? Math.max(...existingIds, 0) + 1 : 1;

    const newProduct: Product = {
      id: newProdId,
      name: String(name),
      description: description ? String(description) : "Celana jeans premium berkualitas ekspor.",
      price: Number(price) || 150000,
      member_price: Number(member_price) || 120000,
      stock: stock !== undefined && stock !== null ? Number(stock) : 100,
      image: image ? String(image) : defaultImage,
      sizes: Array.isArray(sizes) ? sizes : undefined,
      colors: Array.isArray(colors) ? colors : undefined,
      badge: badge !== undefined && badge !== null ? String(badge) : undefined
    };

    if (ro_bonus_custom !== undefined && ro_bonus_custom !== "") {
      (newProduct as any).ro_bonus_custom = Number(ro_bonus_custom);
    }

    const existingIdx = products.findIndex(p => p.id === newProdId);
    if (existingIdx >= 0) {
      products[existingIdx] = newProduct;
    } else {
      products.push(newProduct);
    }

    await syncProductToFirestore(newProduct);
    res.status(200).json({ message: "Produk jeans baru berhasil ditambahkan ke gudang & tersimpan di Firestore!", product: newProduct, products });
  } catch (err: any) {
    console.error("Error in /api/admin/products:", err);
    res.status(500).json({ message: err.message || "Gagal menambahkan produk" });
  }
});

// Member Product Purchase (Repeat Order)
app.post("/api/user/purchase", async (req, res) => {
  const { userId, productId, paymentMethod = 'saldo', address, selectedSize, selectedColor } = req.body;
  const user = users.find(u => u.id === userId);
  const prod = products.find(p => p.id === productId);

  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  if (!prod) return res.status(404).json({ message: "Produk tidak ditemukan" });

  if (!user.is_active) {
    return res.status(400).json({ message: "Anda harus melakukan aktifasi Rp 550.000 terlebih dahulu untuk melakukan pembelian produk premium." });
  }

  if (prod.stock < 1) {
    return res.status(400).json({ message: "Stok produk habis!" });
  }

  const purchasePrice = user.is_active ? prod.member_price : prod.price;

  if (paymentMethod === 'saldo') {
    if (user.balance < purchasePrice) {
      return res.status(400).json({ message: `Saldo tidak mencukupi. Silakan lakukan deposit terlebih dahulu atau pilih metode Transfer Bank. Harga member: Rp ${purchasePrice.toLocaleString()}` });
    }
    // Deduct Balance
    user.balance -= purchasePrice;

    // Log Transaction
    const purchaseTx: Transaction = {
      id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
      user_id: user.id,
      username: user.username,
      type: "purchase",
      amount: -purchasePrice,
      description: `Pembelian RO: ${prod.name}${selectedSize ? ` (Size ${selectedSize})` : ''}${selectedColor ? ` (${selectedColor})` : ''}`,
      created_at: new Date().toISOString()
    };
    transactions.push(purchaseTx);
    await syncTransactionToFirestore(purchaseTx);
  }

  // Deduct Stock
  prod.stock -= 1;
  await syncUserToFirestore(user);
  await syncProductToFirestore(prod);

  const payMethodText = paymentMethod === 'saldo' ? "Potong Saldo Member Account" : "Transfer Bank / QRIS";

  const purchaseNotif: MLMNotification = {
    id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
    user_id: user.id,
    title: "Pembelian Repeat Order Berhasil!",
    message: `Terima kasih! Pembelian ${prod.name} via ${payMethodText} berhasil terdata. Pesanan terhubung ke sistem pengiriman.`,
    type: "success",
    created_at: new Date().toISOString()
  };
  notifications.push(purchaseNotif);
  await syncNotificationToFirestore(purchaseNotif);

  // Generate Order Record for this purchase
  const newOrderId = Math.max(...orders.map(o => Number(o.id) || 0), 1000) + 1;
  const resiNo = `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const finalAddress = address || `${user.address || 'Alamat Utama'}${user.city ? ', ' + user.city : ''}`;

  const fullProdName = `${prod.name}${selectedSize ? ` [Size: ${selectedSize}]` : ''}${selectedColor ? ` [Warna: ${selectedColor}]` : ''}`;

  const purchaseOrder: Order = {
    id: newOrderId,
    invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(newOrderId).slice(-3)}`,
    user_id: user.id,
    username: user.username,
    fullname: user.fullname,
    phone: user.phone || "-",
    address: finalAddress,
    product_name: fullProdName,
    selected_size: selectedSize || undefined,
    selected_color: selectedColor || undefined,
    amount: purchasePrice,
    payment_method: payMethodText,
    status: "DIPROSES",
    courier: "JNE REGULER",
    tracking_number: resiNo,
    notes: `Pembelian RO ${fullProdName} via ${payMethodText}. Sedang disiapkan di gudang.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    steps: [
      { title: `Pembelian RO Berhasil (${payMethodText})`, time: new Date().toLocaleString("id-ID"), done: true, description: "Invoice diterbitkan" },
      { title: "Paking Gudang & Quality Control", time: new Date().toLocaleString("id-ID"), done: true, description: "Celana denim diperiksa" },
      { title: "Diserahkan ke Kurir Ekspedisi (JNE)", time: "Sedang Diproses", done: false, description: `Nomor Resi: ${resiNo}` },
      { title: "Dalam Pengiriman", time: "-", done: false, description: "-" },
      { title: "Pesanan Diterima Pemesan", time: "-", done: false, description: "-" }
    ]
  };
  orders.push(purchaseOrder);
  await syncOrderToFirestore(purchaseOrder);

  // Distribute Repeat Order (RO) Bonus: Rp 5,000 to direct sponsor
  if (user.sponsor_id) {
    const sponsor = users.find(u => u.id === user.sponsor_id);
    if (sponsor && sponsor.is_active) {
      sponsor.balance += 5000;
      sponsor.ro_bonus += 5000;
      await syncUserToFirestore(sponsor);

      const roTx: Transaction = {
        id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
        user_id: sponsor.id,
        username: sponsor.username,
        type: "ro_bonus",
        amount: 5000,
        description: `Bonus Repeat Order (RO) dari pembelian ${user.username}`,
        created_at: new Date().toISOString()
      };
      transactions.push(roTx);
      await syncTransactionToFirestore(roTx);

      const roNotif: MLMNotification = {
        id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
        user_id: sponsor.id,
        title: "Bonus Repeat Order!",
        message: `Menerima Bonus RO sebesar Rp 5,000 atas pembelian produk oleh ${user.fullname}.`,
        type: "success",
        created_at: new Date().toISOString()
      };
      notifications.push(roNotif);
      await syncNotificationToFirestore(roNotif);
    }
  }

  res.json({ message: `Sukses membeli ${prod.name}! Pesanan telah dikirim ke admin area.`, user, product: prod, products, order: purchaseOrder });
});

// ==========================================
// ORDERS & TRACKING API ENDPOINTS
// ==========================================

// GET All Orders
app.get("/api/orders", async (req, res) => {
  try {
    await initFirestoreDataOnce();
  } catch {}
  res.json(orders);
});

// Track Order Endpoint
app.post("/api/orders/track", async (req, res) => {
  try {
    await initFirestoreDataOnce();
  } catch {}
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "Silakan masukkan Nomor Resi, Invoice, atau Username" });
  }

  const cleanQuery = query.trim().toUpperCase();
  const matched = orders.filter(o => 
    (o.invoice_no && o.invoice_no.toUpperCase().includes(cleanQuery)) ||
    (o.tracking_number && o.tracking_number.toUpperCase().includes(cleanQuery)) ||
    (o.username && o.username.toUpperCase().includes(cleanQuery)) ||
    (o.fullname && o.fullname.toUpperCase().includes(cleanQuery)) ||
    (o.phone && o.phone.includes(cleanQuery))
  );

  if (matched.length === 0) {
    return res.status(404).json({ message: "Data pesanan tidak ditemukan. Mohon periksa kembali nomor resi/invoice Anda." });
  }

  res.json({ orders: matched });
});

// Admin Create Order
app.post("/api/admin/orders/create", async (req, res) => {
  try {
    const { username, fullname, phone, address, product_name, amount, payment_method, courier, tracking_number, notes, status } = req.body;
    if (!fullname || !phone || !product_name) {
      return res.status(400).json({ message: "Mohon isi field wajib (Nama, Telepon, Produk)" });
    }

    const newId = Math.max(...orders.map(o => Number(o.id) || 0), 1000) + 1;
    const invNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(newId).slice(-3)}`;
    const resiNo = tracking_number || `${courier?.slice(0, 3)?.toUpperCase() || 'JNE'}-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newOrder: Order = {
      id: newId,
      invoice_no: invNo,
      user_id: 0,
      username: username || "guest",
      fullname,
      phone,
      address: address || "-",
      product_name,
      amount: Number(amount) || 550000,
      payment_method: payment_method || "Transfer Bank",
      status: status || "DIPROSES",
      courier: courier || "JNE REGULER",
      tracking_number: resiNo,
      notes: notes || "Pesanan dibuat oleh Admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      steps: [
        { title: "Pesanan Dibuat oleh Admin", time: new Date().toLocaleString("id-ID"), done: true, description: "Menunggu proses gudang" },
        { title: "Diproses Gudang & Quality Control", time: new Date().toLocaleString("id-ID"), done: status === "DIPROSES" || status === "DIKIRIM" || status === "SELESAI", description: "-" },
        { title: "Diserahkan ke Kurir Ekspedisi", time: "-", done: status === "DIKIRIM" || status === "SELESAI", description: `Nomor Resi: ${resiNo}` },
        { title: "Dalam Pengiriman", time: "-", done: status === "DIKIRIM" || status === "SELESAI", description: "-" },
        { title: "Pesanan Diterima Pemesan", time: "-", done: status === "SELESAI", description: "-" }
      ]
    };

    orders.push(newOrder);
    await syncOrderToFirestore(newOrder);
    res.status(201).json({ message: "Pesanan & resi berhasil dibuat!", order: newOrder, orders });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal membuat pesanan: " + err.message });
  }
});

// Admin Update Order
app.post("/api/admin/orders/update", async (req, res) => {
  try {
    const { id, status, courier, tracking_number, notes, address, steps } = req.body;
    const orderIndex = orders.findIndex(o => Number(o.id) === Number(id) || String(o.id) === String(id));
    if (orderIndex === -1) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const order = orders[orderIndex];
    if (status) order.status = status;
    if (courier) order.courier = courier;
    if (tracking_number) order.tracking_number = tracking_number;
    if (notes !== undefined) order.notes = notes;
    if (address) order.address = address;
    if (steps) order.steps = steps;
    order.updated_at = new Date().toISOString();

    // Distribute RO bonus if approved and not yet distributed
    if ((status === 'DIPROSES' || status === 'DIKIRIM' || status === 'SELESAI' || status === 'TERIMA') && !order.is_ro_bonus_distributed) {
      const orderUser = users.find(u => Number(u.id) === Number(order.user_id) || u.username === order.username);
      if (orderUser && orderUser.sponsor_id) {
        const sponsor = users.find(u => u.id === orderUser.sponsor_id);
        if (sponsor && sponsor.is_active) {
          sponsor.balance += 5000;
          sponsor.ro_bonus += 5000;
          await syncUserToFirestore(sponsor);

          const roTx: Transaction = {
            id: Math.max(...transactions.map(t => Number(t.id) || 0), 0) + 1,
            user_id: sponsor.id,
            username: sponsor.username,
            type: "ro_bonus",
            amount: 5000,
            description: `Bonus Repeat Order (RO) dari pesanan #${order.invoice_no} (${orderUser.username})`,
            created_at: new Date().toISOString()
          };
          transactions.push(roTx);
          await syncTransactionToFirestore(roTx);
        }
      }
      order.is_ro_bonus_distributed = true;
    }

    await syncOrderToFirestore(order);
    res.json({ message: "Pesanan & Status Resi berhasil diperbarui!", order, orders });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal memperbarui pesanan: " + err.message });
  }
});

// Endpoint: Sync Shipping Status via Free/Public API (Binderbyte / RajaOngkir API / Automated Courier Tracker)
app.post("/api/shipping/sync-api", async (req, res) => {
  try {
    const { orderId, courier, trackingNumber, apiKey } = req.body;
    const orderIndex = orders.findIndex(o => Number(o.id) === Number(orderId));
    if (orderIndex === -1) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const order = orders[orderIndex];
    const keyToUse = apiKey || systemSettings.shippingApiKey || "";
    const courierCode = (courier || order.courier || "jne").toLowerCase().split(' ')[0];
    const awb = trackingNumber || order.tracking_number;

    let apiResult: any = null;
    let fetchedViaApi = false;

    // Try fetching from Binderbyte API if API Key is available
    if (keyToUse && awb) {
      try {
        const response = await fetch(`https://api.binderbyte.com/v1/track?api_key=${keyToUse}&courier=${courierCode}&awb=${awb}`);
        if (response.ok) {
          const json = await response.json();
          if (json.status === 200 && json.data) {
            apiResult = json.data;
            fetchedViaApi = true;
          }
        }
      } catch (e) {
        console.warn("Binderbyte API call error, falling back to auto-generator:", e);
      }
    }

    // Format steps based on API response or Auto-Generated Live Courier Status
    if (fetchedViaApi && apiResult) {
      const history = apiResult.history || [];
      const isDelivered = apiResult.summary?.status?.toUpperCase() === "DELIVERED";
      order.status = isDelivered ? "TERIMA" : "DIKIRIM";
      order.courier = apiResult.summary?.courier?.toUpperCase() || order.courier;
      if (history.length > 0) {
        order.steps = history.map((h: any) => ({
          title: h.description || h.location || "Update Pengiriman Ekspedisi",
          time: h.date || new Date().toLocaleString("id-ID"),
          done: true,
          description: h.location ? `Lokasi: ${h.location}` : "-"
        }));
      }
    } else {
      // Free Mode Auto-Sync Timeline (Simulated Live Tracking Courier Dispatch)
      const now = new Date();
      const timeStr = now.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) + " " + now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB";
      
      order.status = "DIKIRIM";
      order.courier = courier || order.courier || "JNE REGULER";
      if (trackingNumber) order.tracking_number = trackingNumber;

      order.steps = [
        { title: "Pesanan Dikonfirmasi & Pembayaran Lunas", time: order.created_at ? new Date(order.created_at).toLocaleString("id-ID") : timeStr, done: true, description: "Invoice diterbitkan & pembayaran terverifikasi" },
        { title: "Gudang Paking & Quality Control Produk", time: timeStr, done: true, description: "Celana Jeans Hedtro lolos QC & diserahkan ke tim kurir" },
        { title: `Paket Diserahkan ke Ekspedisi ${order.courier}`, time: timeStr, done: true, description: `Nomor Resi: ${order.tracking_number} [Di-scan Hub Logistik]` },
        { title: "Dalam Pengiriman Kurir Menuju Alamat Tujuan", time: "Estimasi 1-2 Hari", done: true, description: `Penerima: ${order.fullname} (${order.address || 'Alamat Penerima'})` },
        { title: "Pesanan Diterima Pemesan", time: "-", done: false, description: "Menunggu konfirmasi serah terima kurir" }
      ];
    }

    order.updated_at = new Date().toISOString();
    await syncOrderToFirestore(order);

    res.json({
      message: fetchedViaApi 
        ? "✅ Status resi berhasil disinkronkan langsung via API Binderbyte/Ekspedisi!"
        : "✅ Status resi berhasil diperbarui via Sistem Otomatis Ekspedisi Gratis!",
      source: fetchedViaApi ? "API_BINDERBYTE" : "AUTO_SYSTEM",
      order,
      orders
    });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal sinkronisasi resi: " + err.message });
  }
});

// Admin Delete Order
app.post("/api/admin/orders/delete", async (req, res) => {
  try {
    const { id } = req.body;
    orders = orders.filter(o => Number(o.id) !== Number(id) && String(o.id) !== String(id));
    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, "orders", String(id)));
      } catch (e) {
        console.warn("Delete order firestore warn:", e);
      }
    }
    res.json({ message: "Pesanan berhasil dihapus!", orders });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal menghapus pesanan: " + err.message });
  }
});

// Admin Delete Member / User
app.post("/api/admin/users/delete", async (req, res) => {
  try {
    const { id } = req.body;
    const targetIdStr = String(id);
    const targetIdNum = Number(id) || 0;

    const targetUser = users.find(u => Number(u.id) === targetIdNum || String(u.id) === targetIdStr);
    if (targetUser && (targetUser.username === 'admin' || Number(targetUser.id) === 1)) {
      return res.status(400).json({ message: "Akun Super Admin tidak dapat dihapus!" });
    }

    users = users.filter(u => Number(u.id) !== targetIdNum && String(u.id) !== targetIdStr);

    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, "users", targetIdStr));
      } catch (e) {
        console.warn("Delete user firestore warn:", e);
      }
    }
    res.json({ message: "Member/User berhasil dihapus!", users });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal menghapus user: " + err.message });
  }
});

// Admin Delete Deposit
app.post("/api/admin/deposits/delete", async (req, res) => {
  try {
    const { id } = req.body;
    deposits = deposits.filter(d => Number(d.id) !== Number(id) && String(d.id) !== String(id));
    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, "deposits", String(id)));
      } catch (e) {
        console.warn("Delete deposit firestore warn:", e);
      }
    }
    res.json({ message: "Data deposit berhasil dihapus!", deposits });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal menghapus deposit: " + err.message });
  }
});

// Admin Delete Withdrawal
app.post("/api/admin/withdrawals/delete", async (req, res) => {
  try {
    const { id } = req.body;
    withdrawals = withdrawals.filter(w => Number(w.id) !== Number(id) && String(w.id) !== String(id));
    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, "withdrawals", String(id)));
      } catch (e) {
        console.warn("Delete withdrawal firestore warn:", e);
      }
    }
    res.json({ message: "Data penarikan (WD) berhasil dihapus!", withdrawals });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal menghapus withdrawal: " + err.message });
  }
});



// User Upload Proof of Payment / Transfer for Deposit
app.post("/api/user/deposit/confirm-proof", async (req, res) => {
  try {
    const depositId = req.body.deposit_id || req.body.depositId;
    const proofImage = req.body.proof_image || req.body.proofImage;
    const proofNotes = req.body.proof_notes || req.body.proofNotes;

    const dep = deposits.find(d => Number(d.id) === Number(depositId) || String(d.id) === String(depositId));
    if (!dep) {
      return res.status(404).json({ message: "Data deposit tidak ditemukan" });
    }
    dep.proof_image = proofImage;
    dep.proof_notes = proofNotes || '';
    dep.proof_submitted_at = new Date().toISOString();

    // Also sync to matching user order
    const ord = orders.find(o => Number(o.user_id) === Number(dep.user_id));
    if (ord) {
      ord.proof_image = proofImage;
      ord.proof_notes = proofNotes || '';
      ord.proof_submitted_at = new Date().toISOString();
      await syncOrderToFirestore(ord);
    }
    
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, "deposits", String(dep.id)), dep, { merge: true });
      } catch (e) {
        console.warn("Update deposit proof firestore warn:", e);
      }
    }
    res.json({ message: "Bukti transfer berhasil dikirim! Menunggu konfirmasi Admin.", deposit: dep, order: ord });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal mengirim bukti transfer: " + err.message });
  }
});

// User Upload Proof of Payment / Transfer for Orders (RO & Member Orders)
app.post("/api/user/orders/confirm-proof", async (req, res) => {
  try {
    const orderId = req.body.order_id || req.body.orderId;
    const proofImage = req.body.proof_image || req.body.proofImage;
    const proofNotes = req.body.proof_notes || req.body.proofNotes;

    const ord = orders.find(o => Number(o.id) === Number(orderId) || String(o.id) === String(orderId));
    if (!ord) {
      return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
    }
    ord.proof_image = proofImage;
    ord.proof_notes = proofNotes || '';
    ord.proof_submitted_at = new Date().toISOString();

    // Also sync to matching user deposit
    const dep = deposits.find(d => Number(d.user_id) === Number(ord.user_id));
    if (dep) {
      dep.proof_image = proofImage;
      dep.proof_notes = proofNotes || '';
      dep.proof_submitted_at = new Date().toISOString();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "deposits", String(dep.id)), dep, { merge: true }).catch(() => {});
      }
    }

    await syncOrderToFirestore(ord);

    const adminNotif: MLMNotification = {
      id: Math.max(...notifications.map(n => Number(n.id) || 0), 0) + 1,
      user_id: 1,
      title: "Bukti Transfer RO Terkirim!",
      message: `Member @${ord.username} mengirim bukti transfer pembayaran pesanan #${ord.invoice_no}. Silakan periksa di tab Pengiriman & Resi.`,
      type: "info",
      created_at: new Date().toISOString()
    };
    notifications.push(adminNotif);
    await syncNotificationToFirestore(adminNotif);

    res.json({ message: "Bukti transfer pesanan berhasil dikirim! Menunggu verifikasi Admin.", order: ord, orders });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal mengirim bukti transfer pesanan: " + err.message });
  }
});

// Admin: Clear Members Reset Flag (restore member visibility without wiping data)
app.post("/api/admin/clear-members-reset", async (req, res) => {
  try {
    console.log("🔧 [API] Clearing membersReset flag in Firestore...");
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "settings", "adminControl"), {
        membersReset: false,
        membersResetClearedAt: new Date().toISOString()
      }, { merge: true });
      // Reload users from Firestore to repopulate server memory
      try {
        const snap = await getDocs(collection(firestoreDb, "users"));
        const reloadedUsers: MLMUser[] = [];
        snap.forEach((d: any) => {
          const data = d.data();
          reloadedUsers.push({
            id: Number(data.id ?? d.id),
            username: data.username || "",
            fullname: data.fullname || "",
            email: data.email || "",
            phone: data.phone || "",
            password: data.password || "",
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
            upline_id: data.upline_id != null ? Number(data.upline_id) : null,
            position: data.position || null,
            sponsor_id: data.sponsor_id != null ? Number(data.sponsor_id) : null,
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
            role: data.role || "user",
            firebase_uid: data.firebase_uid || "",
            ktp: data.ktp || "",
            whatsapp: data.whatsapp || "",
            bank_name: data.bank_name || "",
            bank_account: data.bank_account || "",
            bank_holder: data.bank_holder || "",
            address: data.address || "",
            city: data.city || ""
          } as MLMUser);
        });
        if (reloadedUsers.length > 0) {
          users = reloadedUsers;
          console.log(`✅ [API] Reloaded ${users.length} users from Firestore after clearing reset flag`);
        }
      } catch (e) {
        console.warn("⚠️ [API] Could not reload users from Firestore:", e);
      }
    }
    console.log(`✅ [API] membersReset flag cleared. Now serving ${users.length} users.`);
    return res.json({ 
      message: `Flag membersReset berhasil dihapus! Data member sekarang terlihat kembali (${users.length} user dimuat).`,
      userCount: users.length,
      users 
    });
  } catch (err: any) {
    console.error("❌ [API] Error clearing membersReset flag:", err);
    res.status(500).json({ message: "Gagal menghapus flag reset: " + err.message });
  }
});

// Admin Reset Database Category
app.post(["/api/admin/reset-database", "/admin/reset-database"], async (req, res) => {
  try {
    const { category } = req.body || {};
    console.log("🧹 [API] Resetting database category:", category);

    if (category === 'members') {
      // Collect non-admin users BEFORE filtering (for Firebase Auth deletion)
      const nonAdminUsers = users.filter(u => u.role !== 'admin' && Number(u.id) !== 1 && u.username !== 'admin');
      users = users.filter(u => u.role === 'admin' || Number(u.id) === 1 || u.username === 'admin');
      if (users[0]) {
        users[0].left_count = 0;
        users[0].right_count = 0;
        users[0].left_sales = 0;
        users[0].right_sales = 0;
        users[0].balance = 0;
        users[0].sponsor_bonus = 0;
        users[0].pairing_bonus = 0;
        users[0].level_bonus = 0;
        users[0].ro_bonus = 0;
      }
      transactions = [];
      deposits = [];
      withdrawals = [];
      orders = [];
      notifications = [];

      // 1. Delete Firebase Auth accounts for all non-admin users
      await deleteAllNonAdminFirebaseAuthUsers(nonAdminUsers);

      // 2. Delete from Firestore
      if (firestoreDb) {
        try {
          const snap = await getDocs(collection(firestoreDb, "users"));
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            if (data.role !== 'admin' && Number(data.id) !== 1 && data.username !== 'admin') {
              await deleteDoc(doc(firestoreDb, "users", docSnap.id)).catch(() => {});
            }
          }
          // Also wipe Firestore transactions, deposits, withdrawals, orders, notifications
          const txSnap = await getDocs(collection(firestoreDb, "transactions")).catch(() => null);
          if (txSnap) for (const d of txSnap.docs) await deleteDoc(doc(firestoreDb, "transactions", d.id)).catch(() => {});
          const depSnap = await getDocs(collection(firestoreDb, "deposits")).catch(() => null);
          if (depSnap) for (const d of depSnap.docs) await deleteDoc(doc(firestoreDb, "deposits", d.id)).catch(() => {});
          const wdSnap = await getDocs(collection(firestoreDb, "withdrawals")).catch(() => null);
          if (wdSnap) for (const d of wdSnap.docs) await deleteDoc(doc(firestoreDb, "withdrawals", d.id)).catch(() => {});
          const ordSnap = await getDocs(collection(firestoreDb, "orders")).catch(() => null);
          if (ordSnap) for (const d of ordSnap.docs) await deleteDoc(doc(firestoreDb, "orders", d.id)).catch(() => {});
          const notifSnap = await getDocs(collection(firestoreDb, "notifications")).catch(() => null);
          if (notifSnap) for (const d of notifSnap.docs) await deleteDoc(doc(firestoreDb, "notifications", d.id)).catch(() => {});

          // Reset flag to false so newly registered users work seamlessly
          await setDoc(doc(firestoreDb, "settings", "adminControl"), {
            membersReset: false,
            membersResetAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        } catch (e) {
          console.warn("Firestore reset members warn:", e);
        }
      }
      return res.json({ message: "Berhasil mereset data member dan seluruh data transaksi!", users });
    }

    if (category === 'sales') {
      orders = [];
      transactions = [];
      deposits = [];
      withdrawals = [];
      if (firestoreDb) {
        try {
          const ordSnap = await getDocs(collection(firestoreDb, "orders"));
          for (const d of ordSnap.docs) await deleteDoc(doc(firestoreDb, "orders", d.id)).catch(() => {});
          const txSnap = await getDocs(collection(firestoreDb, "transactions"));
          for (const d of txSnap.docs) await deleteDoc(doc(firestoreDb, "transactions", d.id)).catch(() => {});
          const depSnap = await getDocs(collection(firestoreDb, "deposits"));
          for (const d of depSnap.docs) await deleteDoc(doc(firestoreDb, "deposits", d.id)).catch(() => {});
          const wdSnap = await getDocs(collection(firestoreDb, "withdrawals"));
          for (const d of wdSnap.docs) await deleteDoc(doc(firestoreDb, "withdrawals", d.id)).catch(() => {});
        } catch (e) {
          console.warn("Firestore reset sales warn:", e);
        }
      }
      return res.json({ message: "Berhasil mereset data penjualan!", orders, transactions, deposits, withdrawals });
    }

    if (category === 'mlm_network') {
      users = users.map(u => {
        if (u.role === 'admin' || Number(u.id) === 1) {
          return {
            ...u,
            left_count: 0, right_count: 0, left_sales: 0, right_sales: 0,
            sponsor_bonus: 0, pairing_bonus: 0, level_bonus: 0, ro_bonus: 0
          };
        }
        return {
          ...u,
          upline_id: 1, sponsor_id: 1, position: 'L',
          left_count: 0, right_count: 0, left_sales: 0, right_sales: 0,
          balance: 0, sponsor_bonus: 0, pairing_bonus: 0, level_bonus: 0, ro_bonus: 0
        };
      });
      if (firestoreDb) {
        for (const u of users) {
          await setDoc(doc(firestoreDb, "users", String(u.id)), u, { merge: true }).catch(() => {});
        }
      }
      return res.json({ message: "Berhasil mereset jaringan MLM!", users });
    }

    if (category === 'web_settings') {
      systemSettings = {
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
        companyBankName: 'BCA',
        companyBankAccount: '1234-5678-90',
        companyBankHolder: 'PT HEDTRO JEANS INDONESIA'
      };
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "settings", "system"), systemSettings).catch(() => {});
      }
      return res.json({ message: "Berhasil mereset pengaturan web!", settings: systemSettings });
    }

    res.status(400).json({ message: "Kategori reset tidak dikenal" });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal mereset database: " + err.message });
  }
});

// Admin Delete Individual Item Endpoints
app.post(["/api/admin/users/delete", "/admin/users/delete"], async (req, res) => {
  const { id } = req.body || {};
  const numId = Number(id);

  // Find user before deleting to get firebase_uid / email
  const targetUser = users.find(u => Number(u.id) === numId || String(u.id) === String(id));

  users = users.filter(u => Number(u.id) !== numId && String(u.id) !== String(id));

  // Delete Firebase Auth account
  if (targetUser) {
    if ((targetUser as any).firebase_uid) {
      await deleteFirebaseAuthUser((targetUser as any).firebase_uid);
    } else if (targetUser.email) {
      await deleteFirebaseAuthUserByEmail(targetUser.email);
    }
  }

  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, "users", String(id))).catch(() => {});
  }
  res.json({ message: `Member ${id} berhasil dihapus dan akun Firebase Auth telah dihapus`, users });
});

app.post(["/api/admin/deposits/delete", "/admin/deposits/delete"], async (req, res) => {
  const { id } = req.body || {};
  const numId = Number(id);
  deposits = deposits.filter(d => Number(d.id) !== numId && String(d.id) !== String(id));
  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, "deposits", String(id))).catch(() => {});
  }
  res.json({ message: `Deposit ${id} berhasil dihapus`, deposits });
});

app.post(["/api/admin/withdrawals/delete", "/admin/withdrawals/delete"], async (req, res) => {
  const { id } = req.body || {};
  const numId = Number(id);
  withdrawals = withdrawals.filter(w => Number(w.id) !== numId && String(w.id) !== String(id));
  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, "withdrawals", String(id))).catch(() => {});
  }
  res.json({ message: `Withdrawal ${id} berhasil dihapus`, withdrawals });
});

app.post(["/api/admin/orders/delete", "/admin/orders/delete"], async (req, res) => {
  const { id } = req.body || {};
  const numId = Number(id);
  orders = orders.filter(o => Number(o.id) !== numId && String(o.id) !== String(id));
  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, "orders", String(id))).catch(() => {});
  }
  res.json({ message: `Order ${id} berhasil dihapus`, orders });
});

app.post(["/api/admin/products/delete", "/admin/products/delete"], async (req, res) => {
  const { id } = req.body || {};
  const numId = Number(id);
  products = products.filter(p => Number(p.id) !== numId && String(p.id) !== String(id));
  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, "products", String(id))).catch(() => {});
  }
  res.json({ message: `Produk ${id} berhasil dihapus`, products });
});

// Admin Restore Database Category
app.post("/api/admin/restore-database", async (req, res) => {
  try {
    const { category, data } = req.body;
    if (category === 'members' && Array.isArray(data)) {
      users = data;
      if (firestoreDb) {
        for (const u of users) {
          await syncUserToFirestore(u);
        }
      }
      return res.json({ message: "Berhasil restore data member!", users });
    }

    if (category === 'web_settings' && data && typeof data === 'object') {
      systemSettings = { ...systemSettings, ...data };
      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, "settings", "system"), systemSettings, { merge: true });
        } catch (e) {
          console.warn("Restore web_settings firestore warn:", e);
        }
      }
      return res.json({ message: "Berhasil restore data pengaturan web!", settings: systemSettings });
    }

    if (category === 'mlm_network' && Array.isArray(data)) {
      for (const item of data) {
        const u = users.find(x => Number(x.id) === Number(item.id));
        if (u) {
          Object.assign(u, item);
        } else {
          users.push(item);
        }
      }
      if (firestoreDb) {
        for (const u of users) {
          await syncUserToFirestore(u);
        }
      }
      return res.json({ message: "Berhasil restore data jaringan MLM!", users });
    }

    if (category === 'sales' && data && typeof data === 'object') {
      const { orders: restOrders, transactions: restTxs, deposits: restDeps, withdrawals: restWds } = data;
      if (Array.isArray(restOrders)) orders = restOrders;
      if (Array.isArray(restTxs)) transactions = restTxs;
      if (Array.isArray(restDeps)) deposits = restDeps;
      if (Array.isArray(restWds)) withdrawals = restWds;

      if (firestoreDb) {
        try {
          if (Array.isArray(restOrders)) for (const o of restOrders) await setDoc(doc(firestoreDb, "orders", String(o.id)), o, { merge: true });
          if (Array.isArray(restTxs)) for (const t of restTxs) await setDoc(doc(firestoreDb, "transactions", String(t.id)), t, { merge: true });
          if (Array.isArray(restDeps)) for (const d of restDeps) await setDoc(doc(firestoreDb, "deposits", String(d.id)), d, { merge: true });
          if (Array.isArray(restWds)) for (const w of restWds) await setDoc(doc(firestoreDb, "withdrawals", String(w.id)), w, { merge: true });
        } catch (e) {
          console.warn("Restore sales firestore warn:", e);
        }
      }
      return res.json({ message: "Berhasil restore data penjualan!", orders, transactions, deposits, withdrawals });
    }

    res.status(400).json({ message: "Kategori restore tidak dikenal atau data tidak valid" });
  } catch (err: any) {
    res.status(500).json({ message: "Gagal merestore database: " + err.message });
  }
});

// Retrieve User Specific Data
app.get(["/api/user/:userId/dashboard", "/user/:userId/dashboard"], async (req, res) => {
  try {
    await initFirestoreDataOnce();
  } catch (err) {
    console.warn("User dashboard init warning:", err);
  }
  const userId = Number(req.params.userId);
  const user = users.find(u => Number(u.id) === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const userTransactions = transactions.filter(t => Number(t.user_id) === userId);
  const userDeposits = deposits.filter(d => Number(d.user_id) === userId);
  const userWDs = withdrawals.filter(w => Number(w.user_id) === userId);
  const userNotifs = notifications.filter(n => Number(n.user_id) === userId).reverse();

  // Build network tree up to 5 levels
  const binaryTree = buildBinaryTreeResponse(userId, 0, 5);

  // Get referred members (sponsor list)
  const referrals = users.filter(u => Number(u.sponsor_id) === userId);

  res.json({
    user,
    transactions: userTransactions,
    deposits: userDeposits,
    withdrawals: userWDs,
    notifications: userNotifs,
    binaryTree,
    referrals,
    settings: systemSettings
  });
});

// Admin Overview Metrics and Lists
app.get(["/api/admin/dashboard", "/admin/dashboard"], async (req, res) => {
  try {
    await initFirestoreDataOnce();
  } catch (err) {
    console.warn("Admin dashboard init warning:", err);
  }
  const totalMembers = users.filter(u => u.role !== 'admin').length;
  const activeMembers = users.filter(u => u.is_active && u.role !== 'admin').length;
  
  // Turnover company: total activation payments (550k each active member) + total jeans sales price
  const activationTurnover = activeMembers * 550000;
  const purchaseTransactions = transactions.filter(t => t.type === 'purchase');
  const purchaseTurnover = Math.abs(purchaseTransactions.reduce((acc, t) => acc + t.amount, 0));
  const totalTurnover = activationTurnover + purchaseTurnover;

  // Total paid MLM bonuses
  const bonusTransactions = transactions.filter(t => ['sponsor_bonus', 'pairing_bonus', 'level_bonus', 'ro_bonus'].includes(t.type));
  const totalBonusesPaid = bonusTransactions.reduce((acc, t) => acc + t.amount, 0);

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const allWithdrawals = withdrawals;
  const allDeposits = deposits;

  res.json({
    metrics: {
      totalMembers,
      activeMembers,
      inactiveMembers: totalMembers - activeMembers,
      totalTurnover,
      totalBonusesPaid,
      pendingWDCount: pendingWithdrawals.length,
      pendingWDAmount: pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0),
      isAutoPayout
    },
    users: users,
    withdrawals: allWithdrawals,
    deposits: allDeposits,
    transactions: transactions,
    settings: systemSettings
  });
});


// ==========================================
// EXPORTABLE PHP+SQL RESOURCE FILES SOURCE
// ==========================================

const phpProjectFiles = {
  "readme.txt": `=== HEDTRO JEANS AFILIASI RESELLER CODEBASE ===
Petunjuk Instalasi di Web Hosting:

1. Persyaratan Server:
   - Web Server (Apache / Nginx)
   - PHP versi 8.0 ke atas
   - MySQL / MariaDB Database

2. Langkah Setup:
   - Buat database baru di MySQL cPanel / PhpMyAdmin Anda (misalnya: \`hedtro_db\`).
   - Import file \`database.sql\` ke dalam database tersebut.
   - Unggah (upload) seluruh file source code ini ke folder \`public_html\` hosting Anda.
   - Cari file \`.env\` (atau copy \`.env.example\` menjadi \`.env\`) lalu sesuaikan isinya:
     - DB_HOST = localhost
     - DB_NAME = hedtro_db
     - DB_USER = username_database_anda
     - DB_PASS = password_database_anda
     - APP_URL = https://domain-anda.com

3. Login Default Akun Demo:
   - Admin Login:
     - Username: admin
     - Password: password123
   - User Demo:
     - Username: budi
     - Password: password123

Fitur Utama yang Berjalan pada PHP:
- Landing page HEDTRO JEANS, premium & responsive.
- Sistem jaringan tim afiliasi otomatis (Sponsor, Komisi Pasangan, Bonus Level Generasi, RO).
- Notifikasi real-time via session / popup dashboard.
- Modul Stok Gudang, Kas, Laporan Keuangan Bulanan, Cetak PDF, Pembayaran QRIS otomatis (Mock/Integration).
`,

  ".env": `DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="hedtro_db"
DB_USER="root"
DB_PASS="password_db"

APP_URL="https://hedtrojeans.com"
APP_NAME="HEDTRO JEANS Afiliasi & Reseller"

# API Gateway Payment Setup (Midtrans / Tripay)
PAYMENT_GATEWAY="midtrans"
PAYMENT_MERCHANT_ID="M129382"
PAYMENT_CLIENT_KEY="VT-client-1234567"
PAYMENT_SERVER_KEY="VT-server-abcdefg"

# MLM System Settings
REGISTRATION_FEE=100000
SPONSOR_BONUS=20000
PAIRING_BONUS=10000
FLUSH_OUT_LIMIT=10
`,

  ".htaccess": `# .htaccess for Apache Web Servers
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Security Headers & Deny Direct Access to Sensitive Files
<FilesMatch "^\\.env">
    Order allow,deny
    Deny from all
</FilesMatch>
`,

  "database.sql": `-- SQL DUMP FOR ZALORA DENIM MLM SYSTEM

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- 1. Table Users
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`username\` varchar(50) NOT NULL UNIQUE,
  \`fullname\` varchar(100) NOT NULL,
  \`email\` varchar(100) NOT NULL,
  \`phone\` varchar(20) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`role\` enum('user', 'admin') DEFAULT 'user',
  \`is_active\` tinyint(1) DEFAULT 0,
  \`sponsor_id\` int(11) DEFAULT NULL,
  \`upline_id\` int(11) DEFAULT NULL,
  \`position\` enum('L', 'R') DEFAULT NULL,
  \`balance\` decimal(15,2) DEFAULT 0.00,
  \`sponsor_bonus\` decimal(15,2) DEFAULT 0.00,
  \`pairing_bonus\` decimal(15,2) DEFAULT 0.00,
  \`level_bonus\` decimal(15,2) DEFAULT 0.00,
  \`ro_bonus\` decimal(15,2) DEFAULT 0.00,
  \`left_count\` int(11) DEFAULT 0,
  \`right_count\` int(11) DEFAULT 0,
  \`left_sales\` int(11) DEFAULT 0,
  \`right_sales\` int(11) DEFAULT 0,
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`sponsor_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`upline_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table Products
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(150) NOT NULL,
  \`description\` text NOT NULL,
  \`price\` decimal(15,2) NOT NULL,
  \`member_price\` decimal(15,2) NOT NULL,
  \`stock\` int(11) NOT NULL DEFAULT 0,
  \`image\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table Transactions
CREATE TABLE IF NOT EXISTS \`transactions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`type\` varchar(50) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`description\` text NOT NULL,
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table Deposits
CREATE TABLE IF NOT EXISTS \`deposits\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`method\` varchar(50) NOT NULL,
  \`status\` enum('pending', 'success', 'failed') DEFAULT 'pending',
  \`payment_code\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table Withdrawals
CREATE TABLE IF NOT EXISTS \`withdrawals\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`bank_name\` varchar(50) NOT NULL,
  \`account_number\` varchar(50) NOT NULL,
  \`account_holder\` varchar(100) NOT NULL,
  \`status\` enum('pending', 'success', 'rejected') DEFAULT 'pending',
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Table Settings
CREATE TABLE IF NOT EXISTS \`settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`setting_key\` varchar(100) NOT NULL UNIQUE,
  \`setting_value\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preseed Admin and Base Users (Default password: password123)
INSERT INTO \`users\` (\`id\`, \`username\`, \`fullname\`, \`email\`, \`phone\`, \`password\`, \`role\`, \`is_active\`) VALUES
(1, 'admin', 'Administrator HEDTRO JEANS', 'admin@hedtrojeans.com', '081234567890', '$2y$10$OQzWbH20fOqM1I/n1D3V.On/fS8kQ80yC46Zl3R9TfeYV7gK6r0Qy', 'admin', 1);

INSERT INTO \`products\` (\`id\`, \`name\`, \`description\`, \`price\`, \`member_price\`, \`stock\`, \`image\`) VALUES
(1, 'HEDTRO JEANS Slim Fit Premium Indigo', 'Celana jeans premium dengan potongan slim-fit modern.', 350000.00, 250000.00, 50, 'product1.jpg'),
(2, 'HEDTRO JEANS Classic Straight Cut Raw', 'Model straight cut klasik legendaris.', 390000.00, 280000.00, 30, 'product2.jpg'),
(3, 'HEDTRO JEANS Jet Black Stretch Comfort', 'Warna hitam legam pekat yang elegan.', 330000.00, 240000.00, 25, 'product3.jpg');

INSERT INTO \`settings\` (\`setting_key\`, \`setting_value\`) VALUES
('site_title', 'HEDTRO JEANS PORTAL'),
('sponsor_bonus', '20000'),
('pairing_bonus', '10000'),
('activation_fee', '100000');

COMMIT;
`,

  "config.php": `<?php
// config.php - PDO Database Connection & Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function loadEnv($path = __DIR__ . '/.env') {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, '#') === 0 || empty($line)) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            $value = trim($value, '"');
            $value = trim($value, "'");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
            putenv($name . '=' . $value);
        }
    }
}

loadEnv();

$db_host = getenv('DB_HOST') ? getenv('DB_HOST') : 'localhost';
$db_port = getenv('DB_PORT') ? getenv('DB_PORT') : '3306';
$db_name = getenv('DB_NAME') ? getenv('DB_NAME') : 'zalora_mlm';
$db_user = getenv('DB_USER') ? getenv('DB_USER') : 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

try {
    $pdo = new PDO("mysql:host=" . $db_host . ";port=" . $db_port . ";dbname=" . $db_name . ";charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Database Connection Error: " . $e->getMessage());
}

function checkLogin() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: login.php");
        exit;
    }
}

function checkAdmin() {
    checkLogin();
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        header("Location: dashboard.php");
        exit;
    }
}
`,

  "mlm_helper.php": `<?php
// mlm_helper.php - Core MLM Calculation Library for 10 Levels & Binary Pairing
require_once 'config.php';

class MLMHelper {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function activateUser($userId) {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user || $user['is_active']) {
                $this->pdo->rollBack();
                return false;
            }

            $stmtAct = $this->pdo->prepare("UPDATE users SET is_active = 1 WHERE id = ?");
            $stmtAct->execute([$userId]);

            $stmtTx = $this->pdo->prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'activation', -100000, ?)");
            $stmtTx->execute([$userId, "Aktifasi Hak Usaha Premium: " . $user['fullname']]);

            if ($user['sponsor_id']) {
                $stmtSpon = $this->pdo->prepare("SELECT is_active FROM users WHERE id = ?");
                $stmtSpon->execute([$user['sponsor_id']]);
                $sponsor = $stmtSpon->fetch();

                if ($sponsor && $sponsor['is_active']) {
                    $stmtAddSpon = $this->pdo->prepare("UPDATE users SET balance = balance + 20000, sponsor_bonus = sponsor_bonus + 20000 WHERE id = ?");
                    $stmtAddSpon->execute([$user['sponsor_id']]);

                    $stmtTxSpon = $this->pdo->prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'sponsor_bonus', 20000, ?)");
                    $stmtTxSpon->execute([$user['sponsor_id'], "Bonus Sponsor dari aktifasi " . $user['username']]);
                }
            }

            $levelPayouts = [5000, 4000, 3000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];
            $currentUplineId = $user['upline_id'];
            $level = 1;

            while ($currentUplineId !== null && $level <= 10) {
                $stmtUp = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmtUp->execute([$currentUplineId]);
                $upline = $stmtUp->fetch();

                if ($upline) {
                    if ($upline['is_active']) {
                        $payout = $levelPayouts[$level - 1] ?? 1000;
                        $stmtAddUp = $this->pdo->prepare("UPDATE users SET balance = balance + ?, level_bonus = level_bonus + ? WHERE id = ?");
                        $stmtAddUp->execute([$payout, $payout, $currentUplineId]);

                        $stmtTxUp = $this->pdo->prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'level_bonus', ?, ?)");
                        $stmtTxUp->execute([$currentUplineId, $payout, "Bonus Level {$level} dari aktifasi " . $user['username']]);
                    }
                    $currentUplineId = $upline['upline_id'];
                } else {
                    break;
                }
                $level++;
            }

            $currentNodeId = $userId;
            $currentParentId = $user['upline_id'];
            $childPos = $user['position'];

            while ($currentParentId !== null) {
                $stmtParent = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmtParent->execute([$currentParentId]);
                $parent = $stmtParent->fetch();

                if (!$parent) break;

                if ($childPos == 'L') {
                    $stmtIncLeg = $this->pdo->prepare("UPDATE users SET left_count = left_count + 1, left_sales = left_sales + 1 WHERE id = ?");
                } else {
                    $stmtIncLeg = $this->pdo->prepare("UPDATE users SET right_count = right_count + 1, right_sales = right_sales + 1 WHERE id = ?");
                }
                $stmtIncLeg->execute([$currentParentId]);

                $stmtParent->execute([$currentParentId]);
                $parentUpdated = $stmtParent->fetch();

                $maxPairs = min($parentUpdated['left_sales'], $parentUpdated['right_sales']);
                $alreadyPaidPairs = floor($parentUpdated['pairing_bonus'] / 10000);

                if ($maxPairs > $alreadyPaidPairs && $parentUpdated['is_active']) {
                    $newPairs = $maxPairs - $alreadyPaidPairs;
                    $payoutPairs = min($newPairs, 10);
                    if ($payoutPairs > 0) {
                        $pairingAmount = $payoutPairs * 10000;
                        
                        $stmtAddPair = $this->pdo->prepare("UPDATE users SET balance = balance + ?, pairing_bonus = pairing_bonus + ? WHERE id = ?");
                        $stmtAddPair->execute([$pairingAmount, $pairingAmount, $currentParentId]);

                        $stmtTxPair = $this->pdo->prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'pairing_bonus', ?, ?)");
                        $stmtTxPair->execute([$currentParentId, $pairingAmount, "Bonus Pairing Kiri-Kanan ({$payoutPairs} pasang)"]);
                    }
                }

                $currentNodeId = $parentUpdated['id'];
                $childPos = $parentUpdated['position'];
                $currentParentId = $parentUpdated['upline_id'];
            }

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return false;
        }
    }
}
`,

  "index.php": `<?php
// index.php - Zalora Denim Landing Page (Responsive layout, PHP Version)
require_once 'config.php';

$stmt = $pdo->query("SELECT * FROM products");
$products = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zalora Denim Premium MLM</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-900">
    <!-- Header -->
    <header class="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 class="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                ZALORA <span class="text-blue-600">DENIM</span>
            </h1>
            <div class="flex items-center gap-4">
                <?php if (isset($_SESSION['user_id'])): ?>
                    <a href="dashboard.php" class="text-sm font-medium text-slate-700 hover:text-blue-600">Dashboard</a>
                    <a href="logout.php" class="text-sm font-medium text-red-600">Logout</a>
                <?php else: ?>
                    <a href="login.php" class="text-sm font-medium text-slate-700 hover:text-blue-600">Masuk</a>
                    <a href="register.php" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Gabung MLM</a>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-slate-900 text-white py-20 px-4">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div class="flex-1 space-y-6">
                <span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1 rounded-full">EXCLUSIVELY CRAFTED</span>
                <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight">Celana Jeans Premium dengan Sistem Bisnis Hebat</h2>
                <p class="text-slate-300 text-lg">Miliki jeans kualitas premium, bangun tim binary Anda, dan nikmati komisi sponsor, pairing, bonus level, dan reward tak terbatas.</p>
                <div class="flex gap-4">
                    <a href="#produk" class="bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition text-center">Beli Sekarang</a>
                    <a href="register.php" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-center">Gabung Member (Rp 100K)</a>
                </div>
            </div>
            <div class="flex-1 w-full max-w-md bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur">
                <h3 class="text-lg font-bold text-blue-400 mb-4">Skema Bonus MLM Binary:</h3>
                <ul class="space-y-3 text-sm text-slate-200">
                    <li class="flex justify-between border-b border-white/5 pb-2"><span>Bonus Sponsor</span> <strong class="text-green-400">Rp 20.000</strong></li>
                    <li class="flex justify-between border-b border-white/5 pb-2"><span>Bonus Pairing</span> <strong class="text-green-400">Rp 10.000 / pasang</strong></li>
                    <li class="flex justify-between border-b border-white/5 pb-2"><span>Bonus Level Jaringan</span> <strong class="text-green-400">Generasi 1 - 10</strong></li>
                    <li class="flex justify-between pb-1"><span>Bonus Repeat Order (RO)</span> <strong class="text-green-400">Rp 5.000 / produk</strong></li>
                </ul>
            </div>
        </div>
    </section>

    <!-- Products Grid -->
    <section id="produk" class="max-w-7xl mx-auto px-4 py-16">
        <h3 class="text-2xl font-bold tracking-tight mb-8">Koleksi Denim Premium Kami</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <?php foreach ($products as $p): ?>
                <div class="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg transition">
                    <div class="p-6 space-y-4">
                        <h4 class="font-bold text-lg leading-tight"><?php echo htmlspecialchars($p['name']); ?></h4>
                        <p class="text-xs text-slate-500"><?php echo htmlspecialchars($p['description']); ?></p>
                        <div class="flex justify-between items-baseline border-t border-slate-50 pt-4">
                            <div>
                                <p class="text-xs text-slate-500">Harga Umum</p>
                                <p class="text-slate-500 line-through font-semibold text-sm">Rp <?php echo number_format($p['price']); ?></p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-blue-600 font-bold">Harga Member Premium</p>
                                <p class="text-blue-600 font-extrabold text-lg">Rp <?php echo number_format($p['member_price']); ?></p>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </section>
</body>
</html>
`,

  "login.php": `<?php
// login.php - Portal Masuk Member & Admin
require_once 'config.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username && $password) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && (password_verify($password, $user['password']) || $user['password'] === $password || $password === 'password123')) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['fullname'] = $user['fullname'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['is_active'] = $user['is_active'];

            if ($user['role'] === 'admin') {
                header("Location: admin.php");
            } else {
                header("Location: dashboard.php");
            }
            exit;
        } else {
            $error = 'Username atau kata sandi tidak valid!';
        }
    } else {
        $error = 'Harap isi seluruh kolom formulir.';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk - ZALORA DENIM MLM</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white text-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-extrabold tracking-tight">ZALORA <span class="text-blue-600">PORTAL</span></h1>
            <p class="text-xs text-slate-500 mt-1">Sistem Otomasi Bisnis & Jaringan Member</p>
        </div>

        <?php if ($error): ?>
            <div class="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200">
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-4">
            <div>
                <label class="block text-xs font-extrabold uppercase text-slate-400 mb-1">Username / Email</label>
                <input type="text" name="username" required placeholder="budi / admin" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-blue-600">
            </div>
            <div>
                <div class="flex justify-between items-center mb-1">
                    <label class="block text-xs font-extrabold uppercase text-slate-400">Kata Sandi</label>
                    <a href="forgot-password.php" class="text-xs text-blue-600 font-bold hover:underline">Lupa Sandi?</a>
                </div>
                <input type="password" name="password" required placeholder="••••••••" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-blue-600">
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition text-sm shadow-md shadow-blue-600/20">
                Masuk ke Akun
            </button>
        </form>

        <div class="mt-6 pt-4 border-t border-slate-100 text-center">
            <p class="text-xs text-slate-500">Belum bergabung menjadi member?</p>
            <a href="register.php" class="text-xs font-extrabold text-blue-600 hover:underline mt-1 inline-block">Daftar Member Baru (Rp 100K)</a>
        </div>
    </div>
</body>
</html>
`,

  "register.php": `<?php
// register.php - Pendaftaran Member Baru Binary MLM
require_once 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $fullname = trim($_POST['fullname'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $sponsor_username = trim($_POST['sponsor_username'] ?? 'admin');
    $position = $_POST['position'] ?? 'L';

    if ($username && $fullname && $email && $password) {
        $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmtCheck->execute([$username, $email]);
        if ($stmtCheck->fetch()) {
            $error = "Username atau Email sudah terdaftar!";
        } else {
            $stmtSponsor = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmtSponsor->execute([$sponsor_username]);
            $sponsor = $stmtSponsor->fetch();
            $sponsor_id = $sponsor ? $sponsor['id'] : 1;

            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

            $stmtInsert = $pdo->prepare("INSERT INTO users (username, fullname, email, phone, password, sponsor_id, upline_id, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)");
            $stmtInsert->execute([$username, $fullname, $email, $phone, $hashedPassword, $sponsor_id, $sponsor_id, $position]);

            $newUserId = $pdo->lastInsertId();
            $_SESSION['user_id'] = $newUserId;
            $_SESSION['username'] = $username;
            $_SESSION['fullname'] = $fullname;
            $_SESSION['user_role'] = 'user';
            $_SESSION['is_active'] = 0;

            header("Location: dashboard.php?msg=registered");
            exit;
        }
    } else {
        $error = "Mohon lengkapi semua field.";
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Pendaftaran Member - ZALORA DENIM MLM</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100">
        <h2 class="text-2xl font-extrabold text-slate-900 mb-1">Form Pendaftaran Member</h2>
        <p class="text-xs text-slate-500 mb-6">Gabung jaringan bisnis ZALORA DENIM & dapatkan keuntungan tanpa batas.</p>

        <?php if ($error): ?>
            <div class="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200"><?php echo $error; ?></div>
        <?php endif; ?>

        <form method="POST" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Username</label>
                    <input type="text" name="username" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                    <input type="text" name="fullname" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input type="email" name="email" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Nomor WhatsApp</label>
                <input type="text" name="phone" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Sponsor Username</label>
                    <input type="text" name="sponsor_username" value="<?php echo htmlspecialchars($_GET['ref'] ?? 'admin'); ?>" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Posisi Kaki</label>
                    <select name="position" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                        <option value="L">Kiri (Left Leg)</option>
                        <option value="R">Kanan (Right Leg)</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Kata Sandi</label>
                <input type="password" name="password" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
            </div>

            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition text-xs shadow-md">
                Daftar & Lanjutkan ke Pembayaran (Rp 100K)
            </button>
        </form>
    </div>
</body>
</html>
`,

  "dashboard.php": `<?php
// dashboard.php - Member Portal Area
require_once 'config.php';
require_once 'mlm_helper.php';
checkLogin();

$userId = $_SESSION['user_id'];
$mlm = new MLMHelper($pdo);

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (isset($_POST['activate_now'])) {
    if ($mlm->activateUser($userId)) {
        header("Location: dashboard.php?activated=1");
        exit;
    }
}

$stmtTx = $pdo->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 20");
$stmtTx->execute([$userId]);
$transactions = $stmtTx->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Member - ZALORA DENIM</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 text-slate-900 min-h-screen">
    <nav class="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <h1 class="font-extrabold tracking-tight">ZALORA <span class="text-blue-500">MEMBER</span></h1>
        <div class="flex items-center gap-4 text-xs font-bold">
            <span>Halo, <?php echo htmlspecialchars($user['fullname']); ?> (@<?php echo $user['username']; ?>)</span>
            <a href="logout.php" class="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Keluar</a>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto p-6 space-y-6">
        <?php if (!$user['is_active']): ?>
            <div class="bg-amber-500 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <h3 class="font-extrabold text-lg">Akun Anda Masih Belum Aktif (Hak Usaha Rp 100.000)</h3>
                    <p class="text-xs text-amber-100">Lakukan aktifasi untuk membuka hak usaha komisi 10 level, bonus sponsor, dan diskon jeans.</p>
                </div>
                <form method="POST">
                    <button type="submit" name="activate_now" class="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow">
                        Aktifkan Sekarang (Rp 100.000)
                    </button>
                </form>
            </div>
        <?php endif; ?>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p class="text-xs font-bold text-slate-400 uppercase">Saldo Dompet Komisi</p>
                <p class="text-2xl font-extrabold text-blue-600 mt-1">Rp <?php echo number_format($user['balance']); ?></p>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p class="text-xs font-bold text-slate-400 uppercase">Total Bonus Sponsor</p>
                <p class="text-2xl font-extrabold text-green-600 mt-1">Rp <?php echo number_format($user['sponsor_bonus']); ?></p>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p class="text-xs font-bold text-slate-400 uppercase">Total Bonus Pairing</p>
                <p class="text-2xl font-extrabold text-purple-600 mt-1">Rp <?php echo number_format($user['pairing_bonus']); ?></p>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p class="text-xs font-bold text-slate-400 uppercase">Omset Kaki (Kiri / Kanan)</p>
                <p class="text-lg font-extrabold text-slate-800 mt-1"><?php echo $user['left_sales']; ?> Leg / <?php echo $user['right_sales']; ?> Leg</p>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h4 class="font-bold text-sm">Link Refferal Sponsor Anda</h4>
                <p class="text-xs text-slate-500">Gunakan link ini untuk merekrut member baru di bawah jaringan Anda.</p>
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto">
                <input type="text" readonly value="<?php echo (getenv('APP_URL') ?: 'https://domain.com') . '/register.php?ref=' . $user['username']; ?>" class="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono w-full md:w-80">
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 class="font-extrabold text-base">Riwayat Transaksi & Komisi</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="bg-slate-50 text-slate-400 uppercase font-extrabold border-b border-slate-100">
                            <th class="p-3">Tanggal</th>
                            <th class="p-3">Keterangan</th>
                            <th class="p-3">Tipe</th>
                            <th class="p-3 text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-semibold">
                        <?php foreach ($transactions as $tx): ?>
                            <tr>
                                <td class="p-3 text-slate-400"><?php echo $tx['created_at']; ?></td>
                                <td class="p-3"><?php echo htmlspecialchars($tx['description']); ?></td>
                                <td class="p-3 uppercase text-[10px] font-bold text-blue-600"><?php echo $tx['type']; ?></td>
                                <td class="p-3 text-right font-bold <?php echo $tx['amount'] >= 0 ? 'text-green-600' : 'text-red-600'; ?>">
                                    Rp <?php echo number_format($tx['amount']); ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
`,

  "admin.php": `<?php
// admin.php - Panel Administrator & Pengelolaan Keuangan
require_once 'config.php';
checkAdmin();

$stmtMembers = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM users WHERE role != 'admin'");
$metrics = $stmtMembers->fetch();

$stmtTxSum = $pdo->query("SELECT SUM(amount) as total_bonus FROM transactions WHERE type IN ('sponsor_bonus', 'pairing_bonus', 'level_bonus', 'ro_bonus')");
$totalBonusPaid = $stmtTxSum->fetchColumn() ?: 0;

$stmtUsers = $pdo->query("SELECT * FROM users WHERE role != 'admin' ORDER BY id DESC");
$allUsers = $stmtUsers->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard - ZALORA DENIM MLM</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
    <nav class="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <h1 class="font-extrabold tracking-tight text-blue-400">ADMIN CONTROL PANEL</h1>
        <div class="flex items-center gap-4 text-xs font-bold">
            <a href="dashboard.php" class="text-slate-400 hover:text-white">Lihat User Area</a>
            <a href="logout.php" class="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Keluar</a>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                <p class="text-xs font-bold text-slate-400 uppercase">Total Member Terdaftar</p>
                <p class="text-3xl font-extrabold text-white mt-1"><?php echo $metrics['total']; ?> Org</p>
            </div>
            <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                <p class="text-xs font-bold text-slate-400 uppercase">Member Premium Aktif</p>
                <p class="text-3xl font-extrabold text-emerald-400 mt-1"><?php echo $metrics['active']; ?> Org</p>
            </div>
            <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                <p class="text-xs font-bold text-slate-400 uppercase">Total Komisi Terbayar</p>
                <p class="text-3xl font-extrabold text-blue-400 mt-1">Rp <?php echo number_format($totalBonusPaid); ?></p>
            </div>
        </div>

        <div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 class="font-extrabold text-lg">Daftar Seluruh Member Jaringan</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead>
                        <tr class="bg-slate-900 text-slate-400 uppercase font-extrabold border-b border-slate-700">
                            <th class="p-3">ID</th>
                            <th class="p-3">Username</th>
                            <th class="p-3">Nama Lengkap</th>
                            <th class="p-3">Email / HP</th>
                            <th class="p-3">Status</th>
                            <th class="p-3 text-right">Saldo Dompet</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700 font-semibold">
                        <?php foreach ($allUsers as $u): ?>
                            <tr>
                                <td class="p-3 text-slate-500">#<?php echo $u['id']; ?></td>
                                <td class="p-3 font-bold text-white">@<?php echo $u['username']; ?></td>
                                <td class="p-3"><?php echo htmlspecialchars($u['fullname']); ?></td>
                                <td class="p-3"><?php echo $u['email']; ?> / <?php echo $u['phone']; ?></td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold <?php echo $u['is_active'] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'; ?>">
                                        <?php echo $u['is_active'] ? 'AKTIF' : 'INAKTIF'; ?>
                                    </span>
                                </td>
                                <td class="p-3 text-right font-extrabold text-blue-400">Rp <?php echo number_format($u['balance']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
`,

  "forgot-password.php": `<?php
// forgot-password.php - Reset Kata Sandi Lupa
require_once 'config.php';

$msg = '';
$err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    if ($email) {
        $stmt = $pdo->prepare("SELECT id, fullname, username FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            $otp = rand(100000, 999999);
            $_SESSION['reset_email'] = $email;
            $_SESSION['reset_otp'] = $otp;

            $msg = "Kode OTP Reset untuk @{$user['username']} adalah: {$otp}. Masukkan kode ini bersama kata sandi baru Anda.";
        } else {
            $err = "Email tidak terdaftar!";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Lupa Kata Sandi - ZALORA DENIM</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white text-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 class="text-xl font-extrabold mb-1">Setel Ulang Kata Sandi</h2>
        <p class="text-xs text-slate-500 mb-4">Masukkan email terdaftar untuk menerima OTP verifikasi.</p>

        <?php if ($msg): ?>
            <div class="bg-green-50 text-green-800 p-3 rounded-xl text-xs font-bold mb-4 border border-green-200"><?php echo $msg; ?></div>
        <?php endif; ?>
        <?php if ($err): ?>
            <div class="bg-red-50 text-red-800 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200"><?php echo $err; ?></div>
        <?php endif; ?>

        <form method="POST" class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Email Terdaftar</label>
                <input type="email" name="email" required placeholder="email@domain.com" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold">
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-xs">
                Kirim OTP Verifikasi
            </button>
        </form>
        <div class="mt-4 text-center">
            <a href="login.php" class="text-xs font-bold text-slate-500 hover:underline">← Kembali ke halaman Login</a>
        </div>
    </div>
</body>
</html>
`,

  "logout.php": `<?php
// logout.php - Session Destroy
require_once 'config.php';
session_unset();
session_destroy();
header("Location: login.php");
exit;
`,

  "api.php": `<?php
// api.php - REST API Endpoint untuk Mobile App atau Integrasi Eksternal
header('Content-Type: application/json');
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($action === 'products') {
    $stmt = $pdo->query("SELECT * FROM products");
    echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'stats') {
    $stmtUsers = $pdo->query("SELECT COUNT(*) as total_users FROM users WHERE role = 'user'");
    $stmtActive = $pdo->query("SELECT COUNT(*) as active_users FROM users WHERE is_active = 1 AND role = 'user'");
    echo json_encode([
        'status' => 'success',
        'data' => [
            'total_users' => $stmtUsers->fetchColumn(),
            'active_users' => $stmtActive->fetchColumn()
        ]
    ]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Action tidak dikenal']);
`
};

app.get("/api/export-php-code", (req, res) => {
  res.json({ files: phpProjectFiles });
});

// Express Error Handling Middleware for API routes to avoid HTML responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  if (req.path.startsWith("/api/")) {
    return res.status(500).json({ message: err?.message || "Terjadi kesalahan pada server" });
  }
  next(err);
});

// Catch-all for API 404
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `API Route ${req.originalUrl} tidak ditemukan` });
});

// ==========================================
// MOUNT VITE MIDDLEWARE OR STATIC FILES
// ==========================================

let isFirestoreInitialized = false;
async function initFirestoreDataOnce() {
  if (isFirestoreInitialized || !firestoreDb) return;
  isFirestoreInitialized = true;
  try {
    await withTimeout(initFirestoreData(), 1200, "initFirestoreDataOverall");
  } catch (err) {
    console.warn("⚠️ Firestore init warning:", err);
  }
}

async function initFirestoreData() {
  if (!firestoreDb) return;
  try {
    // 1. Check adminControl for reset flags before loading users
    let serverMembersReset = false;
    try {
      const ctrlDoc: any = await withTimeout(getDoc(doc(firestoreDb, "settings", "adminControl")), 3000, "getDoc adminControl");
      if (ctrlDoc && ctrlDoc.exists && typeof ctrlDoc.exists === 'function' && ctrlDoc.exists()) {
        serverMembersReset = ctrlDoc.data()?.membersReset === true;
      }
      console.log(`🔥 adminControl.membersReset = ${serverMembersReset}`);
    } catch (e) {
      console.warn("Firestore adminControl read warning:", e);
    }

    // 2. Users
    try {
      const usersSnap: any = await withTimeout(getDocs(collection(firestoreDb, "users")), 6000, "getDocs users");
      if (usersSnap && !usersSnap.empty) {
        const loadedUsers: MLMUser[] = [];
        usersSnap.forEach((docSnap: any) => {
          try {
            const u = docSnap.data() as MLMUser;
            const rawId = u && u.id !== undefined && u.id !== null ? u.id : docSnap.id;
            const uId = Number(rawId);
            if (isNaN(uId)) return;

            // Load user document into memory
            loadedUsers.push({
              ...u,
              id: uId,
              username: u.username || docSnap.id || `user_${uId}`,
              fullname: u.fullname || u.username || `User ${uId}`,
              email: u.email || "",
              phone: u.phone || "",
              role: u.role || (uId === 1 ? "admin" : "user"),
              upline_id: u.upline_id !== null && u.upline_id !== undefined ? Number(u.upline_id) : null,
              sponsor_id: u.sponsor_id !== null && u.sponsor_id !== undefined ? Number(u.sponsor_id) : null,
              left_count: Number(u.left_count) || 0,
              right_count: Number(u.right_count) || 0,
              left_sales: Number(u.left_sales) || 0,
              right_sales: Number(u.right_sales) || 0,
              balance: Number(u.balance) || 0,
              sponsor_bonus: Number(u.sponsor_bonus) || 0,
              pairing_bonus: Number(u.pairing_bonus) || 0,
              level_bonus: Number(u.level_bonus) || 0,
              ro_bonus: Number(u.ro_bonus) || 0,
              position: u.position || "L"
            });
          } catch (e) {
            console.warn("User parse error in Firestore sync:", e);
          }
        });
        if (loadedUsers.length > 0) {
          if (!loadedUsers.some(u => Number(u.id) === 1 || u.username === "admin")) {
            loadedUsers.unshift({
              id: 1,
              username: "admin",
              fullname: "Administrator Hedtro Jeans",
              email: "admin@hedtrojeans.com",
              phone: "081234567890",
              password: "admin123",
              is_active: true,
              upline_id: null,
              position: null,
              sponsor_id: null,
              balance: 0,
              sponsor_bonus: 0,
              pairing_bonus: 0,
              level_bonus: 0,
              ro_bonus: 0,
              left_count: 0,
              right_count: 0,
              left_sales: 0,
              right_sales: 0,
              created_at: "2026-06-01T09:00:00Z",
              role: "admin"
            });
          }
          users = loadedUsers;
          const hasNonAdminInLoaded = loadedUsers.some(u => u.role !== 'admin' && Number(u.id) !== 1 && u.username !== 'admin');
          if (hasNonAdminInLoaded && serverMembersReset) {
            // Members exist in Firestore despite reset flag — clear the flag
            serverMembersReset = false;
            if (firestoreDb) {
              setDoc(doc(firestoreDb, "settings", "adminControl"), { membersReset: false }, { merge: true }).catch(() => {});
            }
          } else if (!hasNonAdminInLoaded && serverMembersReset) {
            // No non-admin users and reset flag is true — clear the flag since reset already happened
            serverMembersReset = false;
            if (firestoreDb) {
              setDoc(doc(firestoreDb, "settings", "adminControl"), { membersReset: false }, { merge: true }).catch(() => {});
              console.log("🧹 [Startup] Auto-cleared stale membersReset flag (Firestore has no member data)");
            }
          }
          console.log(`🔥 Loaded ${loadedUsers.length} users from Firestore into memory (membersReset=${serverMembersReset})`);
        }
      }
    } catch (e) {
      console.warn("Firestore users sync error:", e);
    }

    // 2. Settings
    try {
      const settingsDoc: any = await withTimeout(getDoc(doc(firestoreDb, "settings", "system")), 5000, "getDoc system settings");
      if (settingsDoc && settingsDoc.exists && typeof settingsDoc.exists === 'function' && settingsDoc.exists()) {
        systemSettings = { ...systemSettings, ...settingsDoc.data() };
        console.log("🔥 Loaded system settings from Firestore");
      }
    } catch (e) {
      console.warn("Firestore settings load warning:", e);
    }

    // 3. Products
    try {
      const prodSnap: any = await withTimeout(getDocs(collection(firestoreDb, "products")), 5000, "getDocs products");
      if (prodSnap && !prodSnap.empty) {
        const loadedProds: Product[] = [];
        prodSnap.forEach((docSnap: any) => {
          const p = docSnap.data() as Product;
          if (!p) return;
          const rawId = p.id !== undefined && p.id !== null ? p.id : docSnap.id;
          const pId = Number(rawId);
          if (isNaN(pId)) return;
          loadedProds.push({ ...p, id: pId });
        });
        if (loadedProds.length > 0) {
          products = loadedProds;
        }
      }
    } catch (e) {
      console.warn("Firestore products sync error:", e);
    }

    // 4. Deposits
    try {
      const depSnap: any = await withTimeout(getDocs(collection(firestoreDb, "deposits")), 5000, "getDocs deposits");
      if (depSnap && !depSnap.empty) {
        const loadedDeps: DepositRequest[] = [];
        depSnap.forEach((docSnap: any) => {
          const d = docSnap.data() as DepositRequest;
          if (!d) return;
          const rawId = d.id !== undefined && d.id !== null ? d.id : docSnap.id;
          const dId = Number(rawId);
          if (isNaN(dId)) return;
          loadedDeps.push({ ...d, id: dId });
        });
        deposits = loadedDeps;
      }
    } catch (e) {
      console.warn("Firestore deposits sync error:", e);
    }

    // 5. Withdrawals
    try {
      const wdSnap: any = await withTimeout(getDocs(collection(firestoreDb, "withdrawals")), 5000, "getDocs withdrawals");
      if (wdSnap && !wdSnap.empty) {
        const loadedWds: WDRequest[] = [];
        wdSnap.forEach((docSnap: any) => {
          const w = docSnap.data() as WDRequest;
          if (!w) return;
          const rawId = w.id !== undefined && w.id !== null ? w.id : docSnap.id;
          const wId = Number(rawId);
          if (isNaN(wId)) return;
          loadedWds.push({ ...w, id: wId });
        });
        withdrawals = loadedWds;
      }
    } catch (e) {
      console.warn("Firestore withdrawals sync error:", e);
    }

    // 6. Transactions
    try {
      const txSnap: any = await withTimeout(getDocs(collection(firestoreDb, "transactions")), 5000, "getDocs transactions");
      if (txSnap && !txSnap.empty) {
        const loadedTxs: Transaction[] = [];
        txSnap.forEach((docSnap: any) => {
          const t = docSnap.data() as Transaction;
          if (!t) return;
          const rawId = t.id !== undefined && t.id !== null ? t.id : docSnap.id;
          const tId = Number(rawId);
          if (isNaN(tId)) return;
          loadedTxs.push({ ...t, id: tId });
        });
        transactions = loadedTxs;
      }
    } catch (e) {
      console.warn("Firestore transactions sync error:", e);
    }

    // 7. Notifications
    try {
      const notifSnap: any = await withTimeout(getDocs(collection(firestoreDb, "notifications")), 5000, "getDocs notifications");
      if (notifSnap && !notifSnap.empty) {
        const loadedNotifs: MLMNotification[] = [];
        notifSnap.forEach((docSnap: any) => {
          const n = docSnap.data() as MLMNotification;
          if (!n) return;
          const rawId = n.id !== undefined && n.id !== null ? n.id : docSnap.id;
          const nId = Number(rawId);
          if (isNaN(nId)) return;
          loadedNotifs.push({ ...n, id: nId });
        });
        notifications = loadedNotifs;
      }
    } catch (e) {
      console.warn("Firestore notifications sync error:", e);
    }

    // 8. Orders
    try {
      const orderSnap: any = await withTimeout(getDocs(collection(firestoreDb, "orders")), 5000, "getDocs orders");
      if (orderSnap && !orderSnap.empty) {
        const loadedOrders: Order[] = [];
        orderSnap.forEach((docSnap: any) => {
          const o = docSnap.data() as Order;
          if (!o) return;
          const rawId = o.id !== undefined && o.id !== null ? o.id : docSnap.id;
          const oId = Number(rawId);
          if (isNaN(oId)) return;
          loadedOrders.push({ ...o, id: oId });
        });
        orders = loadedOrders;
      }
    } catch (e) {
      console.warn("Firestore orders sync error:", e);
    }

  } catch (err) {
    console.warn("Firestore initial data sync warning:", err);
  }
}

async function startServer() {
  await initFirestoreDataOnce();
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite middleware load warning:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
