import { Text, View } from "react-native";
import { useI18n } from "../helpers/i18n";

// Neutral fill for a page with no content yet. Delete once the page is real.
export function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useI18n();
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-forest-900 text-[20px] font-semibold">{t(titleKey)}</Text>
    </View>
  );
}
