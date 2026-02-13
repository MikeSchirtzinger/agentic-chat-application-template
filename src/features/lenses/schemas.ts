import { z } from "zod/v4";

export const LensIdSchema = z.string().min(1);

export const ActiveLensIdsSchema = z.array(LensIdSchema).max(5).default([]);

export const GenerateLensSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),
});

export type GenerateLensInput = z.infer<typeof GenerateLensSchema>;

export const CreateCustomLensSchema = z.object({
  name: z
    .string()
    .min(1, "Name must be at least 1 character")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .min(1, "Description must be at least 1 character")
    .max(500, "Description must be at most 500 characters"),
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
  icon: z.string().default("Sparkles"),
  originalInput: z.string(),
});

export type CreateCustomLensInput = z.infer<typeof CreateCustomLensSchema>;
