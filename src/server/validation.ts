import { z } from "zod";
import {
  CATEGORY_NAME_MAX_LENGTH,
  EXPENSE_PROMPT_MAX_LENGTH,
  expenseDtoSchema,
  categoryColors,
} from "@/contracts/session-api";

export const canonicalUuidSchema = z.uuid();
export const safeMinorAmountSchema = z.number().int().safe().nonnegative();

export const storedCategorySchema = z.object({
  id: canonicalUuidSchema,
  name: z.string().min(1).max(CATEGORY_NAME_MAX_LENGTH),
  color: z.enum(categoryColors),
});

export const storedExpenseSchema = expenseDtoSchema;

export const categoryNameBodySchema = z
  .object({
    name: z.string(),
  })
  .strict();

export const promptBodySchema = z
  .object({
    prompt: z
      .string()
      .max(EXPENSE_PROMPT_MAX_LENGTH)
      .refine((value) => value.trim().length > 0),
    locale: z.enum(["en", "es"]),
  })
  .strict();
