import type { NextRequest } from "next/server";
import { z } from "zod";
import { getServerConfig } from "@/server/config";
import {
  ExpenseExtractorError,
  extractExpenses,
} from "@/server/ai/expense-extractor";
import { applicationErrors } from "@/server/domain/errors";
import {
  validateExpenseCandidate,
  type ExpenseCandidate,
} from "@/server/domain/expense-rules";
import { normalizeCategoryName } from "@/server/domain/category-rules";
import { errorResponse } from "@/server/http/responses";
import { getCategories } from "@/server/redis/categories";
import { createExpenses, getExpenses } from "@/server/redis/expenses";
import {
  requireSessionId,
  SESSION_COOKIE_NAME,
} from "@/server/session/session-id";
import { promptBodySchema } from "@/server/validation";

function parsePromptBody(body: unknown) {
  try {
    return promptBodySchema.parse(body);
  } catch (error) {
    if (
      error instanceof z.ZodError &&
      error.issues.length > 0 &&
      error.issues.every((issue) => issue.path[0] === "prompt")
    ) {
      throw applicationErrors.invalidPromptRequest();
    }
    throw error;
  }
}

function resolveCategoryId(
  categoryName: unknown,
  categories: ReadonlyArray<{ id: string; name: string }>,
): string | null {
  if (typeof categoryName !== "string") return null;
  let normalizedName: string;
  try {
    normalizedName =
      normalizeCategoryName(categoryName).toLocaleLowerCase("en-US");
  } catch {
    return null;
  }
  const matches = categories.filter(
    (category) => category.name.toLocaleLowerCase("en-US") === normalizedName,
  );
  return matches.length === 1 ? matches[0].id : null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await requireSessionId(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const { prompt, locale } = parsePromptBody(await request.json());
    const [categoriesResponse, expensesResponse] = await Promise.all([
      getCategories(sessionId),
      getExpenses(sessionId),
    ]);
    const config = getServerConfig();
    const remainingCapacity =
      config.maxExpensesPerSession - expensesResponse.expenses.length;
    if (remainingCapacity <= 0) throw applicationErrors.expenseLimit();

    const extraction = await extractExpenses({
      prompt,
      locale,
      categoryNames: categoriesResponse.categories.map(({ name }) => name),
    });
    const categoryIds = new Set(
      categoriesResponse.categories.map(({ id }) => id),
    );
    const acceptedCandidates: ExpenseCandidate[] = [];
    let rejectedCount = 0;

    for (const candidate of extraction.expenses) {
      try {
        const validated = validateExpenseCandidate(
          {
            description: candidate.description,
            amountMinor: candidate.amountMinor,
            categoryId: resolveCategoryId(
              candidate.categoryName,
              categoriesResponse.categories,
            ),
          },
          categoryIds,
        );
        if (acceptedCandidates.length >= remainingCapacity) {
          rejectedCount += 1;
        } else {
          acceptedCandidates.push(validated);
        }
      } catch {
        rejectedCount += 1;
      }
    }

    if (acceptedCandidates.length === 0) {
      throw applicationErrors.noExpensesExtracted();
    }

    const expenses = await createExpenses(sessionId, acceptedCandidates);
    if (expenses.length === 0) {
      throw applicationErrors.noExpensesExtracted();
    }
    return Response.json({ expenses, rejectedCount });
  } catch (error) {
    if (error instanceof ExpenseExtractorError) {
      return errorResponse(
        error.kind === "configuration"
          ? applicationErrors.internalError()
          : applicationErrors.serviceUnavailable(),
      );
    }
    return errorResponse(error);
  }
}
