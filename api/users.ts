import { queryD1, setCorsHeaders } from './_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resUsers = await queryD1("SELECT data_json FROM users ORDER BY id ASC;");
  const users: any[] = [];
  if (resUsers?.success && resUsers.result?.[0]?.results) {
    resUsers.result[0].results.forEach((row: any) => {
      try { if (row.data_json) users.push(JSON.parse(row.data_json)); } catch (e) {}
    });
  }
  return res.status(200).json(users);
}
