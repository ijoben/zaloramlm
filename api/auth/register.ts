import https from "https";

const DEFAULT_TOKEN = Buffer.from("Y2Z1dF9MNG1wYXZMQ1hYUnU0U2tIWkJzYVJ1OThCM1hxMW9aWEpHU1NKN29BNzViYzIyYjc=", "base64").toString("utf-8");

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ACCOUNT_ID.trim().length > 10
  ? process.env.CLOUDFLARE_ACCOUNT_ID.trim()
  : "2445b1694607d877f7688ef992b8bda3";

const CF_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID && process.env.CLOUDFLARE_D1_DATABASE_ID.trim().length > 10
  ? process.env.CLOUDFLARE_D1_DATABASE_ID.trim()
  : "e5abc3dd-4b07-40dd-9b2d-e81a11100c37";

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.trim().startsWith("cfut_")
  ? process.env.CLOUDFLARE_API_TOKEN.trim()
  : DEFAULT_TOKEN;

async function queryD1(sql: string, params: any[] = []): Promise<any> {
  const payload = JSON.stringify({ sql, params });

  if (typeof fetch === "function") {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: payload,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await res.json();
    } catch (e) {
      console.warn("Fetch failed, using node https fallback:", e);
    }
  }

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        },
        timeout: 9000
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (err) { resolve(null); }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.write(payload);
    req.end();
  });
}

function setCorsHeaders(res: any) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Content-Type", "application/json");
  } catch (e) {}
}

function sendJson(res: any, status: number, data: any) {
  try { setCorsHeaders(res); } catch (e) {}
  if (typeof res.status === "function") {
    return res.status(status).json(data);
  }
  try {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (e) {}
}

function findVacantSpot(users: any[], rootId: number, preferredPosition?: 'L' | 'R'): { upline_id: number, position: 'L' | 'R' } {
  const root = users.find(u => Number(u.id) === Number(rootId));
  if (!root) return { upline_id: Number(rootId) || 1, position: preferredPosition || 'L' };

  const pos = preferredPosition || "L";
  const directChild = users.find(u => Number(u.upline_id) === Number(rootId) && u.position === pos);
  if (!directChild) {
    return { upline_id: Number(rootId), position: pos };
  }

  let currentId = Number(directChild.id);
  const visited = new Set<number>();
  visited.add(Number(rootId));

  while (true) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const nextChild = users.find(u => Number(u.upline_id) === Number(currentId) && u.position === pos);
    if (!nextChild) {
      return { upline_id: currentId, position: pos };
    }
    currentId = Number(nextChild.id);
  }
  return { upline_id: Number(rootId) || 1, position: pos };
}

async function updateAncestorCountsD1(users: any[], uplineId: number, position: 'L' | 'R') {
  let currUplineId: number | null = uplineId;
  let childPos: 'L' | 'R' = position;
  const visited = new Set<number>();

  while (currUplineId !== null && currUplineId !== undefined) {
    if (visited.has(currUplineId)) break;
    visited.add(currUplineId);

    const upline = users.find(u => Number(u.id) === Number(currUplineId));
    if (!upline) break;

    if (childPos === 'L') {
      upline.left_count = (Number(upline.left_count) || 0) + 1;
    } else {
      upline.right_count = (Number(upline.right_count) || 0) + 1;
    }

    const updatedJson = JSON.stringify(upline);
    await queryD1(
      `UPDATE users SET data_json=? WHERE id=?`,
      [updatedJson, upline.id]
    ).catch(() => {});

    childPos = upline.position === 'R' ? 'R' : 'L';
    const nextUpline = upline.upline_id !== null && upline.upline_id !== undefined ? Number(upline.upline_id) : null;
    if (nextUpline === currUplineId) break;
    currUplineId = nextUpline;
  }
}

export default async function handler(req: any, res: any) {
  try { setCorsHeaders(res); } catch (e) {}
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  if (req.method !== "POST") return sendJson(res, 405, { message: "Method Not Allowed" });

  try {
    let regData: any = {};
    try {
      if (typeof req.body === 'string') {
        regData = JSON.parse(req.body);
      } else if (Buffer.isBuffer(req.body)) {
        regData = JSON.parse((req.body as Buffer).toString('utf-8'));
      } else if (req.body && typeof req.body === 'object') {
        regData = req.body;
      }
    } catch (e) {
      return sendJson(res, 400, { message: "Format data JSON pendaftaran tidak valid" });
    }

    if (!regData || !regData.username || !regData.fullname) {
      return sendJson(res, 400, { message: "Username dan nama lengkap wajib diisi" });
    }

    const normalizedUsername = String(regData.username).toLowerCase().replace(/\s+/g, "").trim();
    if (!normalizedUsername) {
      return sendJson(res, 400, { message: "Username tidak boleh kosong" });
    }

    // Fetch existing users from Cloudflare D1
    const resUsers = await queryD1("SELECT data_json FROM users;").catch(() => null);
    const users: any[] = [];
    if (resUsers?.success && Array.isArray(resUsers.result?.[0]?.results)) {
      resUsers.result[0].results.forEach((row: any) => {
        try { if (row.data_json) users.push(JSON.parse(row.data_json)); } catch (e) {}
      });
    }

    if (users.some(u => u.username && u.username.toLowerCase().trim() === normalizedUsername)) {
      return sendJson(res, 400, { message: "Username sudah digunakan oleh member lain" });
    }

    let sponsorId: number = 1;
    if (regData.sponsor_username) {
      const sSearch = String(regData.sponsor_username).toLowerCase().trim();
      const sponsor = users.find(u => u.username && u.username.toLowerCase().trim() === sSearch);
      if (sponsor) sponsorId = Number(sponsor.id);
    }

    let uplineId: number = sponsorId || 1;
    let finalPos: 'L' | 'R' = (regData.position === 'R' || regData.position === 'L') ? regData.position : "L";

    if (regData.upline_username) {
      const uSearch = String(regData.upline_username).toLowerCase().trim();
      const uplineUser = users.find(u => u.username && u.username.toLowerCase().trim() === uSearch);
      if (uplineUser) uplineId = Number(uplineUser.id);
    }

    const taken = users.find(u => Number(u.upline_id) === Number(uplineId) && u.position === finalPos);
    if (taken) {
      const vacancy = findVacantSpot(users, uplineId, finalPos);
      uplineId = vacancy.upline_id;
      finalPos = vacancy.position;
    }

    const validIds = users.map(u => Number(u.id)).filter(id => !isNaN(id) && isFinite(id));
    const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
    const newUserId = (maxId > 0 ? maxId : 0) + 1;

    const newUser = {
      id: newUserId,
      username: normalizedUsername,
      fullname: regData.fullname,
      email: regData.email || `${normalizedUsername}@member.hedtrojeans.com`,
      phone: regData.phone || "081234567890",
      password: regData.password || "password123",
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
      firebase_uid: regData.firebase_uid || "",
      ktp: regData.ktp || "",
      whatsapp: regData.whatsapp || regData.phone || "",
      bank_name: regData.bank_name || "BCA",
      bank_account: regData.bank_account || "",
      bank_holder: regData.bank_holder || regData.fullname || "",
      address: regData.address || "",
      city: regData.city || ""
    };

    const jsonStr = JSON.stringify(newUser);
    const d1Result = await queryD1(
      `INSERT INTO users (id, username, data_json, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       username=excluded.username,
       data_json=excluded.data_json;`,
      [newUser.id, newUser.username, jsonStr, newUser.created_at]
    ).catch((err) => ({ success: false, errors: [{ message: String(err) }] }));

    if (!d1Result?.success) {
      console.error("D1 Insert Error:", d1Result);
      const errMsg = d1Result?.errors?.[0]?.message || "Gagal menyimpan data ke Cloudflare D1";
      return sendJson(res, 500, { message: "Gagal menyimpan data member ke Cloudflare D1: " + errMsg });
    }

    // Update ancestor counts in D1
    await updateAncestorCountsD1(users, uplineId, finalPos).catch(() => {});

    return sendJson(res, 201, { message: "Registrasi member berhasil!", user: newUser });
  } catch (err: any) {
    console.error("Unexpected register handler error:", err);
    return sendJson(res, 500, { message: "Gagal mendaftar: " + (err?.message || String(err)) });
  }
}
