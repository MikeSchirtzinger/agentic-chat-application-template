import type { NextRequest } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { CreateCustomLensSchema, createCustomLens, getAllLenses } from "@/features/lenses";

const logger = getLogger("api.lenses");

/**
 * GET /api/lenses
 * Get all lenses (both presets and custom).
 */
export async function GET() {
  try {
    logger.info("lenses.get_all_request");
    const lenses = await getAllLenses();
    return Response.json(lenses);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/lenses
 * Create a new custom lens.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateCustomLensSchema.parse(body);

    logger.info({ name: data.name }, "lenses.create_request");

    const lens = await createCustomLens(data);

    return Response.json(lens, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
