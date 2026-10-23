import { Text, View } from "react-native";
import { Icon, type IconName } from "../../../components/Icon";
import { useI18n } from "../../../helpers/i18n";

const TILES: { key: "full" | "part" | "credit"; icon: IconName; iconBg: string; iconColor: string }[] = [
  { key: "full", icon: "check-circle-bold", iconBg: "#d8f3e3", iconColor: "#136447" },
  { key: "part", icon: "pie-chart-2-bold", iconBg: "#e0f2fe", iconColor: "#0369a1" },
  { key: "credit", icon: "clock-circle-bold", iconBg: "#f8e4a8", iconColor: "#c27f17" },
];

export function SummaryStats({ stats }: { stats: Record<"full" | "part" | "credit", number> }) {
  const { t } = useI18n();
  return (
    <View className="-mt-16 flex-row gap-3 px-5">
      {TILES.map((tile) => (
        <View key={tile.key} className="flex-1 rounded-2xl bg-white p-3 border border-forest-100">
          <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: tile.iconBg }}>
            <Icon name={tile.icon} size={20} color={tile.iconColor} />
          </View>
          <Text className="mt-2 text-forest-900 text-[18px] font-extrabold">{stats[tile.key]}</Text>
          <Text className="text-[11px] text-slate-500">{t(`home.status.${tile.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}
