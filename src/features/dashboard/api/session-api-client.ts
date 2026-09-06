import type {
  ApiErrorResponse,
  CategoriesResponse,
  CategoryMutationResponse,
  ExpensesResponse,
  PromptMutationResponse,
} from "@/contracts/session-api";

export class SessionApiError extends Error {
  constructor(
    readonly code: ApiErrorResponse["error"]["code"],
    message: string,
    readonly field?: ApiErrorResponse["error"]["field"],
  ) {
    super(message);
    this.name = "SessionApiError";
  }
}

type RequestOptions = Readonly<{
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}>;

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal,
    headers:
      options.body === undefined
        ? undefined
        : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = payload as ApiErrorResponse | undefined;
    throw new SessionApiError(
      error?.error.code ?? "internal_error",
      error?.error.message ?? "The request could not be completed.",
      error?.error.field,
    );
  }
  return payload as T;
}

export type SessionApi = Readonly<{
  createSession: (signal?: AbortSignal) => Promise<void>;
  getCategories: (signal?: AbortSignal) => Promise<CategoriesResponse>;
  createCategory: (name: string) => Promise<CategoryMutationResponse>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getExpenses: (signal?: AbortSignal) => Promise<ExpensesResponse>;
  submitPrompt: (
    prompt: string,
    locale: "en" | "es",
  ) => Promise<PromptMutationResponse>;
}>;

export const browserSessionApi: SessionApi = {
  createSession: (signal) =>
    request("/api/v1/session", { method: "POST", signal }),
  getCategories: (signal) => request("/api/v1/categories", { signal }),
  createCategory: (name) =>
    request("/api/v1/categories", {
      method: "POST",
      body: { name },
    }),
  deleteCategory: (categoryId) =>
    request(`/api/v1/categories/${encodeURIComponent(categoryId)}`, {
      method: "DELETE",
    }),
  getExpenses: (signal) => request("/api/v1/expenses", { signal }),
  submitPrompt: (prompt, locale) =>
    request("/api/v1/expenses/prompt", {
      method: "POST",
      body: { prompt, locale },
    }),
};
