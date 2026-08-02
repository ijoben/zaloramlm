import { MLMUser } from "../types";

export const DEFAULT_USERS: MLMUser[] = [
  {
    id: 1,
    username: "admin",
    fullname: "Administrator Hedtro Jeans",
    email: "admin@hedtrojeans.com",
    phone: "081234567890",
    password: "admin",
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
  }
];
