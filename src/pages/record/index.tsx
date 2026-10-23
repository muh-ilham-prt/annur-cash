import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MasjidPattern } from "../../components/MasjidPattern";
import { Icon } from "../../components/Icon";
import { Toast } from "../../components/Toast";
import { StudentSheet } from "../students/components/StudentSheet";
import { TypeSheet } from "../payment-types/TypeSheet";
import { TENANTS, TENANT } from "../../theme/tenant";
import { useI18n } from "../../helpers/i18n";
import { formatRupiah } from "../../helpers/money";
import { usePaymentStore, type Payment, type Student } from "../../helpers/db";
import { PaySheet } from "./components/PaySheet";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function RecordPage() {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { students, types, payments, loaded, update, updateStudents } = usePaymentStore();
  const [paying, setPaying] = useState<{ studentId?: string } | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const recent = useMemo(
    () => [...payments].sort((a, b) => (b.when ?? "").localeCompare(a.when ?? "")).slice(0, 8),
    [payments],
  );

  const saveStudent = async (next: Student) => {
    await updateStudents([...students, next]);
    // Continue straight into the payment the operator came here to record.
    setPaying({ studentId: next.id });
  };

  const bill = (payment: Payment) => {
    const rest = Math.max(payment.price - payment.paid, 0);
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
        <Text className="text-white text-[20px] font-bold leading-tight">{t("record.title")}</Text>
        <Text className="text-white/70 text-[12px]">{t("record.sub")}</Text>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View className="mt-4 gap-3 px-5">
          <Pressable
            onPress={() => setPaying({})}
            accessibilityRole="button"
            accessibilityLabel={t("record.catat")}
            className="flex-row items-center gap-3 rounded-2xl p-4"
            style={{ backgroundColor: theme.brand900 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Icon name="hand-money-bold-duotone" size={28} color="#fff" />
            </View>
            <Text className="flex-1 text-white text-[15px] font-bold">{t("record.title")}</Text>
            <Icon name="alt-arrow-right-linear" size={20} color="#ffffffb3" />
          </Pressable>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-forest-900 text-[14px] font-bold">{t("record.recent")}</Text>
          <View className="gap-2">
            {recent.map((payment) => {
              const status = bill(payment);
              const rest = Math.max(payment.price - payment.paid, 0);
              return (
                <View key={payment.id} className="flex-row items-center gap-3 rounded-2xl bg-white p-3.5 border border-forest-100">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-forest-100">
                    <Text className="text-forest-800 text-[14px] font-bold">{initials(payment.student ?? "—")}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-forest-900 text-[14px] font-bold" numberOfLines={1}>
                      {payment.student ?? "—"}
                    </Text>
                    <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                      {t("students.classChip", { cls: payment.cls || "-" })} · {types.find((type) => type.id === payment.typeId)?.name ?? "—"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-forest-900 text-[13px] font-bold">{formatRupiah(payment.paid)}</Text>
                    <View className={`mt-0.5 rounded-full px-2 py-0.5 ${status === "full" ? "bg-forest-100" : status === "part" ? "bg-sky-100" : "bg-gold-200"}`}>
                      <Text className={`text-[10px] font-bold ${status === "full" ? "text-forest-800" : status === "part" ? "text-sky-800" : "text-gold-600"}`}>
                        {t(`record.status.${status}`)}
                        {rest ? ` · ${formatRupiah(rest)}` : payment.credit ? ` · ${t("record.deposit")} ${formatRupiah(payment.credit)}` : ""}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {loaded && recent.length === 0 && (
              <View className="rounded-2xl border border-dashed border-forest-200 p-6 items-center">
                <Icon name="wallet-money-bold-duotone" size={32} color="#80d1ad" />
                <Text className="mt-2 text-[13px] text-slate-500">{t("record.recentNone")}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {paying && (
        <PaySheet
          theme={theme}
          students={students}
          types={types}
          payments={payments}
          studentId={paying.studentId}
          onClose={() => setPaying(null)}
          onDone={(message) => setToast(message)}
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
            await update([...types, next]);
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
