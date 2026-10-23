import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import type { DeepId } from "../../components/BottomNav";
import { toneOf, usePaymentStore } from "../../helpers/db";
import { HomeHeader } from "./components/HomeHeader";
import { SummaryStats } from "./components/SummaryStats";
import { OutstandingBanner } from "./components/OutstandingBanner";
import { QUICK_ACTIONS, QuickActions } from "./components/QuickActions";
import { PaymentTypesRail } from "./components/PaymentTypesRail";
import { RecentPayments, type PaymentItem } from "./components/RecentPayments";


interface HomePageProps {
  onPressNav?: (id: DeepId) => void;
}

export default function HomePage({ onPressNav }: HomePageProps) {
  const { types, payments } = usePaymentStore();
  // Shared store keeps this in sync while mounted; archived types are hidden from the rail.
  const railTypes = useMemo(
    () => types.filter((type) => !type.archived).map((type) => ({ ...type, ...toneOf(type.icon) })),
    [types],
  );
  const summary = useMemo(() => {
    const collected = payments.reduce((sum, p) => sum + p.paid + (p.credit ?? 0), 0);
    const outstanding = payments.reduce((sum, p) => sum + Math.max(p.price - p.paid, 0), 0);
    const stats = { full: 0, part: 0, credit: 0 };
    for (const p of payments) stats[p.price > 0 && p.paid >= p.price ? "full" : p.paid > 0 ? "part" : "credit"] += 1;
    return { collected, outstanding, stats };
  }, [payments]);
  const recent = useMemo<PaymentItem[]>(
    () =>
      payments.map((p) => ({
        id: p.id,
        student: p.student ?? "—",
        cls: p.cls ?? "-",
        type: types.find((type) => type.id === p.typeId)?.name ?? "—",
        paid: p.paid,
        price: p.price,
        when: p.when ?? "",
      })),
    [payments, types],
  );

  return (
    <View className="flex-1 bg-cream">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 112 }} showsVerticalScrollIndicator={false}>
        <HomeHeader collected={summary.collected} today={0} hasDue={summary.outstanding > 0} />
        <SummaryStats stats={summary.stats} />
        <OutstandingBanner amount={summary.outstanding} onPress={() => onPressNav?.("Report")} />
        <QuickActions
          onAction={(id) => {
            const nav = QUICK_ACTIONS.find((action) => action.id === id)?.nav;
            if (nav) onPressNav?.(nav);
          }}
        />
        <PaymentTypesRail types={railTypes} onManage={() => onPressNav?.("Types")} />
        <RecentPayments payments={recent} />
      </ScrollView>
    </View>
  );
}
