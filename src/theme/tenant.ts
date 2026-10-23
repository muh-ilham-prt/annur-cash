import type { IconName } from "../components/Icon";

export type Tenant = "annur";

export interface TenantTheme {
  name: string;
  navLabel: string;
  school: string;
  brandIcon: IconName;
  title: string;
  sub: string;
  brand950: string;
  brand900: string;
  brand700: string;
  glow: string;
  accent400: string;
  accent500: string;
  accent600: string;
}

// Palette lifted from ui/kas-sekolah.html (forest/gold/cream). Mirror any change in
// tailwind.config.js — NativeWind needs class names, icons and gradients need raw hex.
export const NEUTRALS = {
  ink: "#18413B",
  muted: "#64748b",
  placeholder: "#94a3b8",
  forest900: "#0f4231",
  forest800: "#12503a",
  forest700: "#136447",
  forest600: "#187d57",
  forest100: "#d8f3e3",
  forest50: "#effaf4",
  gold600: "#c27f17",
  gold400: "#ecb94a",
  gold300: "#f3d27a",
  gold200: "#f8e4a8",
  cream: "#fbf7ee",
  slate500: "#64748b",
  slate400: "#94a3b8",
  sky100: "#e0f2fe",
  sky700: "#0369a1",
  rose100: "#ffe4e6",
  rose700: "#be123c",
  violet100: "#ede9fe",
  violet700: "#6d28d9",
} as const;

export const TENANTS: Record<Tenant, TenantTheme> = {
  annur: {
    name: "Kas Sekolah",
    // Icon-only wrap for the nav bar (name is 11 chars and would clip at 5 tabs).
    navLabel: "Profil",
    school: "AN-NUR Islamic Fullday School",
    brandIcon: "buildings-2-bold-duotone",
    title: "Assalamu'alaikum",
    sub: "Catat pembayaran siswa dengan mudah: lunas, setengah, atau kredit.",
    brand950: "#07271d",
    brand900: "#0f4231",
    brand700: "#136447",
    glow: "rgba(236,185,74,0.20)",
    accent400: "#4ab788",
    accent500: "#ecb94a",
    accent600: "#c27f17",
  },
};

export const TENANT: Tenant = "annur";
