import AsyncStorage from "@react-native-async-storage/async-storage";

// Offline-only auth: credentials live in .env (EXPO_PUBLIC_*, inlined at build time).
// This is a device lock, not security — anyone with the bundle can read the password.
const USER = process.env.EXPO_PUBLIC_AUTH_USER ?? "";
const PASSWORD = process.env.EXPO_PUBLIC_AUTH_PASSWORD ?? "";
const REMEMBERED = "rememberedUser";

export async function signIn(identifier: string, password: string) {
  if (USER && identifier.trim() === USER && password === PASSWORD) return true;
  // Nothing configured: unlock instead of bricking the app.
  return !USER && !PASSWORD;
}

export const getRememberedUser = () => AsyncStorage.getItem(REMEMBERED);
export const setRememberedUser = (value: string | null) =>
  value === null ? AsyncStorage.removeItem(REMEMBERED) : AsyncStorage.setItem(REMEMBERED, value);
