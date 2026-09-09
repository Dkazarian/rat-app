import type { NextRequest } from "next/server";
import type { CategoryMutationResponse } from "@/contracts/session-api";
import { errorResponse } from "@/server/http/responses";
import { createCategory, getCategories } from "@/server/redis/categories";
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
    return Response.json(await getCategories(sessionId));
  });
}

export async function POST(request: NextRequest) {
  try {
    const { name } = categoryNameBodySchema.parse(await request.json());
    return withLazySession(request, async (sessionId) => {
      const category = await createCategory(sessionId, name);
      return Response.json({ category } satisfies CategoryMutationResponse, {
        status: 201,
      });
    });
  } catch (error) {
    return errorResponse(error);
  }
}
