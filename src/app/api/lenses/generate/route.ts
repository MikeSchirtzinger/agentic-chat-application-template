import type { NextRequest } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { GenerateLensSchema, generateLens } from "@/features/lenses";

const logger = getLogger("api.lenses.generate");

/**
 * POST /api/lenses/generate
 * Generate a custom lens from a description using AI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = GenerateLensSchema.parse(body);

    logger.info({ descriptionLength: description.length }, "lenses.generate_request");

    const result = await generateLens(description);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
