import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	risks: {
		sourceTrendSourceId: r.one.sources({
			from: r.risks.trendSourceId,
			to: r.sources.id,
			alias: "risks_trendSourceId_sources_id"
		}),
		sourceSourceId: r.one.sources({
			from: r.risks.sourceId,
			to: r.sources.id,
			alias: "risks_sourceId_sources_id"
		}),
		place: r.one.places({
			from: r.risks.placeId,
			to: r.places.id
		}),
	},
	sources: {
		risksTrendSourceId: r.many.risks({
			alias: "risks_trendSourceId_sources_id"
		}),
		risksSourceId: r.many.risks({
			alias: "risks_sourceId_sources_id"
		}),
	},
	places: {
		risks: r.many.risks(),
	},
}))