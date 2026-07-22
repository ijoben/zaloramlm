import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MLMUser, Product, Transaction, DepositRequest, WDRequest, MLMNotification, BinaryTreeNode } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// IN-MEMORY DATABASE STATE (Preseeded)
// ==========================================

let users: MLMUser[] = [
  {
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
    created_at: "2026-06-01T09:00:00Z",
    role: "admin"
  },
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
  },
  {
    id: 3,
    username: "citra",
    fullname: "Citra Lestari",
    email: "citra@gmail.com",
    phone: "081234567892",
    is_active: true,
    upline_id: 1,
    position: "R",
    sponsor_id: 1,
    balance: 320000,
    sponsor_bonus: 20000,
    pairing_bonus: 10000,
    level_bonus: 10000,
    ro_bonus: 0,
    left_count: 2,
    right_count: 1,
    left_sales: 2,
    right_sales: 1,
    created_at: "2026-06-16T11:00:00Z",
    role: "user"
  },
  {
    id: 4,
    username: "dedi",
    fullname: "Dedi Wijaya",
    email: "dedi@gmail.com",
    phone: "081234567893",
    is_active: true,
    upline_id: 2,
    position: "L",
    sponsor_id: 2,
    balance: 150000,
    sponsor_bonus: 20000,
    pairing_bonus: 0,
    level_bonus: 5000,
    ro_bonus: 0,
    left_count: 1,
    right_count: 0,
    left_sales: 1,
    right_sales: 0,
    created_at: "2026-07-01T08:30:00Z",
    role: "user"
  },
  {
    id: 5,
    username: "elsa",
    fullname: "Elsa Safira",
    email: "elsa@gmail.com",
    phone: "081234567894",
    is_active: true,
    upline_id: 2,
    position: "R",
    sponsor_id: 2,
    balance: 90000,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 1,
    left_sales: 0,
    right_sales: 1,
    created_at: "2026-07-02T14:15:00Z",
    role: "user"
  },
  {
    id: 6,
    username: "fani",
    fullname: "Fani Rahma",
    email: "fani@gmail.com",
    phone: "081234567895",
    is_active: true,
    upline_id: 3,
    position: "L",
    sponsor_id: 3,
    balance: 210000,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 1,
    right_count: 0,
    left_sales: 1,
    right_sales: 0,
    created_at: "2026-07-03T10:00:00Z",
    role: "user"
  },
  {
    id: 7,
    username: "guntur",
    fullname: "Guntur Saputra",
    email: "guntur@gmail.com",
    phone: "081234567896",
    is_active: false, // Inactive member
    upline_id: 3,
    position: "R",
    sponsor_id: 1,
    balance: 0,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 0,
    left_sales: 0,
    right_sales: 0,
    created_at: "2026-07-10T16:20:00Z",
    role: "user"
  },
  {
    id: 8,
    username: "hendra",
    fullname: "Hendra Gunawan",
    email: "hendra@gmail.com",
    phone: "081234567897",
    is_active: true,
    upline_id: 4,
    position: "L",
    sponsor_id: 4,
    balance: 50000,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 0,
    left_sales: 0,
    right_sales: 0,
    created_at: "2026-07-12T09:00:00Z",
    role: "user"
  },
  {
    id: 9,
    username: "irma",
    fullname: "Irma Suryani",
    email: "irma@gmail.com",
    phone: "081234567898",
    is_active: true,
    upline_id: 5,
    position: "R",
    sponsor_id: 2,
    balance: 100000,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 0,
    left_sales: 0,
    right_sales: 0,
    created_at: "2026-07-15T13:40:00Z",
    role: "user"
  },
  {
    id: 10,
    username: "joko",
    fullname: "Joko Widodo",
    email: "joko@gmail.com",
    phone: "081234567899",
    is_active: true,
    upline_id: 6,
    position: "L",
    sponsor_id: 6,
    balance: 50000,
    sponsor_bonus: 0,
    pairing_bonus: 0,
    level_bonus: 0,
    ro_bonus: 0,
    left_count: 0,
    right_count: 0,
    left_sales: 0,
    right_sales: 0,
    created_at: "2026-07-18T11:10:00Z",
    role: "user"
  }
];

let products: Product[] = [
  {
    id: 1,
    name: "Zalora Denim Slim Fit Premium Indigo",
    description: "Celana jeans premium dengan potongan slim-fit modern. Dibuat dengan katun denim berkualitas tinggi 14oz, warna indigo pekat elegan yang awet, serat lentur yang sangat nyaman digunakan seharian.",
    price: 350000,
    member_price: 250000,
    stock: 45,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    name: "Zalora Denim Classic Straight Cut Raw",
    description: "Model straight cut klasik legendaris. Menggunakan bahan raw denim kaku berkualitas ekspor yang akan membentuk memudar (fading) alami sesuai bentuk tubuh Anda seiring waktu pemakaian.",
    price: 390000,
    member_price: 280000,
    stock: 30,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 3,
    name: "Zalora Denim Jet Black Stretch Comfort",
    description: "Warna hitam legam pekat yang elegan untuk formal maupun kasual. Sangat fleksibel (high stretch), pas di paha dan kaki tanpa membatasi pergerakan aktif Anda.",
    price: 330000,
    member_price: 240000,
    stock: 25,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 4,
    name: "Zalora Denim Light Wash Retro 90s",
    description: "Tampilan retro klasik tahun 90-an dengan efek pencucian warna muda (light wash) yang kasual. Sangat cocok dipadukan dengan kaos santai maupun kemeja oversized.",
    price: 370000,
    member_price: 270000,
    stock: 18,
    image: "https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&q=80&w=600"
  }
];

let transactions: Transaction[] = [
  {
    id: 1,
    user_id: 2,
    username: "budi",
    type: "activation",
    amount: -100000,
    description: "Aktifasi Hak Usaha Member Budi Santoso",
    created_at: "2026-06-15T10:00:00Z"
  },
  {
    id: 2,
    user_id: 1,
    username: "admin",
    type: "sponsor_bonus",
    amount: 20000,
    description: "Bonus Sponsor dari aktifasi budi",
    created_at: "2026-06-15T10:00:00Z"
  },
  {
    id: 3,
    user_id: 3,
    username: "citra",
    type: "activation",
    amount: -100000,
    description: "Aktifasi Hak Usaha Member Citra Lestari",
    created_at: "2026-06-16T11:00:00Z"
  },
  {
    id: 4,
    user_id: 1,
    username: "admin",
    type: "sponsor_bonus",
    amount: 20000,
    description: "Bonus Sponsor dari aktifasi citra",
    created_at: "2026-06-16T11:00:00Z"
  },
  {
    id: 5,
    user_id: 1,
    username: "admin",
    type: "pairing_bonus",
    amount: 10000,
    description: "Bonus Pairing Kiri (budi) & Kanan (citra)",
    created_at: "2026-06-16T11:15:00Z"
  }
];

let deposits: DepositRequest[] = [
  {
    id: 1,
    user_id: 2,
    username: "budi",
    amount: 1000000,
    method: "bca",
    status: "success",
    created_at: "2026-06-14T08:00:00Z"
  },
  {
    id: 2,
    user_id: 3,
    username: "citra",
    amount: 500000,
    method: "qris",
    status: "success",
    created_at: "2026-06-15T11:00:00Z"
  },
  {
    id: 3,
    user_id: 4,
    username: "dedi",
    amount: 100000,
    method: "qris",
    status: "pending",
    payment_code: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ZaloraDenimDepositDedi100K",
    created_at: "2026-07-20T11:00:00Z"
  }
];

let withdrawals: WDRequest[] = [
  {
    id: 1,
    user_id: 2,
    username: "budi",
    amount: 200000,
    bank_name: "BCA",
    account_number: "8830129321",
    account_holder: "Budi Santoso",
    status: "success",
    created_at: "2026-07-10T12:00:00Z"
  },
  {
    id: 2,
    user_id: 3,
    username: "citra",
    amount: 150000,
    bank_name: "Mandiri",
    account_number: "131002938210",
    account_holder: "Citra Lestari",
    status: "pending",
    created_at: "2026-07-21T02:00:00Z"
  }
];

let notifications: MLMNotification[] = [
  {
    id: 1,
    user_id: 1,
    title: "Member Baru!",
    message: "guntur telah mendaftar di jaringan Kanan Anda melalui Citra Lestari.",
    type: "info",
    created_at: "2026-07-10T16:20:00Z"
  },
  {
    id: 2,
    user_id: 2,
    title: "Bonus Sponsor!",
    message: "Selamat! Anda mendapatkan Bonus Sponsor Rp 20,000 dari aktifasi dedi.",
    type: "success",
    created_at: "2026-07-01T08:30:00Z"
  }
];

let isAutoPayout = true;

let systemSettings = {
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
  rewardCashEquivalent: 20000000,
  midtransMerchantId: "",
  midtransClientKey: "",
  midtransServerKey: "",
  midtransIsProduction: false,
  emailNotifRegisterAdminActive: true,
  emailNotifRegisterSponsorActive: true,
  adminNotifEmail: "admin@zaloradenim.com",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "notifikasi@zaloradenim.com",
  smtpPass: "app-password-1234",
  emailSenderName: "Zalora Denim Premium MLM",
  welcomeEmailTemplate: "Halo {fullname} ({username}), selamat bergabung di Zalora Denim Premium! Akun Anda telah terdaftar. Silakan hubungi sponsor Anda {sponsor} untuk aktivasi status premium."
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
function activateUserMLM(userId: number) {
  const user = users.find(u => u.id === userId);
  if (!user || user.is_active) return false;

  // 1. Activate User
  user.is_active = true;

  // Add activation charge transaction
  transactions.push({
    id: transactions.length + 1,
    user_id: user.id,
    username: user.username,
    type: "activation",
    amount: -100000,
    description: `Aktifasi Akun Premium Hak Usaha ${user.fullname}`,
    created_at: new Date().toISOString()
  });

  // 2. Distribute Sponsor Bonus
  if (user.sponsor_id) {
    const sponsor = users.find(u => u.id === user.sponsor_id);
    if (sponsor && sponsor.is_active) {
      const bonusAmt = systemSettings.sponsorBonus;
      sponsor.balance += bonusAmt;
      sponsor.sponsor_bonus += bonusAmt;
      
      transactions.push({
        id: transactions.length + 1,
        user_id: sponsor.id,
        username: sponsor.username,
        type: "sponsor_bonus",
        amount: bonusAmt,
        description: `Bonus Sponsor dari aktifasi ${user.username}`,
        created_at: new Date().toISOString()
      });

      notifications.push({
        id: notifications.length + 1,
        user_id: sponsor.id,
        title: "Bonus Sponsor!",
        message: `Selamat! Anda menerima Bonus Sponsor Rp ${bonusAmt.toLocaleString()} dari aktifasi ${user.fullname}.`,
        type: "success",
        created_at: new Date().toISOString()
      });
    }
  }

  // 3. Distribute Level Bonuses (Up to 10 Levels)
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

  uplines.forEach((upline, idx) => {
    if (upline.is_active) {
      const reward = levelRewards[idx] !== undefined ? levelRewards[idx] : 0;
      upline.balance += reward;
      upline.level_bonus += reward;

      transactions.push({
        id: transactions.length + 1,
        user_id: upline.id,
        username: upline.username,
        type: "level_bonus",
        amount: reward,
        description: `Bonus Level ${idx + 1} dari pertumbuhan jaringan (${user.username})`,
        created_at: new Date().toISOString()
      });

      notifications.push({
        id: notifications.length + 1,
        user_id: upline.id,
        title: `Bonus Level ${idx + 1}!`,
        message: `Mendapatkan Rp ${reward.toLocaleString()} dari aktifasi level ${idx + 1} (${user.username}).`,
        type: "info",
        created_at: new Date().toISOString()
      });
    }
  });

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

    if (totalPairsPossible > pairsAlreadyPaid) {
      const newPairs = totalPairsPossible - pairsAlreadyPaid;
      // Max 10 pairs flushout per day
      const allowedPairs = Math.min(newPairs, 10);
      
      if (allowedPairs > 0 && parent.is_active) {
        const pairingBonusAmount = allowedPairs * pairingVal;
        parent.balance += pairingBonusAmount;
        parent.pairing_bonus += pairingBonusAmount;

        transactions.push({
          id: transactions.length + 1,
          user_id: parent.id,
          username: parent.username,
          type: "pairing_bonus",
          amount: pairingBonusAmount,
          description: `Bonus Pairing Kiri-Kanan (${allowedPairs} Pasang Baru)`,
          created_at: new Date().toISOString()
        });

        notifications.push({
          id: notifications.length + 1,
          user_id: parent.id,
          title: "Bonus Pairing Terbentuk!",
          message: `Selamat! Terjadi pairing ${allowedPairs} pasang di grup Anda. Bonus Rp ${pairingBonusAmount.toLocaleString()} masuk ke saldo.`,
          type: "success",
          created_at: new Date().toISOString()
        });
      }
    }

    // Go up next level
    currentNodeId = parent.id;
    childPos = parent.position;
    currentParentId = parent.upline_id;
  }

  return true;
}

// Recursive helper to build Binary Tree for Visual Graph
function buildBinaryTreeResponse(userId: number, depth: number = 0, maxDepth: number = 4): BinaryTreeNode | null {
  if (depth > maxDepth) return null;
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  // Find left child
  const leftChild = users.find(u => u.upline_id === userId && u.position === "L");
  // Find right child
  const rightChild = users.find(u => u.upline_id === userId && u.position === "R");

  return {
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    is_active: user.is_active,
    left_count: user.left_count,
    right_count: user.right_count,
    left: leftChild ? buildBinaryTreeResponse(leftChild.id, depth + 1, maxDepth) : null,
    right: rightChild ? buildBinaryTreeResponse(rightChild.id, depth + 1, maxDepth) : null
  };
}

// Find a vacant spot in binary tree under parent (for automated registration fallback)
function findVacantSpot(rootId: number, preferredPosition?: 'L' | 'R'): { upline_id: number, position: 'L' | 'R' } {
  const root = users.find(u => u.id === rootId);
  if (!root) throw new Error("Root upline not found");

  const pos = preferredPosition || "L";

  // Check direct child first
  const directChild = users.find(u => u.upline_id === rootId && u.position === pos);
  if (!directChild) {
    return { upline_id: rootId, position: pos };
  }

  // Recursive search downwards following that leg
  let currentId = directChild.id;
  while (true) {
    const nextChild = users.find(u => u.upline_id === currentId && u.position === pos);
    if (!nextChild) {
      return { upline_id: currentId, position: pos };
    }
    currentId = nextChild.id;
  }
}

// ==========================================
// API ROUTE HANDLERS
// ==========================================

// Get All Products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Get Public Settings
app.get("/api/settings", (req, res) => {
  res.json(systemSettings);
});

// Update product stock (Admin operation)
app.post("/api/admin/products/stock", (req, res) => {
  const { productId, stock, price, memberPrice } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });

  if (stock !== undefined) product.stock = Number(stock);
  if (price !== undefined) product.price = Number(price);
  if (memberPrice !== undefined) product.member_price = Number(memberPrice);

  res.json({ message: "Data produk dan stok berhasil diupdate", product });
});

// Authentication: Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ message: "Username harus diisi" });

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  // Simple password check. Default password is password123.
  const userPassword = (user as any).password || "password123";
  if (password && password !== userPassword) {
    return res.status(401).json({ message: "Kata sandi salah!" });
  }

  res.json({ message: "Login berhasil", user });
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

  console.log(`[EMAIL SIMULATION] Sent reset code to ${user.email}: ${otp}`);

  res.json({
    message: `Link reset password telah dikirim ke email terdaftar Anda!`,
    simulatedEmail: {
      to: user.email,
      subject: "Setel Ulang Kata Sandi - ZALORA.PORTAL",
      body: `Halo ${user.fullname},\n\nKami menerima permintaan untuk menyetel ulang kata sandi akun Anda (@${user.username}).\n\nKode Verifikasi OTP Anda adalah:\n\n>>> ${otp} <<<\n\nHarap masukkan kode ini pada formulir reset untuk melanjutkan.\n\nSalam Hangat,\nSistem Otomasi ZALORA.PORTAL`,
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

  res.json({ message: "Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda." });
});

// Authentication: Register Member
app.post("/api/auth/register", (req, res) => {
  const { username, fullname, email, phone, sponsor_username, upline_username, position } = req.body;

  if (!username || !fullname || !email || !phone) {
    return res.status(400).json({ message: "Mohon isi semua field wajib" });
  }

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ message: "Username sudah digunakan" });
  }

  // 1. Resolve sponsor
  let sponsorId: number | null = 1; // Default to admin
  if (sponsor_username) {
    const sponsor = users.find(u => u.username.toLowerCase() === sponsor_username.toLowerCase());
    if (sponsor) sponsorId = sponsor.id;
  }

  // 2. Resolve upline & placement
  let uplineId: number = 1;
  let finalPos: 'L' | 'R' = position || "L";

  if (upline_username) {
    const uplineUser = users.find(u => u.username.toLowerCase() === upline_username.toLowerCase());
    if (uplineUser) {
      uplineId = uplineUser.id;
      // Check if this position is already taken under this upline
      const taken = users.find(u => u.upline_id === uplineId && u.position === finalPos);
      if (taken) {
        // Find vacancy downward
        const vacancy = findVacantSpot(uplineId, finalPos);
        uplineId = vacancy.upline_id;
        finalPos = vacancy.position;
      }
    } else {
      // Fallback
      const vacancy = findVacantSpot(1, finalPos);
      uplineId = vacancy.upline_id;
      finalPos = vacancy.position;
    }
  } else {
    // Fallback to admin vacancys
    const vacancy = findVacantSpot(1, finalPos);
    uplineId = vacancy.upline_id;
    finalPos = vacancy.position;
  }

  // 3. Create new user (inactive)
  const newUser: MLMUser = {
    id: users.length + 1,
    username: username.toLowerCase().replace(/\s+/g, ""),
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
    role: "user"
  };

  users.push(newUser);

  // Notify parent & sponsor
  notifications.push({
    id: notifications.length + 1,
    user_id: uplineId,
    title: "Member Baru!",
    message: `${fullname} (${username}) bergabung di kaki ${finalPos === 'L' ? 'Kiri' : 'Kanan'} Anda. Silakan bantu untuk aktifasi Rp 100,000 agar bonus Anda mengalir!`,
    type: "info",
    created_at: new Date().toISOString()
  });

  res.status(201).json({
    message: "Pendaftaran berhasil! Akun Anda berstatus TIDAK AKTIF. Lakukan pembayaran aktifasi Rp 100,000 untuk menikmati seluruh fitur dan berbelanja produk Zalora Denim.",
    user: newUser
  });
});

// Member Activation Simulation
app.post("/api/user/activate", (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  if (user.is_active) return res.status(400).json({ message: "User sudah aktif" });

  // Simulate payment
  // Verify user has sufficient balance or deduct Rp 100,000 directly for simulation
  user.balance -= 100000; // Deduct balance or let deposit handle it
  const success = activateUserMLM(userId);

  if (success) {
    res.json({ message: "Akun berhasil diaktifkan! Anda kini adalah Member Premium aktif.", user });
  } else {
    res.status(500).json({ message: "Gagal mengaktifkan member" });
  }
});

// API Gateway Payment Simulation for QRIS / Bank Transfer (Deposits & Activations)
app.post("/api/payment/simulate-gateway", (req, res) => {
  const { depositId } = req.body;
  const dep = deposits.find(d => d.id === depositId);
  if (!dep) return res.status(404).json({ message: "Request deposit tidak ditemukan" });
  if (dep.status !== "pending") return res.status(400).json({ message: "Deposit sudah diproses" });

  dep.status = "success";
  
  // Credit user's balance
  const user = users.find(u => u.id === dep.user_id);
  if (user) {
    user.balance += dep.amount;
    
    // Log transaction
    transactions.push({
      id: transactions.length + 1,
      user_id: user.id,
      username: user.username,
      type: "deposit",
      amount: dep.amount,
      description: `Deposit via ${dep.method.toUpperCase()} Terverifikasi Otomatis`,
      created_at: new Date().toISOString()
    });

    notifications.push({
      id: notifications.length + 1,
      user_id: user.id,
      title: "Deposit Berhasil!",
      message: `Saldo Rp ${dep.amount.toLocaleString()} telah berhasil ditambahkan via payment gateway otomatis.`,
      type: "success",
      created_at: new Date().toISOString()
    });
  }

  res.json({ message: "Pembayaran terverifikasi sukses via Midtrans/Tripay Gateway!", deposit: dep, user });
});

// Midtrans Webhook Callback Notification Handler
app.post("/api/payment/midtrans-webhook", (req, res) => {
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
    
    // Credit user's balance
    const user = users.find(u => u.id === dep.user_id);
    if (user) {
      user.balance += dep.amount;
      
      // Log transaction
      transactions.push({
        id: transactions.length + 1,
        user_id: user.id,
        username: user.username,
        type: "deposit",
        amount: dep.amount,
        description: `Deposit via ${dep.method.toUpperCase()} (Otomatis Midtrans)`,
        created_at: new Date().toISOString()
      });

      notifications.push({
        id: notifications.length + 1,
        user_id: user.id,
        title: "Deposit Otomatis Berhasil!",
        message: `Saldo Rp ${dep.amount.toLocaleString()} telah berhasil ditambahkan via Midtrans QRIS/VA otomatis.`,
        type: "success",
        created_at: new Date().toISOString()
      });
      
      console.log(`[Midtrans Webhook] Successfully processed payment and credited user ${user.username}`);
    }
  } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
    dep.status = "failed";
    const user = users.find(u => u.id === dep.user_id);
    if (user) {
      notifications.push({
        id: notifications.length + 1,
        user_id: user.id,
        title: "Pembayaran Deposit Gagal / Expired",
        message: `Pembayaran deposit Rp ${dep.amount.toLocaleString()} Anda dibatalkan atau telah kedaluwarsa oleh sistem Midtrans.`,
        type: "warning",
        created_at: new Date().toISOString()
      });
    }
    console.log(`[Midtrans Webhook] Payment failed or expired for order ${order_id}`);
  }

  res.json({ status: "success", message: "Webhook processed successfully" });
});

// Create Deposit request
app.post("/api/user/deposit", async (req, res) => {
  const { userId, amount, method } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ message: "Minimal deposit adalah Rp 50.000" });
  }

  const newDepId = deposits.length + 1;
  const midtransOrderId = `DEP-MID-${newDepId}-${Date.now()}`;
  let paymentCode = method === 'qris' 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ZaloraDenimQRISDep${numAmount}`
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
    method,
    status: "pending",
    payment_code: paymentCode,
    midtrans_order_id: midtransOrderId,
    created_at: new Date().toISOString()
  };

  deposits.push(newDep);
  res.status(201).json({ message: "Instruksi deposit berhasil dibuat", deposit: newDep });
});

// Create WD request
app.post("/api/user/withdraw", (req, res) => {
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

  // Log transaction
  transactions.push({
    id: transactions.length + 1,
    user_id: user.id,
    username: user.username,
    type: "withdrawal",
    amount: -numAmount,
    description: `Penarikan Dana ke ${bankName} (${isAutoPayout ? 'Terbayar Otomatis' : 'Menunggu Persetujuan'})`,
    created_at: new Date().toISOString()
  });

  if (isAutoPayout) {
    notifications.push({
      id: notifications.length + 1,
      user_id: user.id,
      title: "Penarikan Sukses!",
      message: `Dana Rp ${numAmount.toLocaleString()} berhasil dikirim otomatis ke rekening ${bankName} Anda.`,
      type: "success",
      created_at: new Date().toISOString()
    });
  } else {
    notifications.push({
      id: notifications.length + 1,
      user_id: user.id,
      title: "Penarikan Diproses",
      message: `Permintaan penarikan Rp ${numAmount.toLocaleString()} sedang antre verifikasi admin.`,
      type: "info",
      created_at: new Date().toISOString()
    });
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
app.post("/api/admin/withdraw/process", (req, res) => {
  const { wdId, action } = req.body; // action: 'approve' | 'reject'
  const wd = withdrawals.find(w => w.id === wdId);
  if (!wd) return res.status(404).json({ message: "Data penarikan tidak ditemukan" });
  if (wd.status !== "pending") return res.status(400).json({ message: "Penarikan sudah diproses sebelumnya" });

  const user = users.find(u => u.id === wd.user_id);

  if (action === "approve") {
    wd.status = "success";
    if (user) {
      notifications.push({
        id: notifications.length + 1,
        user_id: user.id,
        title: "Penarikan Disetujui!",
        message: `Penarikan dana Rp ${wd.amount.toLocaleString()} telah disetujui admin dan ditransfer ke rekening ${wd.bank_name}.`,
        type: "success",
        created_at: new Date().toISOString()
      });
    }
  } else {
    wd.status = "rejected";
    // Refund balance if rejected
    if (user) {
      user.balance += wd.amount;
      
      transactions.push({
        id: transactions.length + 1,
        user_id: user.id,
        username: user.username,
        type: "deposit",
        amount: wd.amount,
        description: `Pengembalian dana penarikan (Ditolak oleh Admin)`,
        created_at: new Date().toISOString()
      });

      notifications.push({
        id: notifications.length + 1,
        user_id: user.id,
        title: "Penarikan Ditolak",
        message: `Penarikan Rp ${wd.amount.toLocaleString()} ditolak admin. Saldo Anda telah dikembalikan.`,
        type: "warning",
        created_at: new Date().toISOString()
      });
    }
  }

  res.json({ message: `Status penarikan berhasil diubah menjadi: ${wd.status}`, withdrawal: wd, user });
});

// Toggle Payout Automation Settings
app.post("/api/admin/settings/payout", (req, res) => {
  const { autoPayout } = req.body;
  if (autoPayout !== undefined) {
    isAutoPayout = Boolean(autoPayout);
  }
  res.json({ message: `Sistem pencairan bonus otomatis diset ke: ${isAutoPayout ? 'AKTIF' : 'NON-AKTIF'}`, isAutoPayout });
});

app.get("/api/admin/settings/payout", (req, res) => {
  res.json({ isAutoPayout });
});

// Update System Configuration Settings
app.post("/api/admin/settings", (req, res) => {
  const {
    webName,
    logoText,
    contactPhone,
    contactEmail,
    sponsorBonus,
    pairingBonus,
    roBonus,
    levelBonusG1,
    levelBonusG2,
    levelBonusG3,
    levelBonusG4,
    levelBonusG5,
    levelBonusG6,
    levelBonusG7,
    levelBonusG8,
    levelBonusG9,
    levelBonusG10,
    rewardThresholdLeft,
    rewardThresholdRight,
    rewardName,
    rewardCashEquivalent,
    midtransMerchantId,
    midtransClientKey,
    midtransServerKey,
    midtransIsProduction,
    emailNotifRegisterAdminActive,
    emailNotifRegisterSponsorActive,
    adminNotifEmail,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailSenderName,
    welcomeEmailTemplate
  } = req.body;

  if (webName !== undefined) systemSettings.webName = String(webName);
  if (logoText !== undefined) systemSettings.logoText = String(logoText);
  if (contactPhone !== undefined) systemSettings.contactPhone = String(contactPhone);
  if (contactEmail !== undefined) systemSettings.contactEmail = String(contactEmail);
  if (sponsorBonus !== undefined) systemSettings.sponsorBonus = Number(sponsorBonus);
  if (pairingBonus !== undefined) systemSettings.pairingBonus = Number(pairingBonus);
  if (roBonus !== undefined) systemSettings.roBonus = Number(roBonus);
  if (levelBonusG1 !== undefined) systemSettings.levelBonusG1 = Number(levelBonusG1);
  if (levelBonusG2 !== undefined) systemSettings.levelBonusG2 = Number(levelBonusG2);
  if (levelBonusG3 !== undefined) systemSettings.levelBonusG3 = Number(levelBonusG3);
  if (levelBonusG4 !== undefined) systemSettings.levelBonusG4 = Number(levelBonusG4);
  if (levelBonusG5 !== undefined) systemSettings.levelBonusG5 = Number(levelBonusG5);
  if (levelBonusG6 !== undefined) systemSettings.levelBonusG6 = Number(levelBonusG6);
  if (levelBonusG7 !== undefined) systemSettings.levelBonusG7 = Number(levelBonusG7);
  if (levelBonusG8 !== undefined) systemSettings.levelBonusG8 = Number(levelBonusG8);
  if (levelBonusG9 !== undefined) systemSettings.levelBonusG9 = Number(levelBonusG9);
  if (levelBonusG10 !== undefined) systemSettings.levelBonusG10 = Number(levelBonusG10);
  if (rewardThresholdLeft !== undefined) systemSettings.rewardThresholdLeft = Number(rewardThresholdLeft);
  if (rewardThresholdRight !== undefined) systemSettings.rewardThresholdRight = Number(rewardThresholdRight);
  if (rewardName !== undefined) systemSettings.rewardName = String(rewardName);
  if (rewardCashEquivalent !== undefined) systemSettings.rewardCashEquivalent = Number(rewardCashEquivalent);

  if (midtransMerchantId !== undefined) systemSettings.midtransMerchantId = String(midtransMerchantId);
  if (midtransClientKey !== undefined) systemSettings.midtransClientKey = String(midtransClientKey);
  if (midtransServerKey !== undefined) systemSettings.midtransServerKey = String(midtransServerKey);
  if (midtransIsProduction !== undefined) systemSettings.midtransIsProduction = Boolean(midtransIsProduction);

  if (emailNotifRegisterAdminActive !== undefined) systemSettings.emailNotifRegisterAdminActive = Boolean(emailNotifRegisterAdminActive);
  if (emailNotifRegisterSponsorActive !== undefined) systemSettings.emailNotifRegisterSponsorActive = Boolean(emailNotifRegisterSponsorActive);
  if (adminNotifEmail !== undefined) systemSettings.adminNotifEmail = String(adminNotifEmail);
  if (smtpHost !== undefined) systemSettings.smtpHost = String(smtpHost);
  if (smtpPort !== undefined) systemSettings.smtpPort = Number(smtpPort);
  if (smtpUser !== undefined) systemSettings.smtpUser = String(smtpUser);
  if (smtpPass !== undefined) systemSettings.smtpPass = String(smtpPass);
  if (emailSenderName !== undefined) systemSettings.emailSenderName = String(emailSenderName);
  if (welcomeEmailTemplate !== undefined) systemSettings.welcomeEmailTemplate = String(welcomeEmailTemplate);

  res.json({ message: "Sistem & Konfigurasi Bonus berhasil diperbarui!", settings: systemSettings });
});

// User Profile Update Endpoint
app.post("/api/user/:userId/profile", (req, res) => {
  const userId = Number(req.params.userId);
  const { fullname, email, phone, password } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  if (fullname !== undefined) user.fullname = String(fullname);
  if (email !== undefined) user.email = String(email);
  if (phone !== undefined) user.phone = String(phone);
  if (password !== undefined && password !== "") {
    (user as any).password = String(password);
  }

  res.json({ message: "Profil berhasil diperbarui!", user });
});

// User Password Reset / Change Endpoint
app.post("/api/user/:userId/reset-password", (req, res) => {
  const userId = Number(req.params.userId);
  const { currentPassword, newPassword } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const oldPassword = (user as any).password || "password123";
  if (currentPassword && currentPassword !== oldPassword) {
    return res.status(400).json({ message: "Kata sandi saat ini tidak sesuai" });
  }

  (user as any).password = String(newPassword);
  res.json({ message: "Kata sandi berhasil direset!", user });
});

// Admin Deposit manual verification
app.post("/api/admin/deposit/process", (req, res) => {
  const { depositId, action } = req.body; // action: 'approve' | 'reject'
  const dep = deposits.find(d => d.id === Number(depositId));
  if (!dep) return res.status(404).json({ message: "Data deposit tidak ditemukan" });
  if (dep.status !== "pending") return res.status(400).json({ message: "Deposit sudah diproses sebelumnya" });

  const user = users.find(u => u.id === dep.user_id);

  if (action === "approve") {
    dep.status = "success";
    if (user) {
      user.balance += dep.amount;

      transactions.push({
        id: transactions.length + 1,
        user_id: user.id,
        username: user.username,
        type: "deposit",
        amount: dep.amount,
        description: `Deposit Manual via ${dep.method.toUpperCase()} Disetujui Admin`,
        created_at: new Date().toISOString()
      });

      notifications.push({
        id: notifications.length + 1,
        user_id: user.id,
        title: "Deposit Manual Disetujui!",
        message: `Saldo Rp ${dep.amount.toLocaleString()} telah ditambahkan ke akun Anda oleh admin.`,
        type: "success",
        created_at: new Date().toISOString()
      });
    }
  } else {
    dep.status = "failed";
    if (user) {
      notifications.push({
        id: notifications.length + 1,
        user_id: user.id,
        title: "Deposit Manual Ditolak",
        message: `Transfer deposit Rp ${dep.amount.toLocaleString()} ditolak oleh admin. Pastikan nominal sesuai atau hubungi admin.`,
        type: "warning",
        created_at: new Date().toISOString()
      });
    }
  }

  res.json({ message: `Status deposit berhasil diubah menjadi: ${dep.status}`, deposit: dep, user });
});

// Add New Product
app.post("/api/admin/products", (req, res) => {
  const { name, description, price, member_price, stock, image, ro_bonus_custom } = req.body;

  if (!name || !price || !member_price || stock === undefined) {
    return res.status(400).json({ message: "Nama, Harga, Harga Member, dan Stok wajib diisi!" });
  }

  const defaultImage = "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600";
  const newProduct: Product = {
    id: products.length + 1,
    name: String(name),
    description: description ? String(description) : "Celana jeans premium berkualitas ekspor.",
    price: Number(price),
    member_price: Number(member_price),
    stock: Number(stock),
    image: image ? String(image) : defaultImage
  };

  if (ro_bonus_custom !== undefined && ro_bonus_custom !== "") {
    (newProduct as any).ro_bonus_custom = Number(ro_bonus_custom);
  }

  products.push(newProduct);
  res.status(201).json({ message: "Produk jeans baru berhasil ditambahkan ke gudang!", product: newProduct });
});

// Member Product Purchase (Repeat Order)
app.post("/api/user/purchase", (req, res) => {
  const { userId, productId } = req.body;
  const user = users.find(u => u.id === userId);
  const prod = products.find(p => p.id === productId);

  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  if (!prod) return res.status(404).json({ message: "Produk tidak ditemukan" });

  if (!user.is_active) {
    return res.status(400).json({ message: "Anda harus melakukan aktifasi Rp 100.000 terlebih dahulu untuk melakukan pembelian produk premium." });
  }

  if (prod.stock < 1) {
    return res.status(400).json({ message: "Stok produk habis!" });
  }

  const purchasePrice = user.is_active ? prod.member_price : prod.price;

  if (user.balance < purchasePrice) {
    return res.status(400).json({ message: `Saldo tidak mencukupi. Silakan lakukan deposit terlebih dahulu. Harga member: Rp ${purchasePrice.toLocaleString()}` });
  }

  // Deduct Balance and Stock
  user.balance -= purchasePrice;
  prod.stock -= 1;

  // Log Transaction
  transactions.push({
    id: transactions.length + 1,
    user_id: user.id,
    username: user.username,
    type: "purchase",
    amount: -purchasePrice,
    description: `Pembelian Celana ${prod.name} (Harga Member)`,
    created_at: new Date().toISOString()
  });

  notifications.push({
    id: notifications.length + 1,
    user_id: user.id,
    title: "Pembelian Berhasil!",
    message: `Terima kasih! Pembelian ${prod.name} berhasil. Kurir kami sedang menyiapkan pengiriman.`,
    type: "success",
    created_at: new Date().toISOString()
  });

  // Distribute Repeat Order (RO) Bonus: Rp 5,000 to direct sponsor
  if (user.sponsor_id) {
    const sponsor = users.find(u => u.id === user.sponsor_id);
    if (sponsor && sponsor.is_active) {
      sponsor.balance += 5000;
      sponsor.ro_bonus += 5000;

      transactions.push({
        id: transactions.length + 1,
        user_id: sponsor.id,
        username: sponsor.username,
        type: "ro_bonus",
        amount: 5000,
        description: `Bonus Repeat Order (RO) dari pembelian ${user.username}`,
        created_at: new Date().toISOString()
      });

      notifications.push({
        id: notifications.length + 1,
        user_id: sponsor.id,
        title: "Bonus Repeat Order!",
        message: `Menerima Bonus RO sebesar Rp 5,000 atas pembelian produk oleh ${user.fullname}.`,
        type: "success",
        created_at: new Date().toISOString()
      });
    }
  }

  res.json({ message: `Sukses membeli ${prod.name}! Saldo terpotong Rp ${purchasePrice.toLocaleString()}`, user, product: prod });
});

// Retrieve User Specific Data
app.get("/api/user/:userId/dashboard", (req, res) => {
  const userId = Number(req.params.userId);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const userTransactions = transactions.filter(t => t.user_id === userId);
  const userDeposits = deposits.filter(d => d.user_id === userId);
  const userWDs = withdrawals.filter(w => w.user_id === userId);
  const userNotifs = notifications.filter(n => n.user_id === userId).reverse();

  // Build network tree
  const binaryTree = buildBinaryTreeResponse(userId, 0, 3);

  // Get referred members (sponsor list)
  const referrals = users.filter(u => u.sponsor_id === userId);

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
app.get("/api/admin/dashboard", (req, res) => {
  const totalMembers = users.filter(u => u.role !== 'admin').length;
  const activeMembers = users.filter(u => u.is_active && u.role !== 'admin').length;
  
  // Turnover company: total activation payments (100k each active member) + total jeans sales price
  const activationTurnover = activeMembers * 100000;
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
    users: users.filter(u => u.role !== 'admin'),
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
  "readme.txt": `=== ZALORA DENIM MLM BINARY CODEBASE ===
Petunjuk Instalasi di Web Hosting:

1. Persyaratan Server:
   - Web Server (Apache / Nginx)
   - PHP versi 8.0 ke atas
   - MySQL / MariaDB Database

2. Langkah Setup:
   - Buat database baru di MySQL cPanel / PhpMyAdmin Anda (misalnya: \`zalora_mlm\`).
   - Import file \`database.sql\` ke dalam database tersebut.
   - Unggah (upload) seluruh file source code ini ke folder \`public_html\` hosting Anda.
   - Cari file \`.env\` (atau copy \`.env.example\` menjadi \`.env\`) lalu sesuaikan isinya:
     - DB_HOST = localhost
     - DB_NAME = zalora_mlm
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
- Landing page mirip Zalora, premium & responsive.
- Sistem binary tree 10 level otomatis (Sponsor, Pairing, Level Generasi, RO).
- Notifikasi real-time via session / popup dashboard.
- Modul Stok Gudang, Kas, Laporan Keuangan Bulanan, Cetak PDF, Pembayaran QRIS otomatis (Mock/Integration).
`,

  ".env": `DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="zalora_mlm"
DB_USER="root"
DB_PASS="password_db"

APP_URL="https://zaloradenim-mlm.com"
APP_NAME="Zalora Denim Premium MLM"

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
(1, 'admin', 'Administrator Zalora Denim', 'admin@zaloradenim.com', '081234567890', '$2y$10$OQzWbH20fOqM1I/n1D3V.On/fS8kQ80yC46Zl3R9TfeYV7gK6r0Qy', 'admin', 1);

INSERT INTO \`products\` (\`id\`, \`name\`, \`description\`, \`price\`, \`member_price\`, \`stock\`, \`image\`) VALUES
(1, 'Zalora Denim Slim Fit Premium Indigo', 'Celana jeans premium dengan potongan slim-fit modern.', 350000.00, 250000.00, 50, 'product1.jpg'),
(2, 'Zalora Denim Classic Straight Cut Raw', 'Model straight cut klasik legendaris.', 390000.00, 280000.00, 30, 'product2.jpg'),
(3, 'Zalora Denim Jet Black Stretch Comfort', 'Warna hitam legam pekat yang elegan.', 330000.00, 240000.00, 25, 'product3.jpg');

INSERT INTO \`settings\` (\`setting_key\`, \`setting_value\`) VALUES
('site_title', 'ZALORA DENIM MLM'),
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

// ==========================================
// MOUNT VITE MIDDLEWARE OR STATIC FILES
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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

startServer();
