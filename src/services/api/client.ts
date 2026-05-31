import { ENV } from "@/config/env";
import { ApiClient } from "./httpClient";

const ACCESS_TOKEN_STORAGE_KEY = "nexus_access_token";

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export const apiClient = new ApiClient({
  baseUrl: ENV.apiBaseUrl,
  getAccessToken: getStoredAccessToken,
});

