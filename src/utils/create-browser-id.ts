/** Creates an opaque session ID on HTTPS, localhost, and HTTP LAN addresses. */
export function createBrowserId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Unlike randomUUID, getRandomValues is available outside secure contexts.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
