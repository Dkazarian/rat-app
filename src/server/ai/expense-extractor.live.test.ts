import { describe, expect, it } from "vitest";
import {
  ExpenseExtractorError,
  expenseExtractionOutputSchema,
  extractExpenses,
} from "./expense-extractor";

const hasLiveConfiguration =
  Boolean(process.env.OPENAI_API_KEY) &&
  Boolean(process.env.OPENAI_MODEL) &&
  !/^replace[_-]with/i.test(process.env.OPENAI_API_KEY ?? "");

describe.skipIf(!hasLiveConfiguration)("OpenAI live expense extraction", () => {
  it("extracts one minimal expense through the configured model", async () => {
    let result: Awaited<ReturnType<typeof extractExpenses>>;
    try {
      result = await extractExpenses({
        prompt: "Coffee $1.25",
        locale: "en",
        categoryNames: [],
      });
    } catch (error) {
      if (error instanceof ExpenseExtractorError) {
        throw new Error(`Live OpenAI extraction failed: ${error.kind}`);
      }
      throw new Error("Live OpenAI extraction failed unexpectedly.");
    }

    expect(expenseExtractionOutputSchema.safeParse(result).success).toBe(true);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0]).toMatchObject({ amountMinor: 125 });
    expect(result.expenses[0]?.description.trim().length).toBeGreaterThan(0);
  });
});
