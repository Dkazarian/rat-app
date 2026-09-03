import { errorResponse, noStoreEmpty } from "@/server/http/responses";
import { parseId } from "@/server/ids";
import { getCategoryManager } from "@/server/redis/persistence";
import { requireSessionId } from "@/server/session/session-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ sessionId: string; categoryId: string }>>;
}>;

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { sessionId: unsafeSessionId, categoryId: unsafeCategoryId } =
      await context.params;
    const sessionId = await requireSessionId(unsafeSessionId);
    const categoryId = parseId(unsafeCategoryId);
    await getCategoryManager().deleteCategory(sessionId, categoryId);
    return noStoreEmpty();
  } catch (error) {
    return errorResponse(error);
  }
}
