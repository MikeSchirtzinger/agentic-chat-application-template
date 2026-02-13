import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for lens operations. */
export type LensErrorCode = "LENS_NOT_FOUND" | "LENS_GENERATION_FAILED" | "LENS_LIMIT_EXCEEDED";

/**
 * Base error for lens-related errors.
 */
export class LensError extends Error {
  readonly code: LensErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: LensErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class LensNotFoundError extends LensError {
  constructor(id: string) {
    super(`Lens not found: ${id}`, "LENS_NOT_FOUND", 404);
  }
}

export class LensGenerationFailedError extends LensError {
  constructor(message: string) {
    super(`Lens generation failed: ${message}`, "LENS_GENERATION_FAILED", 502);
  }
}

export class LensLimitExceededError extends LensError {
  constructor() {
    super("Cannot activate more than 5 lenses at once", "LENS_LIMIT_EXCEEDED", 400);
  }
}
