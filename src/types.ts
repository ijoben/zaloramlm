export interface MLMUser {
  id: number;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  is_active: boolean; // Activated after paying IDR 100,000
  upline_id: number | null; // Parent in binary tree
  position: 'L' | 'R' | null; // Left or Right leg of parent
  sponsor_id: number | null; // Who invited them
  sponsor_username?: string;
  balance: number;
  sponsor_bonus: number;
  pairing_bonus: number;
  level_bonus: number;
  ro_bonus: number;
  left_count: number; // Total members in left leg
  right_count: number; // Total members in right leg
  left_sales: number; // Total active sales left leg (for pairing/reward)
  right_sales: number; // Total active sales right leg (for pairing/reward)
  created_at: string;
  role: 'user' | 'admin';
  password?: string;
  firebase_uid?: string;
  ktp?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  wishlist?: number[];
  profile_photo?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  member_price: number;
  stock: number;
  image: string;
  sizes?: string[];
  colors?: string[];
}

export interface Transaction {
  id: number;
  user_id: number;
  username: string;
  type: 'activation' | 'purchase' | 'sponsor_bonus' | 'pairing_bonus' | 'level_bonus' | 'ro_bonus' | 'deposit' | 'withdrawal' | 'refund' | 'bonus_produk';
  amount: number;
  description: string;
  status?: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface DepositRequest {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  unique_code?: number;
  method: 'qris' | 'bca' | 'mandiri' | 'transfer_bank' | string;
  status: 'pending' | 'success' | 'failed';
  payment_code?: string;
  created_at: string;
  midtrans_order_id?: string;
  proof_image?: string;
  proof_notes?: string;
  proof_submitted_at?: string;
}

export interface WDRequest {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: 'pending' | 'success' | 'rejected';
  created_at: string;
}

export interface MLMNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  created_at: string;
}

export interface BinaryTreeNode {
  id: number;
  username: string;
  fullname: string;
  is_active: boolean;
  left_count: number;
  right_count: number;
  left_sales?: number;
  right_sales?: number;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  cta?: string;
  categoryTarget?: string;
}

export interface SystemSettings {
  memberIdPrefix?: string;
  sponsorBonus?: number;
  pairingBonus?: number;
  levelBonusG1?: number;
  levelBonusG2?: number;
  levelBonusG3?: number;
  levelBonusG4?: number;
  levelBonusG5?: number;
  levelBonusG6?: number;
  levelBonusG7?: number;
  levelBonusG8?: number;
  levelBonusG9?: number;
  levelBonusG10?: number;
  rewardThresholdLeft?: number;
  rewardThresholdRight?: number;
  rewardName?: string;
  rewardCashEquivalent?: number;
  isAutoPayout?: boolean;
  enableMlmBonus?: boolean;
  enableLevelBonus?: boolean;
  enableRewardBonus?: boolean;
  logoUrl?: string;
  iconUrl?: string;
  slogan?: string;
  siteDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  shippingTrackingMode?: 'MANUAL' | 'AUTO_API';
  shippingApiKey?: string;
  enableMidtrans?: boolean;
  midtransMerchantId?: string;
  midtransClientKey?: string;
  midtransServerKey?: string;
  midtransIsProduction?: boolean;
  companyBankName?: string;
  companyBankAccount?: string;
  companyBankHolder?: string;
  companyBank2Name?: string;
  companyBank2Account?: string;
  companyBank2Holder?: string;
  companyBank3Name?: string;
  companyBank3Account?: string;
  companyBank3Holder?: string;
  companyBankInstruction?: string;
  emailNotifRegisterAdminActive?: boolean;
  emailNotifRegisterSponsorActive?: boolean;
  adminNotifEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  emailSenderName?: string;
  welcomeEmailTemplate?: string;
  // Landing Page CMS content fields
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  featuresTitle?: string;
  featuresSubtitle?: string;
  aboutTitle?: string;
  aboutContent?: string;
  catalogTitle?: string;
  catalogSubtitle?: string;
  faqTitle?: string;
  footerAbout?: string;
  heroSliders?: HeroSlide[];
}

export interface OrderStep {
  title: string;
  time: string;
  done: boolean;
  description?: string;
}

export interface Order {
  id: number;
  invoice_no: string;
  user_id: number;
  username: string;
  fullname: string;
  phone: string;
  address: string;
  product_name: string;
  selected_size?: string;
  selected_color?: string;
  amount: number;
  unique_code?: number;
  payment_method?: string;
  status: 'PENDING' | 'DIPROSES' | 'DIKIRIM' | 'SELESAI' | 'DIBATALKAN' | 'TERIMA' | 'BATAL';
  courier: string;
  tracking_number: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  steps?: OrderStep[];
}
