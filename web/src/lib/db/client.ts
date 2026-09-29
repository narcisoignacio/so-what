import { drizzle } from 'drizzle-orm/tursodatabase-serverless';
import type { Db } from '@/lib/db/queries';

// The only file that knows the driver (spec §7.1). Created on first use, not at import,
// so `next build` works without database credentials.
let db: Db | undefined;

/**
 * Initializes and retrieves a singleton instance of the Drizzle database connection.
 *
 * Uses lazy initialization (created on first use) to ensure that build processes
 * (like `next build`) can execute successfully without requiring database credentials
 * in the environment.
 */
function getDb(): Db {
  if (db) {
    return db;
  }
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  }
  db = drizzle({ connection: { url, authToken } });
  return db;
}

export { getDb };
