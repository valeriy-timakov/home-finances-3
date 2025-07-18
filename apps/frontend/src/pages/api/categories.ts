import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/categories`, {
    headers: req.headers as any,
    credentials: 'include',
  });
  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
}
