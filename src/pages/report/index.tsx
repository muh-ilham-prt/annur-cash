import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { MasjidPattern } from "../../components/MasjidPattern";
import { TENANTS, TENANT } from "../../theme/tenant";
import { formatRupiah } from "../../helpers/money";
import { type Payment, type PaymentType, type Student } from "../../helpers/domain";
import { fetchRecentPayments } from "../../helpers/reports";
import { fetchTypes } from "../../helpers/paymentTypes";
import { fetchStudents } from "../../helpers/students";
import type { MainTabParamList } from "../../router";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export default function ReportPage() {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [types, setTypes] = useState<PaymentType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    const [nextTypes, nextPayments, nextStudents] = await Promise.all([fetchTypes(), fetchRecentPayments(), fetchStudents()]);
    setTypes(nextTypes);
    setPayments(nextPayments);
    setStudents(nextStudents);
  };
  useEffect(() => {
    void load();
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
  }, []));
  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };
  const activeStudents = students.filter((student) => student.status !== "candidate");
  const summary = useMemo(() => {
    const paid = payments.reduce((n, p) => n + p.paid, 0);
    const due = types.reduce((n, type) => n + Math.max(type.price * activeStudents.length - payments.filter((p) => p.typeId === type.id).reduce((sum, p) => sum + p.paid, 0), 0), 0);
    const credit = payments.reduce((n, p) => n + (p.credit ?? 0), 0);
    return { paid, due, credit, transactions: payments.length };
  }, [payments, types, activeStudents.length]);
  const stats = useMemo(() => types.map((type) => {
    const got = payments.filter((payment) => payment.typeId === type.id).reduce((sum, payment) => sum + payment.paid, 0);
    return { type, got, due: Math.max(type.price * activeStudents.length - got, 0) };
  }).sort((a, b) => b.got - a.got), [types, payments, activeStudents.length]);
  const max = Math.max(...stats.map((s) => s.got + s.due), 1);

  return (
    <View className="flex-1 bg-cream">
      <LinearGradient colors={[theme.brand700, theme.brand950]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" }}>
        <MasjidPattern />
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.navigate("Home")} accessibilityRole="button" accessibilityLabel="Back" className="h-10 w-10 items-center justify-center rounded-2xl bg-forest-800"><Icon name="alt-arrow-left-linear" size={22} color="#fff" /></Pressable>
          <View className="flex-1"><Text className="text-white text-[20px] font-bold">Laporan</Text><Text className="text-white/70 text-[12px]">Ringkasan kas sekolah</Text></View>
          <Icon name="chart-2-bold" size={28} color="#ecb94a" />
        </View>
      </LinearGradient>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 130 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.brand700} colors={[theme.brand700]} />}>
        <View className="flex-row gap-3">
          <Metric label="Dibayar" value={formatRupiah(summary.paid)} color="text-forest-700" icon="check-circle-bold" />
          <Metric label="Tunggakan" value={formatRupiah(summary.due)} color="text-red-700" icon="clock-circle-bold" />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Metric label="Siswa" value={String(students.length)} color="text-sky-700" icon="users-group-rounded-bold" />
          <Metric label="Transaksi" value={String(summary.transactions)} color="text-violet-700" icon="document-text-bold" />
        </View>
        <View className="mt-5 rounded-2xl border border-forest-100 bg-white p-4">
          <Text className="text-[15px] font-bold text-forest-900">Per jenis pembayaran</Text>
          <Text className="mt-1 text-[12px] text-slate-500">Dibayar dan sisa tagihan</Text>
          {stats.length ? stats.map(({ type, got, due }) => <View key={type.id} className="mt-4"><View className="mb-1 flex-row items-center"><Text className="flex-1 text-[12px] font-semibold text-forest-900" numberOfLines={1}>{type.name}</Text><Text className="text-[11px] text-slate-500">{formatRupiah(got)}</Text></View><View className="h-3 flex-row overflow-hidden rounded-full bg-forest-50"><View style={{ width: `${(got / max) * 100}%`, backgroundColor: theme.brand700 }} /><View style={{ width: `${(due / max) * 100}%`, backgroundColor: "#f3d27a" }} /></View></View>) : <Text className="py-8 text-center text-[13px] text-slate-400">Belum ada data pembayaran</Text>}
          {stats.length > 0 && <View className="mt-5 flex-row gap-4"><Legend color={theme.brand700} label="Dibayar" /><Legend color="#f3d27a" label="Tunggakan" /></View>}
        </View>
        <View className="mt-3 rounded-2xl border border-gold-300 bg-gold-200 p-4"><Text className="text-[12px] font-semibold text-forest-800">Kredit tersimpan</Text><Text className="mt-1 text-[22px] font-extrabold text-forest-950">{formatRupiah(summary.credit)}</Text></View>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, color, icon }: { label: string; value: string; color: string; icon: "check-circle-bold" | "clock-circle-bold" | "users-group-rounded-bold" | "document-text-bold" }) {
  return <View className="flex-1 rounded-2xl border border-forest-100 bg-white p-3.5"><Icon name={icon} size={18} color="#136447" /><Text className="mt-2 text-[11px] text-slate-500">{label}</Text><Text className={`mt-1 text-[16px] font-extrabold ${color}`} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>;
}
function Legend({ color, label }: { color: string; label: string }) { return <View className="flex-row items-center gap-1.5"><View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /><Text className="text-[11px] text-slate-500">{label}</Text></View>; }
