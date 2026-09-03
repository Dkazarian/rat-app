import type { ApiErrorCode } from "@/contracts/session-api";
import { SessionApiError } from "./session-api-client";

const messages: Record<"en" | "es", Partial<Record<ApiErrorCode, string>>> = {
  en: {
    classification_unavailable: "Automatic sorting is not available yet.",
    session_not_found:
      "This anonymous session expired. Start a new session to continue.",
    expense_limit_reached: "This session has reached its 100-expense limit.",
    service_unavailable: "The service is temporarily unavailable. Try again.",
  },
  es: {
    classification_unavailable:
      "La clasificación automática todavía no está disponible.",
    session_not_found:
      "Esta sesión anónima venció. Iniciá una nueva para continuar.",
    expense_limit_reached: "Esta sesión alcanzó el límite de 100 gastos.",
    service_unavailable:
      "El servicio no está disponible por el momento. Probá de nuevo.",
  },
};

export function getApiErrorMessage(
  error: unknown,
  locale: "en" | "es",
): string {
  if (error instanceof SessionApiError) {
    return messages[locale][error.code] ?? error.message;
  }
  return locale === "es"
    ? "Algo salió mal. Probá de nuevo."
    : "Something went wrong. Try again.";
}
