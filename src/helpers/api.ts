import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ponytail: hardcoded fallback so a missing EAS env var can never brick login again; keep the env var as the override.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://cash.annurifs.sch.id/api").replace(/\/$/, "");
const TOKEN_KEY = "authToken";

// Web: expo-secure-store's native-only API breaks in SDK 58, use localStorage instead.
const tokenStore = Platform.OS === "web"
  ? {
      get: () => Promise.resolve(window.localStorage.getItem(TOKEN_KEY)),
      set: (v: string) => Promise.resolve(window.localStorage.setItem(TOKEN_KEY, v)),
      del: () => Promise.resolve(window.localStorage.removeItem(TOKEN_KEY)),
    }
  : {
      get: () => SecureStore.getItemAsync(TOKEN_KEY),
      set: (v: string) => SecureStore.setItemAsync(TOKEN_KEY, v),
      del: () => SecureStore.deleteItemAsync(TOKEN_KEY),
    };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, `API URL is not configured (env=${JSON.stringify(process.env.EXPO_PUBLIC_API_URL)})`);
  }
  const token = await tokenStore.get();
  const response = await fetch(`${API_URL}/${path.replace(/^\//, "")}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Request failed.";
    throw new ApiError(response.status, message);
  }
  return data as T;
}

export const getToken = () => tokenStore.get();
export const saveToken = (token: string) => tokenStore.set(token);
export const clearToken = () => tokenStore.del();
