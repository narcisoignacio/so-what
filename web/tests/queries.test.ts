import { beforeAll, describe, expect, it } from 'vitest';
import { type Db, getPlaceCount, viewportPins } from '@/lib/db/queries';
import type { BoundingBox } from '@/lib/geo';
import { buildFixture } from './fixtures/build-fixture';

// Roughly LA County's bounds; contains every seed place.
const ALL_LA: BoundingBox = {
  west: -118.95,
  south: 33.7,
  east: -117.64,
  north: 34.83,
};

let db: Db;

beforeAll(async () => {
  ({ db } = await buildFixture());
});

describe('getPlaceCount', () => {
  it('reads meta.row_count_places', async () => {
    expect(await getPlaceCount(db)).toBe(6);
  });

  it('throws when the meta row is missing', async () => {
    const { db: empty } = await buildFixture({ seed: false });
    await expect(getPlaceCount(empty)).rejects.toThrow('row_count_places');
  });
});

describe('viewportPins', () => {
  it('ranks each place by the highest selected rank and hides low places', async () => {
    const pins = await viewportPins(db, ALL_LA, ['air', 'fire', 'heat']);
    expect(pins.map((pin) => [pin.slug, pin.rank])).toEqual([
      ['echo-park', 1],
      ['grand-park', 3],
      ['main-1st', 2],
      ['sample-elementary-school', 1],
      ['vermont-sunset', 3],
    ]);
  });

  it('returns one row per place when a single type is selected', async () => {
    // SQLite's one-argument max() is the aggregate and would return a single row.
    const pins = await viewportPins(db, ALL_LA, ['heat']);
    expect(pins.map((pin) => [pin.slug, pin.rank])).toEqual([
      ['echo-park', 1],
      ['grand-park', 2],
      ['main-1st', 2],
      ['vermont-sunset', 3],
    ]);
  });

  it('returns nothing, without querying, when no types are selected', async () => {
    const unusable = null as unknown as Db;
    expect(await viewportPins(unusable, ALL_LA, [])).toEqual([]);
  });

  it('excludes places in an edge cell that lie outside the viewport', async () => {
    // grand-park (34.0561) shares cell row 3405 with this viewport's north edge but lies north of it.
    const pins = await viewportPins(
      db,
      { west: -118.26, south: 34.04, east: -118.24, north: 34.055 },
      ['heat'],
    );
    expect(pins.map((pin) => pin.slug)).toEqual(['main-1st']);
  });

  it('includes a place that sits exactly on the viewport corner and a cell boundary', async () => {
    const pins = await viewportPins(
      db,
      { west: -118.25, south: 34.05, east: -118.24, north: 34.06 },
      ['heat'],
    );
    expect(pins.map((pin) => pin.slug)).toEqual(['grand-park', 'main-1st']);
  });

  it('ignores duplicate types', async () => {
    const pins = await viewportPins(db, ALL_LA, ['fire', 'fire']);
    expect(pins.map((pin) => [pin.slug, pin.rank])).toEqual([
      ['sample-elementary-school', 1],
    ]);
  });
});
