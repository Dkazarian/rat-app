import type { NextRequest } from "next/server";
import type { CategoryMutationResponse } from "@/contracts/session-api";
import { toCategoriesResponse } from "@/server/domain/category-rules";
import { errorResponse } from "@/server/http/responses";
import {
  createCategory,
  listCategories,
} from "@/server/redis/categories";
import { listExpenses } from "@/server/redis/expenses";
import {
  withLazySession,
  withOptionalSession,
} from "@/server/session/session-handler";
import { categoryNameBodySchema } from "@/server/validation";

export async function GET(request: NextRequest) {
  return withOptionalSession(request, async (sessionId) => {
    if (!sessionId) {
      return Response.json({
        categories: [],
        unclassifiedTotalMinor: 0,
        totalMinor: 0,
      });
    }
    const [categories, expenses] = await Promise.all([
      listCategories(sessionId),
      listExpenses(sessionId),
    ]);
    return Response.json(toCategoriesResponse(categories, expenses));
  });
}

export async function POST(request: NextRequest) {
  try {
    const { name } = categoryNameBodySchema.parse(await request.json());
    return withLazySession(request, async (sessionId) => {
      const category = await createCategory(sessionId, name);
      return Response.json(
        {
          category: { ...category, totalMinor: 0 },
        } satisfies CategoryMutationResponse,
        { status: 201 },
      );
    });
  } catch (error) {
    return errorResponse(error);
  }
}
