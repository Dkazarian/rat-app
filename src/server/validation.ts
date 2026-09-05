import { z } from "zod";
import { categoryColors } from "@/contracts/session-api";

export const canonicalUuidSchema = z.uuid();
export const safeMinorAmountSchema = z.number().int().safe().nonnegative();

export const storedCategorySchema = z.object({
  id: canonicalUuidSchema,
  name: z.string().min(1).max(24),
  color: z.enum(categoryColors),
});

export const storedExpenseSchema = z.object({
  id: canonicalUuidSchema,
  description: z.string().trim().min(1),
  amountMinor: safeMinorAmountSchema.positive(),
  categoryId: canonicalUuidSchema.nullable(),
  createdAt: safeMinorAmountSchema,
});

export const storedSessionMetaSchema = z.object({
  schemaVersion: z.literal("1"),
  createdAt: z.coerce.number().int().safe().nonnegative(),
  updatedAt: z.coerce.number().int().safe().nonnegative(),
});

export const categoryNameBodySchema = z.object({
  name: z.string(),
});

export const promptBodySchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  locale: z.enum(["en", "es"]),
});
