import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resOrders = await queryD1("SELECT data_json FROM orders ORDER BY id DESC;");
  const orders: any[] = [];
  if (resOrders?.success && resOrders.result?.[0]?.results) {
    resOrders.result[0].results.forEach((row: any) => {
      try { if (row.data_json) orders.push(JSON.parse(row.data_json)); } catch (e) {}
    });
  }
  return res.status(200).json(orders);
}
