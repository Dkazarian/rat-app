import { randomUUID } from "node:crypto";
import { expect } from "vitest";

export const sessionId = randomUUID();
export const otherSessionId = randomUUID();
export const categoryId = randomUUID();
export const expenseId = randomUUID();

export const category = {
  id: categoryId,
  name: "Food",
  color: "coral" as const,
  totalMinor: 1250,
};

export const expense = {
  id: expenseId,
  description: "Lunch",
  amountMinor: 1250,
  categoryId,
  createdAt: 1_800_000_000_000,
};

export function routeContext<T extends Readonly<{ sessionId: string }>>(
  params: T,
) {
  return { params: Promise.resolve(params) };
}

export function jsonRequest(
  method: string,
  body: unknown,
  cookieSessionId?: string,
) {
  return new Request("https://rat.test/ignored", {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookieSessionId
        ? { cookie: `ratapp_session=${cookieSessionId}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function expectRouteError(
  response: Response,
  status: number,
  code: string,
  field?: string,
) {
  expect(response.status).toBe(status);
  const body = await response.json();
  expect(body).toMatchObject({
    error: { code, ...(field ? { field } : {}) },
  });
  return body;
}
