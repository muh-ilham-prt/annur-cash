import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MasjidPattern } from "../../components/MasjidPattern";
import { Icon } from "../../components/Icon";
import { Toast } from "../../components/Toast";
import { StudentSheet } from "../students/components/StudentSheet";
import { TypeSheet } from "../payment-types/TypeSheet";
import { TENANTS, TENANT } from "../../theme/tenant";
import { formatRupiah } from "../../helpers/money";
import { type Payment, type PaymentType, type Student } from "../../helpers/domain";
import { fetchStudents, createStudent } from "../../helpers/students";
import { fetchTypes, createType } from "../../helpers/paymentTypes";
import { PaySheet } from "./components/PaySheet";
import { fetchRecentPayments } from "../../helpers/reports";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function RecordPage() {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<Student[]>([]);
  const [types, setTypes] = useState<PaymentType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [paying, setPaying] = useState<{ studentId?: string } | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [detail, setDetail] = useState<Payment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [remotePayments, setRemotePayments] = useState<Payment[] | null>(null);

  const loadRemote = async () => {
    try {
      const [nextStudents, nextTypes, nextPayments] = await Promise.all([fetchStudents(), fetchTypes(), fetchRecentPayments()]);
      setStudents(nextStudents);
      setTypes(nextTypes);
      setPayments(nextPayments);
      setRemotePayments(nextPayments);
      setLoaded(true);
    } catch {
      setRemotePayments(null);
    }
  };

  useEffect(() => {
    void loadRemote();
  }, []);
  useFocusEffect(useCallback(() => {
    void loadRemote();
  }, []));

  const refresh = async () => {
    setRefreshing(true);
    await loadRemote();
    setRefreshing(false);
  };

  const recent = useMemo(
    () => [...(remotePayments ?? payments)].sort((a, b) => (b.when ?? "").localeCompare(a.when ?? "")).slice(0, 8),
    [payments, remotePayments],
  );

  const saveStudent = async (next: Student) => {
    const saved = await createStudent(next);
    setStudents((current) => [...current, saved]);
    // Continue straight into the payment the operator came here to record.
    setPaying({ studentId: next.id });
  };

  const bill = (payment: Payment) => {
    return payment.price > 0 && payment.paid >= payment.price ? "full" : payment.paid > 0 ? "part" : "credit";
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
        <Text className="text-white text-[20px] font-bold leading-tight">Catat pembayaran</Text>
        <Text className="text-white/70 text-[12px]">Catat dan pantau pembayaran siswa</Text>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.brand700} colors={[theme.brand700]} />}>
        <View className="mt-4 gap-3 px-5">
          <Pressable
            onPress={() => setPaying({})}
            accessibilityRole="button"
            accessibilityLabel="Catat pembayaran"
            className="flex-row items-center gap-3 rounded-2xl p-4"
            style={{ backgroundColor: theme.brand900 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Icon name="hand-money-bold-duotone" size={28} color="#fff" />
            </View>
            <Text className="flex-1 text-white text-[15px] font-bold">Catat pembayaran</Text>
            <Icon name="alt-arrow-right-linear" size={20} color="#ffffffb3" />
          </Pressable>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-forest-900 text-[14px] font-bold">Pembayaran terbaru</Text>
          <View className="gap-2">
            {recent.map((payment) => {
              const status = bill(payment);
              const rest = Math.max(payment.price - payment.paid, 0);
              return (
                <Pressable key={payment.id} onPress={() => setDetail(payment)} className="flex-row items-center gap-3 rounded-2xl bg-white p-3.5 border border-forest-100">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-forest-100">
                    <Text className="text-forest-800 text-[14px] font-bold">{initials(payment.student ?? "—")}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-forest-900 text-[14px] font-bold" numberOfLines={1}>
                      {payment.student ?? "—"}
                    </Text>
                    <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                      Kelas {payment.cls || "-"} · {types.find((type) => type.id === payment.typeId)?.name ?? "—"}
                    </Text>
                    <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                      <Text className="text-[11px] text-red-600">Tarif {formatRupiah(payment.price)}</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-forest-900 text-[13px] font-bold">{formatRupiah(payment.paid)}</Text>
                    <View className={`mt-0.5 rounded-full px-2 py-0.5 ${status === "full" ? "bg-forest-100" : status === "part" ? "bg-sky-100" : "bg-gold-200"}`}>
                      <Text className={`text-[10px] font-bold ${status === "full" ? "text-forest-800" : status === "part" ? "text-sky-800" : "text-gold-600"}`}>
                        {status === "full" ? "Lunas" : status === "part" ? "Sebagian" : "Kredit"}
                        {rest ? ` · Sisa ${formatRupiah(rest)}` : payment.credit ? ` · Deposit ${formatRupiah(payment.credit)}` : ""}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {loaded && recent.length === 0 && (
              <View className="rounded-2xl border border-dashed border-forest-200 p-6 items-center">
                <Icon name="wallet-money-bold-duotone" size={32} color="#80d1ad" />
                <Text className="mt-2 text-[13px] text-slate-500">Belum ada pembayaran</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {detail && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setDetail(null)}>
          <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(7,39,29,0.45)" }}>
            <View className="rounded-t-[28px] bg-cream p-6" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
              <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest-200" />
              <View className="flex-row items-center gap-3"><Text className="flex-1 text-xl font-bold text-forest-900">Detail pembayaran</Text><Pressable onPress={() => setDetail(null)}><Icon name="close-linear" size={20} color="#136447" /></Pressable></View>
              <Text className="mt-4 text-lg font-bold text-forest-900">{detail.student ?? "—"}</Text>
              <Text className="text-[12px] text-slate-500">{types.find((type) => type.id === detail.typeId)?.name ?? "—"} · {formatRupiah(detail.paid)}</Text>
              {detail.evidence ? <Image source={{ uri: detail.evidence }} className="mt-4 h-64 w-full rounded-2xl" resizeMode="contain" /> : <Text className="mt-6 py-8 text-center text-[13px] text-slate-500">Bukti pembayaran belum tersedia.</Text>}
            </View>
          </View>
        </Modal>
      )}

      {paying && (
        <PaySheet
          theme={theme}
          students={students}
          types={types}
          payments={payments}
          remotePayments={remotePayments ?? undefined}
          studentId={paying.studentId}
          onClose={() => {
            setPaying(null);
            void loadRemote();
          }}
          onDone={(message) => {
            setToast(message);
            void loadRemote();
          }}
          onAddStudent={() => {
            setPaying(null);
            setAddingStudent(true);
          }}
          onAddType={() => {
            setPaying(null);
            setAddingType(true);
          }}
        />
      )}
      {/* No type existed: one sheet entry, then straight back into the payment sheet. */}
      {addingType && students.length > 0 && (
        <TypeSheet
          theme={theme}
          value={null}
          existing={types}
          onClose={() => setAddingType(false)}
          onSave={async (next) => {
            const saved = await createType(next);
            setTypes((current) => [...current, saved]);
            setPaying({});
          }}
        />
      )}
      {addingStudent && (
        <StudentSheet
          theme={theme}
          value={null}
          existing={students}
          onClose={() => setAddingStudent(false)}
          onSave={saveStudent}
        />
      )}
      <Toast theme={theme} message={toast} onHide={() => setToast(null)} />
    </View>
  );
}
