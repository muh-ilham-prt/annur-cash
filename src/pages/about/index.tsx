import { Pressable, Text, View } from "react-native";
import Constants from "expo-constants";
import { TENANTS, TENANT } from "../../theme/tenant";
import { Icon } from "../../components/Icon";

export default function AboutPage({ onBack }: { onBack: () => void }) {
  const theme = TENANTS[TENANT];
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-line gap-2">
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kembali">
          <Icon name="chevron-left" size={26} color={theme.accent600} />
        </Pressable>
        <Text className="text-ink font-semibold text-[15px]">Tentang aplikasi</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Icon name={theme.brandIcon} size={56} color={theme.accent500} />
        <Text className="text-ink text-xl font-bold mt-4">{theme.name}</Text>
        <Text className="text-muted text-[13px] mt-1">
          Versi {Constants.expoConfig?.version ?? "—"}
        </Text>
      </View>
    </View>
  );
}
