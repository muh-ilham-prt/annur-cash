import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NEUTRALS, type TenantTheme } from "../theme/tenant";
import { Icon, type IconName } from "./Icon";

// The app's global navigation. Module screens render the same bar and differ only
// by which item is active, so the list lives here rather than as a prop.
// Tabs mirror the reference nav (home / siswa / catat / laporan) plus Profile.
export const NAV_ITEMS: {
  id: "Home" | "Students" | "Record" | "Report" | "Profile";
  icon: IconName;
  label: string;
  size: number;
  // The record tab floats half over the bar, so the bar must not clip it.
  floating?: boolean;
}[] = [
  { id: "Home", icon: "home-2-bold", label: "Beranda", size: 28 },
  {
    id: "Students",
    icon: "users-group-rounded-bold",
    label: "Siswa",
    size: 28,
  },
  {
    id: "Record",
    icon: "add-circle-bold",
    label: "Catat",
    size: 56,
    floating: true,
  },
  { id: "Report", icon: "chart-2-bold", label: "Laporan", size: 28 },
  {
    id: "Profile",
    icon: "users-group-rounded-bold",
    label: "Profil",
    size: 28,
  },
];

export type NavId = (typeof NAV_ITEMS)[number]["id"];

// Destinations that are not menu items: screens inside a tab's own stack.
export type DeepId = NavId | "Types";

interface BottomNavProps {
  activeId: NavId;
  onSelect: (id: NavId) => void;
  theme: TenantTheme;
}

export function BottomNav({ activeId, onSelect }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="bg-white flex-row items-stretch"
      // overflow:visible so the floating icon can rise above the bar
      style={{
        paddingBottom: Math.max(insets.bottom, 8),
        overflow: "visible",
        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.id === activeId;
        const label = item.label;
        const tint = active ? NEUTRALS.forest700 : NEUTRALS.slate400;
        const icon = (
          <Icon
            name={item.icon}
            size={item.size}
            color={item.floating ? NEUTRALS.forest800 : tint}
          />
        );
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            className="flex-1 items-center justify-end gap-1"
            style={{ paddingTop: item.floating ? 0 : 10, paddingBottom: 10 }}
          >
            {active && (
              <View className="absolute top-0 h-1 w-8 rounded-full bg-gold-400" />
            )}
            {/* FAB: the white circle + its padding cover the bar's top edge, so the icon reads as floating. */}
            <View
              className="z-10 rounded-full"
              style={
                item.floating
                  ? {
                      marginTop: -24,
                      padding: 6,
                      backgroundColor: "#fff",
                      shadowColor: "#07271d",
                      shadowOpacity: 0.18,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 6,
                    }
                  : undefined
              }
            >
              {icon}
            </View>
            <Text className="text-[10px] font-semibold" style={{ color: tint }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

