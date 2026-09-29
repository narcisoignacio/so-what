import { defineConfig } from 'drizzle-kit';

// Used only for `drizzle-kit pull`; pipeline/schema.sql owns the schema and there are no migrations (spec §7.2).
export default defineConfig({
  dialect: 'turso',
  out: './src/lib/db/generated',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:../data/sowhat-m0.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
