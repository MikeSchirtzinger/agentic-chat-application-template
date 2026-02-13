import { customLenses } from "@/core/database/schema";

export { customLenses };

export type CustomLensRow = typeof customLenses.$inferSelect;
export type NewCustomLens = typeof customLenses.$inferInsert;
