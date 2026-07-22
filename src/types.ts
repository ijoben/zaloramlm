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
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  member_price: number;
  stock: number;
  image: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  username: string;
  type: 'activation' | 'purchase' | 'sponsor_bonus' | 'pairing_bonus' | 'level_bonus' | 'ro_bonus' | 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  created_at: string;
}

export interface DepositRequest {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  method: 'qris' | 'bca' | 'mandiri';
  status: 'pending' | 'success' | 'failed';
  payment_code?: string;
  created_at: string;
  midtrans_order_id?: string;
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
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}
