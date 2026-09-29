import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { meta, places } from '@/lib/db/generated/schema';
import { CELL_SIZE_DEG, cellRange } from '@/lib/geo';
import { buildFixture } from './fixtures/build-fixture';

describe('cellRange', () => {
  it('floors negative longitudes instead of truncating toward zero (spec §6.1)', () => {
    const range = cellRange({
      west: -118.2916,
      south: 34.098,
      east: -118.2606,
      north: 34.098,
    });
    expect(range).toEqual({
      rowMin: 3409,
      rowMax: 3409,
      colMin: -11830,
      colMax: -11827,
    });
  });

  it('puts an edge that lies exactly on 34.05 / -118.25 in the same cell the pipeline stores', () => {
    const range = cellRange({
      west: -118.25,
      south: 34.05,
      east: -118.25,
      north: 34.05,
    });
    expect(range).toEqual({
      rowMin: 3404,
      rowMax: 3404,
      colMin: -11825,
      colMax: -11825,
    });
  });
});

describe('CELL_SIZE_DEG', () => {
  it('equals meta.cell_size_deg (spec §6.1)', async () => {
    const { db } = await buildFixture();
    const rows = await db
      .select({ value: meta.value })
      .from(meta)
      .where(eq(meta.key, 'cell_size_deg'));
    expect(Number(rows[0].value)).toBe(CELL_SIZE_DEG);
  });

  it('gives every stored place the cell the app would compute', async () => {
    const { db } = await buildFixture();
    const rows = await db.select().from(places);
    for (const place of rows) {
      expect([place.slug, place.cellRow, place.cellCol]).toEqual([
        place.slug,
        Math.floor(place.lat / CELL_SIZE_DEG),
        Math.floor(place.lon / CELL_SIZE_DEG),
      ]);
    }
  });
});
