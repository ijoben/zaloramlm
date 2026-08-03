import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const ordData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!ordData || !ordData.user_id || !ordData.amount) {
      return res.status(400).json({ message: "Data pesanan tidak valid" });
    }

    const newOrd = {
      id: Number(ordData.id) || Date.now(),
      invoice_no: ordData.invoice_no || `INV-${Date.now()}`,
      user_id: Number(ordData.user_id),
      username: ordData.username || "",
      fullname: ordData.fullname || "",
      phone: ordData.phone || "",
      address: ordData.address || "",
      product_name: ordData.product_name || "Produk Denim",
      amount: Number(ordData.amount) || 0,
      unique_code: Number(ordData.unique_code) || 0,
      payment_method: ordData.payment_method || "Transfer Bank",
      status: ordData.status || "DIPROSES",
      courier: ordData.courier || "JNE REGULER",
      tracking_number: ordData.tracking_number || "",
      notes: ordData.notes || "",
      created_at: ordData.created_at || new Date().toISOString()
    };

    const jsonStr = JSON.stringify(newOrd);
    await queryD1(
      `INSERT INTO orders (id, invoice_no, user_id, username, fullname, amount, status, tracking_number, data_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       invoice_no=excluded.invoice_no, user_id=excluded.user_id, username=excluded.username, fullname=excluded.fullname,
       amount=excluded.amount, status=excluded.status, tracking_number=excluded.tracking_number, data_json=excluded.data_json;`,
      [newOrd.id, newOrd.invoice_no, newOrd.user_id, newOrd.username, newOrd.fullname, newOrd.amount, newOrd.status, newOrd.tracking_number, jsonStr, newOrd.created_at]
    );

    return res.status(201).json({ message: "Pesanan berhasil dibuat!", order: newOrd });
  } catch (err: any) {
    return res.status(500).json({ message: "Gagal membuat pesanan: " + (err?.message || err) });
  }
}
