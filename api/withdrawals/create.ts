import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const wdData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!wdData || !wdData.user_id || !wdData.amount) {
      return res.status(400).json({ message: "Data penarikan tidak valid" });
    }

    const newWd = {
      id: Number(wdData.id) || Date.now(),
      user_id: Number(wdData.user_id),
      username: wdData.username || "",
      amount: Number(wdData.amount),
      bank_name: wdData.bank_name || "",
      account_number: wdData.account_number || "",
      account_holder: wdData.account_holder || "",
      status: wdData.status || "pending",
      created_at: wdData.created_at || new Date().toISOString()
    };

    const jsonStr = JSON.stringify(newWd);
    await queryD1(
      `INSERT INTO withdrawals (id, user_id, username, amount, bank_name, account_number, account_holder, status, data_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       user_id=excluded.user_id, username=excluded.username, amount=excluded.amount, bank_name=excluded.bank_name,
       account_number=excluded.account_number, account_holder=excluded.account_holder, status=excluded.status, data_json=excluded.data_json;`,
      [newWd.id, newWd.user_id, newWd.username, newWd.amount, newWd.bank_name, newWd.account_number, newWd.account_holder, newWd.status, jsonStr, newWd.created_at]
    );

    return res.status(201).json({ message: "Pengajuan WD berhasil!", withdrawal: newWd });
  } catch (err: any) {
    return res.status(500).json({ message: "Gagal mengajukan WD: " + (err?.message || err) });
  }
}
