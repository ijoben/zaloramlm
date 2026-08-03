import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resWds = await queryD1("SELECT data_json FROM withdrawals ORDER BY id DESC;");
  const withdrawals: any[] = [];
  if (resWds?.success && resWds.result?.[0]?.results) {
    resWds.result[0].results.forEach((row: any) => {
      try { if (row.data_json) withdrawals.push(JSON.parse(row.data_json)); } catch (e) {}
    });
  }
  return res.status(200).json(withdrawals);
}
