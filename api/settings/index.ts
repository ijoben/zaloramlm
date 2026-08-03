import { queryD1, setCorsHeaders } from '../_d1';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resSet = await queryD1("SELECT value FROM store_data WHERE key='systemSettings';");
  let systemSettings: any = {};
  if (resSet?.success && resSet.result?.[0]?.results?.length > 0) {
    try { systemSettings = JSON.parse(resSet.result[0].results[0].value); } catch (e) {}
  }
  return res.status(200).json(systemSettings);
}
