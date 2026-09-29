import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { getDb } from '@/lib/db/client';
import { buildFixture } from './fixtures/build-fixture';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/health', () => {
  it('reports the place count', async () => {
    const { db } = await buildFixture();
    vi.mocked(getDb).mockReturnValue(db);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, places: 6 });
  });

  it('answers 503 when the client cannot be created', async () => {
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
    });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
    expect(console.error).toHaveBeenCalled();
  });

  it('answers 503 when the query fails', async () => {
    const { client, db } = await buildFixture();
    await client.exec("DELETE FROM meta WHERE key = 'row_count_places'");
    vi.mocked(getDb).mockReturnValue(db);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
  });
});
