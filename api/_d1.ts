const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "2445b1694607d877f7688ef992b8bda3";
const CF_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || "e5abc3dd-4b07-40dd-9b2d-e81a11100c37";
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || Buffer.from("Y2Z1dF9MNG1wYXZMQ1hYUnU0U2tIWkJzYVJ1OThCM1hxMW9aWEpHU1NKN29BNzViYzIyYjc=", "base64").toString("utf-8");

export async function queryD1(sql: string, params: any[] = []): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    return await res.json();
  } catch (err) {
    console.error("D1 Query Error:", err);
    return null;
  }
}

export function setCorsHeaders(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
}
