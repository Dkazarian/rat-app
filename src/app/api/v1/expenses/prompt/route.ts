import type { NextRequest } from "next/server";
import { z } from "zod";
import { getServerConfig } from "@/server/config";
import {
  ExpenseExtractorError,
  extractExpenses,
} from "@/server/ai/expense-extractor";
import {
  applicationErrors,
  RepositoryUnavailableError,
} from "@/server/domain/errors";
import { logger } from "@/server/logger";
import {
  validateExpenseCandidate,
  type ExpenseCandidate,
} from "@/server/domain/expense-rules";
import { normalizeCategoryName } from "@/server/domain/category-rules";
import { errorResponse } from "@/server/http/responses";
import { listCategories } from "@/server/redis/categories";
import { createExpenses, listExpenses } from "@/server/redis/expenses";
import { consumeAiRateLimit } from "@/server/redis/ai-rate-limiter";
import { withLazySession } from "@/server/session/session-handler";
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

function promptErrorResponse(error: unknown): Response {
  if (error instanceof ExpenseExtractorError) {
    logger.warn("Expense extraction failed.", { kind: error.kind });
    return errorResponse(
      error.kind === "configuration"
        ? applicationErrors.internalError()
        : applicationErrors.serviceUnavailable(),
    );
  }
  if (error instanceof RepositoryUnavailableError) {
    logger.error("Expense prompt dependency failed.");
  } else if (!(error instanceof Error)) {
    logger.error("Expense prompt failed.");
  }
  return errorResponse(error);
}

async function submitPrompt(
  sessionId: string,
  prompt: string,
  locale: "en" | "es",
): Promise<Response> {
  const rateLimit = await consumeAiRateLimit(sessionId);
  if (!rateLimit.allowed) {
    throw applicationErrors.rateLimited(rateLimit.retryAfterSeconds);
  }
  const [categories, currentExpenses] = await Promise.all([
    listCategories(sessionId),
    listExpenses(sessionId),
  ]);
  const config = getServerConfig();
  const remainingCapacity =
    config.maxExpensesPerSession - currentExpenses.length;
  if (remainingCapacity <= 0) throw applicationErrors.expenseLimit();

  const extraction = await extractExpenses({
    prompt,
    locale,
    categoryNames: categories.map(({ name }) => name),
  });
  const categoryIds = new Set(categories.map(({ id }) => id));
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
            categories,
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
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, locale } = parsePromptBody(await request.json());
    return withLazySession(
      request,
      (sessionId) => submitPrompt(sessionId, prompt, locale),
      promptErrorResponse,
    );
  } catch (error) {
    return promptErrorResponse(error);
  }
}
