import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, clearToken, getToken, saveToken } from "./api";

const REMEMBERED = "rememberedUser";

type LoginResponse = { token: string; user: { name: string; email: string } };

export async function signIn(identifier: string, password: string) {
  try {
    const response = await apiFetch<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email: identifier.trim(), password, device: "mobile" }),
    });
    await saveToken(response.token);
    return response.user;
  } catch (error) {
    console.log("[login] failed:", error);
    (globalThis as Record<string, unknown>).__loginDetail =
      error instanceof Error ? error.message : String(error);
    return null;
  }
}

export async function signOut() {
  try {
    if (await getToken()) await apiFetch("/logout", { method: "POST" });
  } catch {
    // Clear local auth even when the network is unavailable.
  } finally {
    await clearToken();
  }
}

export type CurrentUser = { id: number; name: string; email: string; role?: string };
export const fetchCurrentUser = () => apiFetch<CurrentUser>("/me");
export const updateCurrentUser = (user: Pick<CurrentUser, "name" | "email">) =>
  apiFetch<CurrentUser>("/me", { method: "PUT", body: JSON.stringify(user) });
export const changePassword = (password: string) =>
  apiFetch<CurrentUser>("/me", { method: "PUT", body: JSON.stringify({ password }) });

export { getToken };
export const getRememberedUser = () => AsyncStorage.getItem(REMEMBERED);
export const setRememberedUser = (value: string | null) =>
  value === null ? AsyncStorage.removeItem(REMEMBERED) : AsyncStorage.setItem(REMEMBERED, value);
