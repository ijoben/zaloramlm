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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const depositId = Number(body.depositId || body.deposit_id);
    const proofImage = body.proofImage || body.proof_image;
    const proofNotes = body.proofNotes || body.proof_notes || "";

    if (!depositId || !proofImage) {
      return sendJson(res, 400, { message: "Deposit ID dan Bukti Foto harus diisi" });
    }

    const nowIso = new Date().toISOString();

    // 1. Fetch deposit record from D1
    const resDep = await queryD1("SELECT data_json FROM deposits WHERE id=?;", [depositId]).catch(() => null);
    let targetUserId = 0;
    if (resDep?.success && resDep.result?.[0]?.results?.[0]?.data_json) {
      try {
        const depObj = JSON.parse(resDep.result[0].results[0].data_json);
        depObj.proof_image = proofImage;
        depObj.proof_notes = proofNotes;
        depObj.proof_submitted_at = nowIso;
        targetUserId = Number(depObj.user_id) || 0;

        await queryD1(
          "UPDATE deposits SET data_json=? WHERE id=?;",
          [JSON.stringify(depObj), depositId]
        ).catch(() => {});
      } catch (e) {}
    }

    // 2. Also update matching order in orders table if user_id is found
    if (targetUserId > 0) {
      const resOrds = await queryD1("SELECT id, data_json FROM orders WHERE user_id=?;", [targetUserId]).catch(() => null);
      if (resOrds?.success && Array.isArray(resOrds.result?.[0]?.results)) {
        for (const row of resOrds.result[0].results) {
          try {
            const ordObj = JSON.parse(row.data_json);
            ordObj.proof_image = proofImage;
            ordObj.proof_notes = proofNotes;
            ordObj.proof_submitted_at = nowIso;
            await queryD1("UPDATE orders SET data_json=? WHERE id=?;", [JSON.stringify(ordObj), row.id]).catch(() => {});
          } catch (e) {}
        }
      }
    }

    return sendJson(res, 200, { message: "Bukti transfer berhasil disimpan!", depositId });
  } catch (err: any) {
    return sendJson(res, 500, { message: "Gagal menyimpan bukti transfer: " + (err?.message || err) });
  }
}
