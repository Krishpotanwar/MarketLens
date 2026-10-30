export const DEFAULT_PRODUCTION_BACKEND = "https://marketlens-87wo.onrender.com";

/**
 * Resolves the backend API URL for MarketLens.
 *
 * - In local development / test environments (localhost, 127.0.0.1, or local preview),
 *   defaults to "" so the Vite development reverse-proxy routes requests to local port 8000.
 * - In production environments (e.g., hosted on Vercel or custom domain),
 *   defaults to the live Render backend (`https://marketlens-87wo.onrender.com`)
 *   unless explicitly overridden by the `VITE_API_URL` environment variable.
 */
export function getApiBase(): string {
  const envUrl = import.meta.env?.VITE_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Local development or loopback: use relative path for Vite proxy
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || !host) {
      return "";
    }
    // Remote deployed web apps (like Vercel) connect to the Render production backend
    return DEFAULT_PRODUCTION_BACKEND;
  }

  return "";
}

export const API_BASE = getApiBase();
