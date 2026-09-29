import { is, sql } from 'drizzle-orm';
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import * as schema from '@/lib/db/generated/schema';
import { buildFixture } from './fixtures/build-fixture';

interface ColumnInfo {
  name: string;
  type: string;
}

// Drift guard (spec §7.2): the generated Drizzle schema must match pipeline/schema.sql.
describe('generated Drizzle schema', () => {
  const tables = Object.values(schema).filter((value) =>
    is(value, SQLiteTable),
  );

  it('covers exactly the tables in schema.sql', async () => {
    const { db } = await buildFixture({ seed: false });
    const rows = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
    );
    const drizzleNames = tables
      .map((table) => getTableConfig(table).name)
      .sort();
    expect(drizzleNames).toEqual(rows.map((row) => row.name));
  });

  it.each(tables.map((table) => [getTableConfig(table).name, table] as const))(
    '%s has the same columns and types',
    async (name, table) => {
      const { db } = await buildFixture({ seed: false });
      const info = await db.all<ColumnInfo>(
        sql`PRAGMA table_info(${sql.identifier(name)})`,
      );
      const fromSql = info
        .map((column) => [column.name, column.type.toLowerCase()])
        .sort();
      const fromDrizzle = getTableConfig(table)
        .columns.map((column) => [
          column.name,
          column.getSQLType().toLowerCase(),
        ])
        .sort();
      expect(fromDrizzle).toEqual(fromSql);
    },
  );
});
