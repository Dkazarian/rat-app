import { createBrowserId } from "@/utils/create-browser-id";

import type { UserId } from "@/services/users/types";

/** In-memory identity for a page session. */
export class UserStore {
  private userId?: UserId;
  private readonly createId: () => UserId;

  constructor(options: { userId?: UserId; createId?: () => UserId } = {}) {
    this.userId = options.userId;
    this.createId = options.createId ?? createBrowserId;
  }

  getOrCreateUserId(): UserId {
    return (this.userId ??= this.createId());
  }
}
