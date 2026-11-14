import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import type { DeepId } from "../../components/BottomNav";
import { toneOf, type Payment, type PaymentType } from "../../helpers/domain";
import { fetchRecentPayments } from "../../helpers/reports";
import { fetchTypes } from "../../helpers/paymentTypes";
import { fetchStudents } from "../../helpers/students";
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
  const [types, setTypes] = useState<PaymentType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [nextTypes, nextPayments, nextStudents] = await Promise.all([fetchTypes(), fetchRecentPayments(), fetchStudents()]);
    setTypes(nextTypes);
    setPayments(nextPayments);
    setStudentCount(nextStudents.filter((student) => student.status !== "candidate").length);
  };

  useEffect(() => {
    void load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };
  // Shared store keeps this in sync while mounted; archived types are hidden from the rail.
  const railTypes = useMemo(
    () => types.filter((type) => !type.archived).map((type) => ({ ...type, ...toneOf(type.icon) })),
    [types],
  );
  const summary = useMemo(() => {
    const collected = payments.reduce((sum, p) => sum + p.paid + (p.credit ?? 0), 0);
    const paidByType = new Map<string, number>();
    for (const payment of payments) paidByType.set(payment.typeId, (paidByType.get(payment.typeId) ?? 0) + payment.paid);
    const outstanding = types.reduce((sum, type) => sum + Math.max(type.price * studentCount - (paidByType.get(type.id) ?? 0), 0), 0);
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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 112 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#136447" colors={["#136447"]} />}>
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
