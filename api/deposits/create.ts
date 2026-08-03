import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const depData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!depData || !depData.user_id || !depData.amount) {
      return res.status(400).json({ message: "Data deposit tidak valid" });
    }

    const newDep = {
      id: Number(depData.id) || Date.now(),
      user_id: Number(depData.user_id),
      username: depData.username || "",
      amount: Number(depData.amount),
      unique_code: depData.unique_code !== undefined ? Number(depData.unique_code) : (100 + (Number(depData.id || Date.now()) % 899)),
      method: depData.method || "qris",
      status: depData.status || "pending",
      payment_code: depData.payment_code || `DEP-${Date.now()}`,
      created_at: depData.created_at || new Date().toISOString(),
      proof_image: depData.proof_image || undefined,
      proof_notes: depData.proof_notes || undefined,
      proof_submitted_at: depData.proof_submitted_at || undefined
    };

    const jsonStr = JSON.stringify(newDep);
    await queryD1(
      `INSERT INTO deposits (id, user_id, username, amount, method, status, payment_code, data_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       user_id=excluded.user_id, username=excluded.username, amount=excluded.amount, method=excluded.method,
       status=excluded.status, payment_code=excluded.payment_code, data_json=excluded.data_json;`,
      [newDep.id, newDep.user_id, newDep.username, newDep.amount, newDep.method, newDep.status, newDep.payment_code, jsonStr, newDep.created_at]
    );

    return res.status(201).json({ message: "Pengajuan deposit berhasil!", deposit: newDep });
  } catch (err: any) {
    return res.status(500).json({ message: "Gagal membuat deposit: " + (err?.message || err) });
  }
}
