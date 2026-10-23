import { Pressable, Text, View } from "react-native";
import { Icon } from "../../../components/Icon";
import { useI18n } from "../../../helpers/i18n";
import { formatRupiah } from "../../../helpers/money";

export function OutstandingBanner({ amount, onPress }: { amount: number; onPress?: () => void }) {
  const { t } = useI18n();
  return (
    <View className="mx-5 mt-4 flex-row items-center gap-3 rounded-2xl border border-gold-300 p-3.5" style={{ backgroundColor: "rgba(248,228,168,0.5)" }}>
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-gold-300">
        <Icon name="danger-triangle-bold-duotone" size={24} color="#07271d" />
      </View>
      <View className="flex-1">
        <Text className="text-gold-600 text-[12px] font-semibold">{t("home.remainingBill")}</Text>
        <Text className="text-forest-950 text-[16px] font-extrabold">{formatRupiah(amount)}</Text>
      </View>
      <Pressable onPress={onPress} accessibilityRole="button" className="rounded-xl bg-forest-800 px-3 py-1.5">
        <Text className="text-white text-[12px] font-semibold">{t("home.view")}</Text>
      </Pressable>
    </View>
  );
}
