import type { NextRequest } from "next/server";
import { applicationErrors } from "@/server/domain/errors";
import { errorResponse } from "@/server/http/responses";
import {
  requireSessionId,
  SESSION_COOKIE_NAME,
} from "@/server/session/session-id";
import { promptBodySchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    await requireSessionId(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    promptBodySchema.parse(await request.json());
    throw applicationErrors.classificationUnavailable();
  } catch (error) {
    return errorResponse(error);
  }
}
