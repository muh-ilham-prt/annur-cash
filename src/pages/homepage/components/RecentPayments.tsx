import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "../../../components/Icon";
import { useI18n } from "../../../helpers/i18n";
import { formatRupiah } from "../../../helpers/money";

export type PaymentStatus = "full" | "part" | "credit";

export interface PaymentItem {
  id: string;
  student: string;
  cls: string;
  type: string;
  paid: number;
  price: number;
  when: string;
}

const FILTERS: (PaymentStatus | "all" | "due")[] = ["all", "full", "part", "credit", "due"];

const STATUS: Record<PaymentStatus, { bg: string; text: string; icon: "check-circle-bold" | "pie-chart-2-bold" | "clock-circle-bold" }> = {
  full: { bg: "#d8f3e3", text: "#12503a", icon: "check-circle-bold" },
  part: { bg: "#e0f2fe", text: "#075985", icon: "pie-chart-2-bold" },
  credit: { bg: "#f8e4a8", text: "#c27f17", icon: "clock-circle-bold" },
};

const statusOf = (p: PaymentItem): PaymentStatus => (p.price > 0 && p.paid >= p.price ? "full" : p.paid > 0 ? "part" : "credit");
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export function RecentPayments({ payments, onPressItem }: { payments: PaymentItem[]; onPressItem?: (p: PaymentItem) => void }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const visible = payments.filter((p) => {
    if (filter === "all") return true;
    if (filter === "due") return p.price > p.paid;
    return statusOf(p) === filter;
  });

  return (
    <View className="mt-6 px-5">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-forest-900 text-[14px] font-bold">{t("home.recent")}</Text>
        <Text className="text-forest-600 text-[12px] font-semibold">
          {visible.length} {t("home.records")}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
        {FILTERS.map((key) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`rounded-full px-4 py-1.5 border ${active ? "bg-forest-800 border-forest-800" : "bg-white border-forest-200"}`}
            >
              <Text className={`text-[12px] font-semibold ${active ? "text-white" : "text-forest-800"}`}>
                {t(`home.filter.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="gap-3">
        {visible.map((payment) => {
          const status = statusOf(payment);
          const meta = STATUS[status];
          const rest = Math.max(payment.price - payment.paid, 0);
          return (
            <Pressable
              key={payment.id}
              onPress={() => onPressItem?.(payment)}
              accessibilityRole="button"
              accessibilityLabel={`${payment.student}, ${payment.type}`}
              className="flex-row items-center gap-3 rounded-2xl bg-white p-3.5 border border-forest-100"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-forest-100">
                <Text className="text-forest-800 text-[14px] font-bold">{initials(payment.student)}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-forest-900 text-[14px] font-semibold" numberOfLines={1}>
                    {payment.student}
                  </Text>
                  <Text className="text-forest-900 text-[14px] font-extrabold">{formatRupiah(payment.paid)}</Text>
                </View>
                <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                  {t("home.class")} {payment.cls} · {payment.type} · {t("home.bill")} {formatRupiah(payment.price)}
                </Text>
                <View className="mt-1.5 flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: meta.bg }}>
                    <Icon name={meta.icon} size={12} color={meta.text} />
                    <Text className="text-[10px] font-bold" style={{ color: meta.text }}>
                      {t(`home.status.${status}`)}
                    </Text>
                  </View>
                  <Text className={`text-[10px] ${rest ? "font-semibold text-gold-600" : "text-slate-400"}`}>
                    {rest ? `${t("home.remaining")} ${formatRupiah(rest)}` : payment.when}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        {visible.length === 0 && (
          <View className="items-center rounded-2xl border border-dashed border-forest-200 p-8">
            <Icon name="inbox-line-bold-duotone" size={36} color="#80d1ad" />
            <Text className="mt-2 text-slate-400 text-[14px]">{t("home.empty")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
