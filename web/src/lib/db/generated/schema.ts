import { sqliteTable, foreignKey, primaryKey, index, check, integer, text, real } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const places = sqliteTable("places", {
	id: integer().primaryKey(),
	slug: text().notNull(),
	sourceKey: text("source_key").notNull(),
	name: text().notNull(),
	kind: text().notNull(),
	lat: real().notNull(),
	lon: real().notNull(),
	zip: text(),
	tractId: text("tract_id").notNull(),
	cellRow: integer("cell_row").notNull(),
	cellCol: integer("cell_col").notNull(),
	airRank: integer("air_rank").notNull(),
	fireRank: integer("fire_rank").notNull(),
	heatRank: integer("heat_rank").notNull(),
	seaFlag: integer("sea_flag").default(0).notNull(),
	isShowcase: integer("is_showcase").default(0).notNull(),
},
(table) => [index("places_cell").on(table.cellRow, table.cellCol),
check("places_check_1", sql`kind IN ('bus_stop','park','playground','school')`),
check("places_check_2", sql`air_rank  BETWEEN 0 AND 3`),
check("places_check_3", sql`fire_rank BETWEEN 0 AND 3`),
check("places_check_4", sql`heat_rank BETWEEN 0 AND 3`),
check("places_check_5", sql`sea_flag IN (0,1)`),
]);

export const risks = sqliteTable("risks", {
	placeId: integer("place_id").notNull().references(() => places.id),
	type: text().notNull(),
	level: text(),
	value: real(),
	detail: text().notNull(),
	soWhat: text("so_what").notNull(),
	sourceId: text("source_id").notNull().references(() => sources.id),
	trend: text(),
	trendNow: real("trend_now"),
	trendFuture: real("trend_future"),
	trendSourceId: text("trend_source_id").references(() => sources.id),
},
(table) => [primaryKey({ columns: [table.placeId, table.type], name: "risks_pk"}),
check("risks_check_6", sql`type IN ('air','fire','heat','sea')`),
check("risks_check_7", sql`level IN ('low','elevated','high','severe')),  -- NULL only for 'sea' (projection-only`),
check("risks_check_8", sql`(trend IS NULL) = (trend_source_id IS NULL`),
check("risks_check_9", sql`(type = 'sea') = (level IS NULL)`),
check("risks_check_10", sql`type <> 'sea' OR trend IS NULL`),
]);

export const sources = sqliteTable("sources", {
	id: text().primaryKey(),
	name: text().notNull(),
	url: text().notNull(),
	retrievedOn: text("retrieved_on").notNull(),
	dataYears: text("data_years"),
});

export const zips = sqliteTable("zips", {
	zip: text().primaryKey(),
	minLat: real("min_lat").notNull(),
	maxLat: real("max_lat").notNull(),
	minLon: real("min_lon").notNull(),
	maxLon: real("max_lon").notNull(),
	centerLat: real("center_lat").notNull(),
	centerLon: real("center_lon").notNull(),
});

export const meta = sqliteTable("meta", {
	key: text().primaryKey(),
	value: text().notNull(),
});

