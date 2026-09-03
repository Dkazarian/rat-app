import type {
  ApiErrorResponse,
  CategoriesResponse,
  CategoryMutationResponse,
  ExpenseMutationResponse,
  ExpensesResponse,
  PromptMutationResponse,
  SessionResponse,
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
  method?: "GET" | "POST" | "PUT" | "DELETE";
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

const sessionPath = (sessionId: string) =>
  `/session/${encodeURIComponent(sessionId)}`;

export type SessionApi = Readonly<{
  createSession: (signal?: AbortSignal) => Promise<SessionResponse>;
  getCategories: (
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<CategoriesResponse>;
  createCategory: (
    sessionId: string,
    name: string,
  ) => Promise<CategoryMutationResponse>;
  deleteCategory: (sessionId: string, categoryId: string) => Promise<void>;
  getExpenses: (
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<ExpensesResponse>;
  updateExpenseCategory: (
    sessionId: string,
    expenseId: string,
    categoryId: string | null,
  ) => Promise<ExpenseMutationResponse>;
  deleteExpense: (sessionId: string, expenseId: string) => Promise<void>;
  submitPrompt: (
    sessionId: string,
    prompt: string,
    locale: "en" | "es",
  ) => Promise<PromptMutationResponse>;
}>;

export const browserSessionApi: SessionApi = {
  createSession: (signal) => request("/session", { method: "POST", signal }),
  getCategories: (sessionId, signal) =>
    request(`${sessionPath(sessionId)}/categories`, { signal }),
  createCategory: (sessionId, name) =>
    request(`${sessionPath(sessionId)}/categories`, {
      method: "POST",
      body: { name },
    }),
  deleteCategory: (sessionId, categoryId) =>
    request(
      `${sessionPath(sessionId)}/categories/${encodeURIComponent(categoryId)}`,
      { method: "DELETE" },
    ),
  getExpenses: (sessionId, signal) =>
    request(`${sessionPath(sessionId)}/expenses`, { signal }),
  updateExpenseCategory: (sessionId, expenseId, categoryId) =>
    request(
      `${sessionPath(sessionId)}/expenses/${encodeURIComponent(expenseId)}/category`,
      { method: "PUT", body: { categoryId } },
    ),
  deleteExpense: (sessionId, expenseId) =>
    request(
      `${sessionPath(sessionId)}/expenses/${encodeURIComponent(expenseId)}`,
      { method: "DELETE" },
    ),
  submitPrompt: (sessionId, prompt, locale) =>
    request(`${sessionPath(sessionId)}/expenses/prompt`, {
      method: "POST",
      body: { prompt, locale },
    }),
};
