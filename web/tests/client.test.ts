import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDb } from '@/lib/db/client';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getDb', () => {
  it('fails with a clear message when the Turso env vars are missing', () => {
    vi.stubEnv('TURSO_DATABASE_URL', '');
    vi.stubEnv('TURSO_AUTH_TOKEN', '');
    expect(() => getDb()).toThrow(
      'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set',
    );
  });
});
