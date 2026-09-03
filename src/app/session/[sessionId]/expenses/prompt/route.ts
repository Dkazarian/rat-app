import { applicationErrors } from "@/server/domain/errors";
import { errorResponse, readBoundedJson } from "@/server/http/responses";
import { requireSessionId } from "@/server/session/session-id";
import { promptBodySchema } from "@/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ sessionId: string }>>;
}>;

export async function POST(request: Request, context: RouteContext) {
  try {
    const sessionId = (await context.params).sessionId;
    await requireSessionId(sessionId);
    await readBoundedJson(request, promptBodySchema);
    throw applicationErrors.classificationUnavailable();
  } catch (error) {
    return errorResponse(error);
  }
}
