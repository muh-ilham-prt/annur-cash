import { Pressable, ScrollView, Text, View } from "react-native";
import { Icon, type IconName } from "../../../components/Icon";
import { useI18n } from "../../../helpers/i18n";
import { formatRupiah } from "../../../helpers/money";

interface PaymentTypeCard {
  id: string;
  name: string;
  price: number;
  icon: IconName;
  bg: string;
  color: string;
}

export function PaymentTypesRail({ types, onManage }: { types: PaymentTypeCard[]; onManage?: () => void }) {
  const { t } = useI18n();
  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between px-5">
        <Text className="text-forest-900 text-[14px] font-bold">{t("home.paymentTypes")}</Text>
        <Pressable onPress={onManage} accessibilityRole="link" className="flex-row items-center gap-1">
          <Text className="text-forest-600 text-[12px] font-semibold">{t("home.manage")}</Text>
          <Icon name="alt-arrow-right-linear" size={14} color="#187d57" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
        {types.map((type) => (
          <Pressable key={type.id} onPress={onManage} accessibilityRole="button" className="w-40 rounded-2xl border border-forest-100 bg-white p-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: type.bg }}>
              <Icon name={type.icon} size={24} color={type.color} />
            </View>
            <Text className="mt-3 text-forest-900 text-[14px] font-semibold" numberOfLines={1}>
              {type.name}
            </Text>
            <Text className="text-forest-600 text-[12px] font-bold">{formatRupiah(type.price)}</Text>
          </Pressable>
        ))}
        {types.length === 0 && (
          <Pressable onPress={onManage} className="w-full rounded-2xl border border-dashed border-forest-200 p-4">
            <Text className="text-center text-forest-700 text-[14px]">
              {t("home.noTypes")} <Text className="font-bold">{t("home.addNow")}</Text>
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
