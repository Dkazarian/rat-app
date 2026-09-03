import type { CategoryMutationResponse } from "@/contracts/session-api";
import {
  errorResponse,
  noStoreJson,
  readBoundedJson,
} from "@/server/http/responses";
import { getCategoryManager } from "@/server/redis/persistence";
import { requireSessionId } from "@/server/session/session-id";
import { categoryNameBodySchema } from "@/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ sessionId: string }>>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  try {
    const sessionId = await requireSessionId((await context.params).sessionId);
    return noStoreJson(await getCategoryManager().getCategories(sessionId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const sessionId = await requireSessionId((await context.params).sessionId);
    const { name } = await readBoundedJson(request, categoryNameBodySchema);
    const category = await getCategoryManager().createCategory(sessionId, name);
    return noStoreJson<CategoryMutationResponse>({ category }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
