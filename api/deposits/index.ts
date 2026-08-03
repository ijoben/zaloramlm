import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resDeps = await queryD1("SELECT data_json FROM deposits ORDER BY id DESC;");
  const deposits: any[] = [];
  if (resDeps?.success && resDeps.result?.[0]?.results) {
    resDeps.result[0].results.forEach((row: any) => {
      try { if (row.data_json) deposits.push(JSON.parse(row.data_json)); } catch (e) {}
    });
  }
  return res.status(200).json(deposits);
}
