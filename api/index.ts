import app from '../server';
import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  try {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Express Handler Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err?.message || String(err) });
  }
}
