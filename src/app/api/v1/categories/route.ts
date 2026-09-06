import type { NextRequest } from "next/server";
import type { CategoryMutationResponse } from "@/contracts/session-api";
import { errorResponse } from "@/server/http/responses";
import { createCategory, getCategories } from "@/server/redis/categories";
import {
  requireSessionId,
  SESSION_COOKIE_NAME,
} from "@/server/session/session-id";
import { categoryNameBodySchema } from "@/server/validation";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await requireSessionId(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    return Response.json(await getCategories(sessionId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await requireSessionId(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const { name } = categoryNameBodySchema.parse(await request.json());
    const category = await createCategory(sessionId, name);
    return Response.json({ category } satisfies CategoryMutationResponse, {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
