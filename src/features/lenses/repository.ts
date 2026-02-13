import { eq } from "drizzle-orm";

import { db } from "@/core/database/client";

import type { CustomLensRow, NewCustomLens } from "./models";
import { customLenses } from "./models";

export async function findAll(): Promise<CustomLensRow[]> {
  return db.select().from(customLenses);
}

export async function findById(id: string): Promise<CustomLensRow | undefined> {
  const results = await db.select().from(customLenses).where(eq(customLenses.id, id)).limit(1);
  return results[0];
}

export async function create(data: NewCustomLens): Promise<CustomLensRow> {
  const results = await db.insert(customLenses).values(data).returning();
  const lens = results[0];
  if (!lens) {
    throw new Error("Failed to create custom lens");
  }
  return lens;
}

export async function deleteById(id: string): Promise<boolean> {
  const results = await db.delete(customLenses).where(eq(customLenses.id, id)).returning();
  return results.length > 0;
}
