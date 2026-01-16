export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { pool } from '@/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW() as now');
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json(
      {
        message: err?.message,
        code: err?.code,
        detail: err?.detail,
        hint: err?.hint,
        stack: err?.stack,
        env: {
          hasUrl: Boolean(process.env.POSTGRES_URL),
          urlPreview: process.env.POSTGRES_URL?.replace(/\/\/.*@/, '//***@'),
        },
      },
      { status: 500 },
    );
  }
}
