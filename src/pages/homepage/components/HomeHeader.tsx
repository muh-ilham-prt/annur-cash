import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MasjidPattern } from "../../../components/MasjidPattern";
import { Icon } from "../../../components/Icon";
import { TENANTS, TENANT } from "../../../theme/tenant";
import { useI18n } from "../../../helpers/i18n";
import { formatRupiah } from "../../../helpers/money";

const greetingKey = (hour: number) =>
  hour < 11 ? "morning" : hour < 15 ? "afternoon" : hour < 18 ? "evening" : "night";

interface HomeHeaderProps {
  collected: number;
  today: number;
  hasDue: boolean;
  onPressNotifications?: () => void;
}

export function HomeHeader({ collected, today, hasDue, onPressNotifications }: HomeHeaderProps) {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <LinearGradient
      colors={[theme.brand700, theme.brand950]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 96, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
    >
      <MasjidPattern />
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <Icon name={theme.brandIcon} size={26} color={theme.brand700} />
          </View>
          <View>
            <Text className="text-white/70 text-[12px]">
              {theme.title.replace("'", "’")} · {t(`home.greeting.${greetingKey(new Date().getHours())}`)}
            </Text>
            <Text className="text-white text-[16px] font-bold leading-tight">{theme.school}</Text>
          </View>
        </View>
        {/* ponytail: notifications hidden until the feature exists. Restore this block with onPressNotifications. */}
        {onPressNotifications && (
          <Pressable
            onPress={onPressNotifications}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("home.notifications")}
            className="relative h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <Icon name="bell" size={24} color="#fff" />
            {hasDue && (
              <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-gold-400 border-2 border-forest-800" />
            )}
          </Pressable>
        )}
      </View>
      <View className="mt-6">
        <Text className="text-white/70 text-[12px]">{t("home.collectedThisMonth")}</Text>
        <Text className="text-white text-[30px] font-bold tracking-tight mt-1">{formatRupiah(collected)}</Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Icon name="graph-up-bold" size={14} color="#b3e6cc" />
          <Text className="text-forest-200 text-[12px]">+{formatRupiah(today)} {t("home.today")}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
