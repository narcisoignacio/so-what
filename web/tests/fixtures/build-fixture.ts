import { readFileSync } from 'node:fs';
import { connect } from '@tursodatabase/database';
import { drizzle } from 'drizzle-orm/tursodatabase/database';

// tests/fixtures → tests → web → repo root
const PIPELINE_DIR = new URL('../../../pipeline/', import.meta.url);

// A fresh in-memory database built from the real schema (spec §7.1, §11).
async function buildFixture(options: { seed?: boolean } = {}) {
  const client = await connect(':memory:');
  await client.exec(readFileSync(new URL('schema.sql', PIPELINE_DIR), 'utf8'));
  if (options.seed !== false) {
    await client.exec(
      readFileSync(new URL('seed_m0.sql', PIPELINE_DIR), 'utf8'),
    );
  }
  return { client, db: drizzle({ client }) };
}

export { buildFixture };
