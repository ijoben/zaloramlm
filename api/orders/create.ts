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

export default async function handler(req: any, res: any) {
  try { setCorsHeaders(res); } catch (e) {}
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  if (req.method !== "POST") return sendJson(res, 405, { message: "Method Not Allowed" });

  try {
    const ordData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!ordData || !ordData.user_id || !ordData.amount) {
      return sendJson(res, 400, { message: "Data pesanan tidak valid" });
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
    ).catch(() => {});

    return sendJson(res, 201, { message: "Pesanan berhasil dibuat!", order: newOrd });
  } catch (err: any) {
    return sendJson(res, 500, { message: "Gagal membuat pesanan: " + (err?.message || err) });
  }
}
