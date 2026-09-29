import { getDb } from '@/lib/db/client';
import { viewportPins } from '@/lib/db/queries';

// M0 spike only (spec §8.3): times the viewport query from the deployed Function.
// Takes no input; removed at the end of M0.
const DOWNTOWN = { west: -118.3, south: 34.03, east: -118.22, north: 34.1 };

async function GET() {
  try {
    const db = getDb();
    const started = performance.now();
    const pins = await viewportPins(db, DOWNTOWN, ['air', 'fire', 'heat']);
    const queryMs = Math.round(performance.now() - started);
    return Response.json({
      queryMs,
      count: pins.length,
      region: process.env.VERCEL_REGION ?? 'local',
    });
  } catch (error) {
    console.error('viewport spike failed', error);
    return Response.json({ ok: false }, { status: 503 });
  }
}

export { GET };
