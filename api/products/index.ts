import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resProds = await queryD1("SELECT data_json FROM products ORDER BY id ASC;");
  const products: any[] = [];
  if (resProds?.success && resProds.result?.[0]?.results) {
    resProds.result[0].results.forEach((row: any) => {
      try { if (row.data_json) products.push(JSON.parse(row.data_json)); } catch (e) {}
    });
  }
  return res.status(200).json(products);
}
