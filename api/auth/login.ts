import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { username, password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!username) return res.status(400).json({ message: "Username/Email harus diisi" });

    const normalized = String(username).toLowerCase().trim();
    const resUsers = await queryD1("SELECT data_json FROM users;");
    const users: any[] = [];
    if (resUsers?.success && resUsers.result?.[0]?.results) {
      resUsers.result[0].results.forEach((row: any) => {
        try { if (row.data_json) users.push(JSON.parse(row.data_json)); } catch (e) {}
      });
    }

    const user = users.find(u => 
      u.username?.toLowerCase().trim() === normalized || 
      u.email?.toLowerCase().trim() === normalized
    );

    if (!user) {
      return res.status(404).json({ message: "Username atau email tidak ditemukan" });
    }

    const expectedPass = user.password || (user.role === 'admin' || user.id === 1 ? "admin123" : "user123");
    if (password && password !== expectedPass) {
      return res.status(401).json({ message: "Password salah!" });
    }

    return res.status(200).json({ message: "Login berhasil", user });
  } catch (err: any) {
    return res.status(500).json({ message: "Gagal login: " + (err?.message || err) });
  }
}
