import { z } from "zod";
import {
  CATEGORY_NAME_MAX_LENGTH,
  EXPENSE_PROMPT_MAX_LENGTH,
  categoryColors,
} from "@/contracts/session-api";

export const canonicalUuidSchema = z.uuid();
export const safeMinorAmountSchema = z.number().int().safe().nonnegative();

export const storedCategorySchema = z.object({
  id: canonicalUuidSchema,
  name: z.string().min(1).max(CATEGORY_NAME_MAX_LENGTH),
  color: z.enum(categoryColors),
});

export const storedExpenseSchema = z.object({
  id: canonicalUuidSchema,
  description: z.string().trim().min(1),
  amountMinor: safeMinorAmountSchema.positive(),
  categoryId: canonicalUuidSchema.nullable(),
  createdAt: safeMinorAmountSchema,
});

export const categoryNameBodySchema = z.object({
  name: z.string(),
});

export const promptBodySchema = z.object({
  prompt: z.string().trim().min(1).max(EXPENSE_PROMPT_MAX_LENGTH),
  locale: z.enum(["en", "es"]),
});
