import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resTx = await queryD1("SELECT data_json FROM transactions ORDER BY id DESC;");
  const transactions: any[] = [];
  if (resTx?.success && resTx.result?.[0]?.results) {
    resTx.result[0].results.forEach((row: any) => {
      try { if (row.data_json) transactions.push(JSON.parse(row.data_json)); } catch (e) {}
    });
  }
  return res.status(200).json(transactions);
}
