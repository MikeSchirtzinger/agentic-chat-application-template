import type { NextRequest } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { deleteCustomLens } from "@/features/lenses";

const logger = getLogger("api.lenses.delete");

/**
 * DELETE /api/lenses/:id
 * Delete a custom lens by ID.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    logger.info({ lensId: id }, "lenses.delete_request");

    await deleteCustomLens(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
