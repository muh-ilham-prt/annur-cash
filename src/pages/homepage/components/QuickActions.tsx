import { Pressable, Text, View } from "react-native";
import { Icon, type IconName } from "../../../components/Icon";
import type { DeepId } from "../../../components/BottomNav";

export const QUICK_ACTIONS: {
  id: "record" | "student" | "types" | "report";
  icon: IconName;
  bg: string;
  color: string;
  nav?: DeepId;
}[] = [
  {
    id: "record",
    icon: "hand-money-bold-duotone",
    bg: "#d8f3e3",
    color: "#136447",
    nav: "Record",
  },
  {
    id: "student",
    icon: "users-group-rounded-bold",
    bg: "#e0f2fe",
    color: "#0369a1",
    nav: "Students",
  },
  {
    id: "types",
    icon: "tag-price-bold",
    bg: "#f8e4a8",
    color: "#c27f17",
    nav: "Types",
  },
  {
    id: "report",
    icon: "chart-2-bold",
    bg: "#ede9fe",
    color: "#6d28d9",
    nav: "Report",
  },
];

export function QuickActions({
  onAction,
}: {
  onAction: (id: (typeof QUICK_ACTIONS)[number]["id"]) => void;
}) {
  return (
    <View className="mt-6 px-5">
      <Text className="mb-3 text-forest-900 text-[14px] font-bold">
        Aksi cepat
      </Text>
      <View className="flex-row justify-between">
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onAction(action.id)}
            accessibilityRole="button"
            accessibilityLabel={action.id === "record" ? "Catat pembayaran" : action.id === "student" ? "Siswa" : action.id === "types" ? "Jenis pembayaran" : "Laporan"}
            className="items-center gap-2 w-[22%]"
          >
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: action.bg }}
            >
              <Icon name={action.icon} size={28} color={action.color} />
            </View>
            <Text
              className="text-center text-[11px] font-medium leading-tight text-slate-600"
              numberOfLines={2}
            >
              {action.id === "record" ? "Catat pembayaran" : action.id === "student" ? "Siswa" : action.id === "types" ? "Jenis pembayaran" : "Laporan"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

