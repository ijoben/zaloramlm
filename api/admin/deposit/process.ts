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
    const depositId = Number(body.depositId || body.id);
    const action = body.action || 'approve';

    if (!depositId) {
      return sendJson(res, 400, { message: "Deposit ID harus diisi" });
    }

    const newStatus = action === 'approve' ? 'success' : 'failed';

    // 1. Fetch deposit with flexible matching
    let resDep = await queryD1("SELECT id, data_json FROM deposits WHERE id=? OR id=?;", [depositId, String(depositId)]).catch(() => null);
    let targetUserId = 0;
    let depAmount = 0;
    let depUsername = "";
    let matchedRowId = depositId;

    if (!resDep?.success || !resDep.result?.[0]?.results?.[0]?.data_json) {
      const allDeps = await queryD1("SELECT id, data_json FROM deposits ORDER BY id DESC;").catch(() => null);
      if (allDeps?.success && Array.isArray(allDeps.result?.[0]?.results)) {
        for (const row of allDeps.result[0].results) {
          try {
            const dObj = JSON.parse(row.data_json);
            if (Number(row.id) === Number(depositId) || Number(dObj.id) === Number(depositId)) {
              matchedRowId = Number(row.id);
              resDep = { success: true, result: [{ results: [row] }] };
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (resDep?.success && resDep.result?.[0]?.results?.[0]?.data_json) {
      try {
        const depObj = JSON.parse(resDep.result[0].results[0].data_json);
        depObj.status = newStatus;
        targetUserId = Number(depObj.user_id) || 0;
        depAmount = Number(depObj.amount) || 0;
        depUsername = depObj.username || "";

        await queryD1(
          "UPDATE deposits SET status=?, data_json=? WHERE id=? OR id=?;",
          [newStatus, JSON.stringify(depObj), matchedRowId, String(matchedRowId)]
        ).catch(() => {});
      } catch (e) {}
    }

    // 2. If approved, activate target member in D1 users table
    if (action === 'approve') {
      const allUsers = await queryD1("SELECT id, data_json FROM users;").catch(() => null);
      if (allUsers?.success && Array.isArray(allUsers.result?.[0]?.results)) {
        for (const row of allUsers.result[0].results) {
          try {
            const userObj = JSON.parse(row.data_json);
            if ((targetUserId > 0 && Number(row.id) === Number(targetUserId)) || (depUsername && userObj.username && userObj.username.toLowerCase().trim() === depUsername.toLowerCase().trim())) {
              const isActivating = !userObj.is_active || depAmount >= 550000;
              userObj.is_active = true;
              if (!isActivating) {
                userObj.balance = (Number(userObj.balance) || 0) + depAmount;
              }
              await queryD1(
                "UPDATE users SET data_json=? WHERE id=? OR id= cast(? as text);",
                [JSON.stringify(userObj), row.id, row.id]
              ).catch(() => {});
              break;
            }
          } catch (e) {}
        }
      }

      // 3. Update all matching orders for this user to DIPROSES with tracking number
      const allOrds = await queryD1("SELECT id, data_json FROM orders;").catch(() => null);
      if (allOrds?.success && Array.isArray(allOrds.result?.[0]?.results)) {
        for (const row of allOrds.result[0].results) {
          try {
            const ordObj = JSON.parse(row.data_json);
            if ((targetUserId > 0 && Number(ordObj.user_id) === Number(targetUserId)) || (depUsername && ordObj.username && ordObj.username.toLowerCase().trim() === depUsername.toLowerCase().trim())) {
              ordObj.status = "DIPROSES";
              if (!ordObj.tracking_number) {
                ordObj.tracking_number = `JNE-${Math.floor(100000000 + Math.random() * 900000000)}`;
              }
              await queryD1(
                "UPDATE orders SET status=?, tracking_number=?, data_json=? WHERE id=? OR id=cast(? as text);",
                ["DIPROSES", ordObj.tracking_number, JSON.stringify(ordObj), row.id, row.id]
              ).catch(() => {});
            }
          } catch (e) {}
        }
      }
    }

    return sendJson(res, 200, { message: `Deposit #${depositId} berhasil ${action === 'approve' ? 'disetujui & diaktifkan' : 'ditolak'}!`, depositId, status: newStatus });
  } catch (err: any) {
    return sendJson(res, 500, { message: "Gagal memproses deposit: " + (err?.message || err) });
  }
}
