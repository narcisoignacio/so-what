import { BoundingBox, cellRange } from '@/lib/geo';
import { and, between, eq, gte, sql } from 'drizzle-orm';
import { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core';
import { meta, places } from './generated/schema';

type Db = SQLiteAsyncDatabase<'async', unknown>;
type TodayRiskType = 'air' | 'fire' | 'heat';

interface SpikePin {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  rank: number;
}

const RANK_COLUMNS = {
  air: places.airRank,
  fire: places.fireRank,
  heat: places.heatRank,
};

/**
 * Reads and returns the total number of places stored in the database from the metadata table.
 */
async function getPlaceCount(db: Db): Promise<number> {
  const rows = await db
    .select({ value: meta.value })
    .from(meta)
    .where(eq(meta.key, 'row_count_places'));

  if (rows.length === 0) {
    throw new Error('row_count_places metadata is missing');
  }

  return Number(rows[0].value);
}

/**
 * Retrieves viewport map pins within a given bounding box, filtered and ranked by selected risk types.
 * Leverages grid cell index ranges for coarse spatial filtering followed by precise coordinate bounds.
 */
async function viewportPins(
  db: Db,
  boundingBox: BoundingBox,
  types: TodayRiskType[],
): Promise<SpikePin[]> {
  const uniqueTypes = Array.from(new Set(types));

  if (uniqueTypes.length === 0) {
    return [];
  }

  const { rowMin, rowMax, colMin, colMax } = cellRange(boundingBox);
  const rankColumns = uniqueTypes.map((type) => RANK_COLUMNS[type]);

  // SQLite treats one-argument max() as an aggregate, use the column
  // directly for one selected risk type.
  const rank =
    rankColumns.length === 1
      ? sql`${rankColumns[0]}`
      : sql`max(${sql.join(rankColumns, sql`, `)})`;

  const subq = db
    .select({
      slug: places.slug,
      name: places.name,
      lat: places.lat,
      lon: places.lon,
      rank: rank.mapWith(Number).as('rank'),
    })
    .from(places)
    .where(
      and(
        between(places.cellRow, rowMin, rowMax),
        between(places.cellCol, colMin, colMax),
        between(places.lat, boundingBox.south, boundingBox.north),
        between(places.lon, boundingBox.west, boundingBox.east),
      ),
    )
    .as('subq');

  return db.select().from(subq).where(gte(subq.rank, 1)).orderBy(subq.slug);
}

export {
  getPlaceCount,
  viewportPins,
  type Db,
  type SpikePin,
  type TodayRiskType,
};
