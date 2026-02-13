import { env } from "@/core/config/env";
import { getLogger } from "@/core/logging";

import { PRESET_LENS_MAP, PRESET_LENSES } from "./constants";
import { LensGenerationFailedError, LensNotFoundError } from "./errors";
import * as repository from "./repository";
import type { CreateCustomLensInput } from "./schemas";
import type { CustomLens, Lens } from "./types";

const logger = getLogger("lenses.service");

const META_PROMPT = `You are a cognitive lens generator. Given a description of a thinking style or perspective, generate a structured lens definition.

Return ONLY a JSON object with these fields:
- name: A short, catchy name (2-4 words)
- description: A one-sentence description (under 100 chars)
- prompt: Detailed instructions for how to apply this lens (200-500 words)

The prompt should be specific, actionable, and guide the AI to think from this perspective.

Return ONLY valid JSON, no markdown formatting, no explanations.`;

export async function getAllLenses(): Promise<Lens[]> {
  logger.info("lenses.get_all_started");

  const customLensRows = await repository.findAll();
  const customLenses: CustomLens[] = customLensRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
    icon: row.icon,
    originalInput: row.originalInput,
    createdAt: row.createdAt.toISOString(),
  }));

  const allLenses: Lens[] = [...PRESET_LENSES, ...customLenses];

  logger.info({ count: allLenses.length }, "lenses.get_all_completed");
  return allLenses;
}

export async function resolveActiveLenses(ids: string[]): Promise<Lens[]> {
  logger.info({ lensIds: ids }, "lenses.resolve_started");

  const resolved: Lens[] = [];
  const customIds: string[] = [];

  // First pass: resolve presets
  for (const id of ids) {
    const preset = PRESET_LENS_MAP.get(id);
    if (preset) {
      resolved.push(preset);
    } else {
      customIds.push(id);
    }
  }

  // Second pass: fetch custom lenses from DB
  if (customIds.length > 0) {
    const customLensRows = await repository.findAll();
    const customLensMap = new Map(customLensRows.map((row) => [row.id, row]));

    for (const id of customIds) {
      const row = customLensMap.get(id);
      if (row) {
        resolved.push({
          id: row.id,
          name: row.name,
          description: row.description,
          prompt: row.prompt,
          icon: row.icon,
          originalInput: row.originalInput,
          createdAt: row.createdAt.toISOString(),
        });
      } else {
        logger.warn({ lensId: id }, "lenses.lens_not_found");
        throw new LensNotFoundError(id);
      }
    }
  }

  logger.info({ resolvedCount: resolved.length }, "lenses.resolve_completed");
  return resolved;
}

export async function generateLens(
  description: string,
): Promise<{ name: string; description: string; prompt: string }> {
  logger.info({ descriptionLength: description.length }, "lenses.generate_started");

  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: [
          { role: "system", content: META_PROMPT },
          { role: "user", content: description },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "lenses.generate_failed");
    throw new LensGenerationFailedError(`Failed to connect to OpenRouter: ${message}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    logger.error({ status: response.status, body: text }, "lenses.generate_api_error");
    throw new LensGenerationFailedError(`OpenRouter API error (${response.status}): ${text}`);
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>;
  };

  try {
    data = await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "lenses.generate_parse_failed");
    throw new LensGenerationFailedError(`Failed to parse response: ${message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    logger.error({ data }, "lenses.generate_empty_response");
    throw new LensGenerationFailedError("Empty response from OpenRouter");
  }

  // Strip markdown code fences if present (LLMs often wrap JSON in ```json ... ```)
  const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  // Parse the JSON content
  let result: { name: string; description: string; prompt: string };
  try {
    result = JSON.parse(cleaned);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message, content }, "lenses.generate_json_parse_failed");
    throw new LensGenerationFailedError(`Failed to parse generated lens JSON: ${message}`);
  }

  // Validate structure
  if (!result.name || !result.description || !result.prompt) {
    logger.error({ result }, "lenses.generate_invalid_structure");
    throw new LensGenerationFailedError("Generated lens missing required fields");
  }

  logger.info({ name: result.name }, "lenses.generate_completed");
  return result;
}

export async function createCustomLens(data: CreateCustomLensInput): Promise<CustomLens> {
  logger.info({ name: data.name }, "lenses.create_started");

  const row = await repository.create({
    name: data.name,
    description: data.description,
    prompt: data.prompt,
    icon: data.icon,
    originalInput: data.originalInput,
  });

  const lens: CustomLens = {
    id: row.id,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
    icon: row.icon,
    originalInput: row.originalInput,
    createdAt: row.createdAt.toISOString(),
  };

  logger.info({ lensId: lens.id }, "lenses.create_completed");
  return lens;
}

export async function deleteCustomLens(id: string): Promise<void> {
  logger.info({ lensId: id }, "lenses.delete_started");

  const deleted = await repository.deleteById(id);
  if (!deleted) {
    throw new LensNotFoundError(id);
  }

  logger.info({ lensId: id }, "lenses.delete_completed");
}
