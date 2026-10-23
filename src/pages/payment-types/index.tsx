import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { MasjidPattern } from "../../components/MasjidPattern";
import { Toast } from "../../components/Toast";
import { TENANTS, TENANT } from "../../theme/tenant";
import { useI18n } from "../../helpers/i18n";
import { formatRupiah } from "../../helpers/money";
import { toneOf, typeStats, usePaymentStore, type PaymentType } from "../../helpers/db";
import type { MainTabParamList } from "../../router";
import { TypeSheet } from "./TypeSheet";

export default function PaymentTypesPage() {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { types, payments, loaded, update } = usePaymentStore();
  const [editing, setEditing] = useState<PaymentType | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const active = types.filter((type) => !type.archived);
  const archived = types.filter((type) => type.archived);
  const collected = payments.reduce((sum, payment) => sum + payment.paid + (payment.credit ?? 0), 0);

  const save = async (next: PaymentType) => {
    const exists = types.some((type) => type.id === next.id);
    await update(exists ? types.map((type) => (type.id === next.id ? next : type)) : [...types, next]);
    setToast(t(exists ? "paymentTypes.saved" : "paymentTypes.added"));
  };

  const toggleArchive = async (type: PaymentType) => {
    await update(types.map((item) => (item.id === type.id ? { ...item, archived: !item.archived } : item)));
    setToast(t(type.archived ? "paymentTypes.restored" : "paymentTypes.archived"));
  };

  const remove = async (type: PaymentType) => {
    await update(types.filter((item) => item.id !== type.id));
    setToast(t("paymentTypes.deleted"));
  };

  const card = (type: PaymentType) => {
    const tone = toneOf(type.icon);
    const stat = typeStats(type, payments);
    return (
      <View key={type.id} className="rounded-2xl bg-white p-4 border border-forest-100" style={{ opacity: type.archived ? 0.75 : 1 }}>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.bg }}>
            <Icon name={type.icon} size={26} color={tone.color} />
          </View>
          <View className="flex-1">
            <Text className="text-forest-900 text-[15px] font-bold" numberOfLines={1}>
              {type.name}
            </Text>
            <Text className="text-forest-700 text-[13px] font-extrabold">{formatRupiah(type.price)}</Text>
          </View>
          <Pressable
            onPress={() => setEditing(type)}
            accessibilityRole="button"
            accessibilityLabel={t("paymentTypes.editName", { name: type.name })}
            className="h-10 w-10 items-center justify-center rounded-xl bg-forest-50"
          >
            <Icon name="pen-linear" size={20} color="#136447" />
          </Pressable>
        </View>
        <View className="mt-3 flex-row border-t border-forest-100 pt-3">
          <View className="flex-1 items-center">
            <Text className="text-[10px] text-slate-500">{t("paymentTypes.transactions")}</Text>
            <Text className="mt-0.5 text-[13px] font-bold text-forest-900">{stat.n}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-[10px] text-slate-500">{t("paymentTypes.collected")}</Text>
            <Text className="mt-0.5 text-[13px] font-bold text-forest-800">{formatRupiah(stat.got)}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-[10px] text-slate-500">{t("paymentTypes.remaining")}</Text>
            <Text className="mt-0.5 text-[13px] font-bold" style={{ color: stat.due ? "#c27f17" : "#94a3b8" }}>
              {formatRupiah(stat.due)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <LinearGradient
        colors={[theme.brand700, theme.brand950]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" }}
      >
        <MasjidPattern />
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t("paymentTypes.backHome")}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-forest-800"
          >
            <Icon name="alt-arrow-left-linear" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-[20px] font-bold leading-tight">{t("paymentTypes.typesTitle")}</Text>
            <Text className="text-white/70 text-[12px]">{t("paymentTypes.typesSub")}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* In flow, not lifted: a negative margin let the header paint over the tiles and the bar jog the scroll. */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View className="mt-4 flex-row gap-3 px-5">
          <View className="flex-1 rounded-2xl bg-white p-3.5 border border-forest-100">
            <Text className="text-[11px] text-slate-500">{t("paymentTypes.activeTypes")}</Text>
            <Text className="mt-1 text-forest-900 text-[22px] font-extrabold">{active.length}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white p-3.5 border border-forest-100">
            <Text className="text-[11px] text-slate-500">{t("paymentTypes.totalCollected")}</Text>
            <Text className="mt-1 text-forest-900 text-[18px] font-extrabold" numberOfLines={1} adjustsFontSizeToFit>
              {formatRupiah(collected)}
            </Text>
          </View>
        </View>

        <View className="mt-5 gap-3 px-5">
          {active.map(card)}
          {loaded && active.length === 0 && (
            <View className="rounded-2xl border border-dashed border-forest-200 p-8 items-center">
              <Icon name="tag-price-bold" size={36} color="#80d1ad" />
              <Text className="mt-2 text-forest-900 text-[14px] font-semibold">{t("paymentTypes.empty")}</Text>
              <Text className="mt-1 text-[13px] text-slate-500 text-center">{t("paymentTypes.emptyHint")}</Text>
            </View>
          )}
        </View>

        {archived.length > 0 && (
          <View className="mt-6 px-5">
            <Text className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-500">{t("paymentTypes.archivedSection")}</Text>
            <View className="gap-3">{archived.map(card)}</View>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setEditing("new")}
        accessibilityRole="button"
        accessibilityLabel={t("paymentTypes.add")}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full"
        style={{ bottom: 104, backgroundColor: theme.brand900, shadowColor: "#07271d", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
      >
        <Icon name="add-circle-bold" size={28} color="#fff" />
      </Pressable>

      {editing && (
        <TypeSheet
          theme={theme}
          value={editing === "new" ? null : editing}
          existing={types}
          used={editing === "new" ? 0 : typeStats(editing, payments).n}
          onClose={() => setEditing(null)}
          onSave={save}
          onToggleArchive={toggleArchive}
          onDelete={remove}
        />
      )}
      <Toast theme={theme} message={toast} onHide={() => setToast(null)} />
    </View>
  );
}
