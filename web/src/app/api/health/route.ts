import { getDb } from '@/lib/db/client';
import { getPlaceCount } from '@/lib/db/queries';

/**
 * Uptime check (spec §7.1, §8.1): one row read;
 * 503 when the database can't be reached (spec §10.1).
 */
async function GET() {
  try {
    const places = await getPlaceCount(getDb());
    return Response.json({ ok: true, places });
  } catch (error) {
    console.error('health check failed', error);
    return Response.json({ ok: false }, { status: 503 });
  }
}

export { GET };
