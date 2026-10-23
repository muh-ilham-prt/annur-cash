import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../../components/Icon";
import { useI18n } from "../../../helpers/i18n";
import { depositOf, recordPayment, type Payment, type PaymentType, type Student } from "../../../helpers/db";
import { formatRupiah } from "../../../helpers/money";
import type { TenantTheme } from "../../../theme/tenant";

interface PaySheetProps {
  theme: TenantTheme;
  students: Student[];
  types: PaymentType[];
  payments: Payment[];
  /** Murid to pre-select (from a detail screen). */
  studentId?: string;
  onClose: () => void;
  onDone: (message: string) => void;
  onAddStudent: () => void;
  onAddType: () => void;
}

const digits = (text: string) => text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
// Grouped while typing so a six-digit amount is readable at a glance.
const group = (text: string) => digits(text).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function PaySheet({ theme, students, types, payments, studentId, onClose, onDone, onAddStudent, onAddType }: PaySheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const active = types.filter((type) => !type.archived);
  const [pickedStudent, setPickedStudent] = useState(studentId ?? "");
  const [pickedType, setPickedType] = useState(active[0]?.id ?? "");
  const [useDeposit, setUseDeposit] = useState(false);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const student = students.find((s) => s.id === pickedStudent) ?? null;
  const type = active.find((x) => x.id === pickedType) ?? null;
  // Same murid + type with a bill still open: the payment goes onto that bill.
  const openBill =
    student && type
      ? payments
          .filter((p) => p.studentId === student.id && p.typeId === type.id && p.price > p.paid)
          .sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""))[0] ?? null
      : null;
  const price = openBill ? openBill.price : (type?.price ?? 0);
  const paidBefore = openBill?.paid ?? 0;
  const due = price - paidBefore;
  const amt = Number(digits(amount)) || 0;
  const deposit = student ? depositOf(student.id, payments) : 0;
  // Offered up to what this murid still owes, not just this bill: the rest goes to other bills.
  const owed =
    student && type
      ? payments
          .filter((p) => p.studentId === student.id && p.price > p.paid)
          .reduce((sum, p) => sum + p.price - p.paid, 0) + (openBill ? 0 : Math.max(type.price, 0))
      : 0;
  const offer = Math.min(deposit, owed);
  // Spending the deposit counts as money in, so a bill can close without cash.
  const dep = useDeposit ? Math.min(deposit, due) : 0;
  const after = paidBefore + amt + dep;
  const over = Math.max(after - price, 0);
  const status = !type ? null : price > 0 && after >= price ? "full" : after > 0 ? "part" : "credit";

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      [...students]
        .filter((s) => !q || `${s.name} ${s.cls}`.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name, "id")),
    [students, q],
  );

  const submit = async () => {
    const bad = !student ? t("record.errStudent") : !type ? t("record.errType") : !amount.trim() && !useDeposit ? t("record.errAmount") : "";
    setError(bad);
    if (bad || !student || !type) return;
    setSaving(true);
    try {
      const bill = await recordPayment({ student, type, amount: amt, useDeposit });
      const name = student.name;
      // No toast for the 0/0 case: the bill itself already shows as credit.
      if (bill.rest === 0 && price === 0) onClose();
      else
      onDone(
        over > 0
          ? t("record.toast.over", { name, deposit: formatRupiah(bill.deposit) })
          : amt === 0 && dep > 0
            ? t("record.toast.deposit", { name })
            : t(
                amt === 0 ? "record.toast.credit" : bill.rest === 0 ? "record.toast.full" : "record.toast.part",
                { name, due: formatRupiah(bill.rest) },
              ),
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("record.errAmount"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end" style={{ backgroundColor: "rgba(7,39,29,0.45)" }}>
        <View className="bg-cream rounded-t-[28px]" style={{ flexShrink: 1, paddingBottom: Math.max(insets.bottom, 16) }}>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }} keyboardShouldPersistTaps="handled">
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest-200" />
            <View className="flex-row items-center gap-4">
              <Text className="flex-1 text-forest-900 text-xl font-bold">{t("record.title")}</Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("paymentTypes.close")}
                hitSlop={12}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#136447] border border-forest-100"
              >
                <Icon name="close-linear" size={15} color="#ffffff" />
              </Pressable>
            </View>

            {students.length === 0 || active.length === 0 ? (
              <View className="mt-5 items-center rounded-2xl border border-dashed border-forest-200 p-6">
                <Icon name={students.length === 0 ? "users-group-rounded-bold" : "tag-price-bold"} size={32} color="#80d1ad" />
                <Text className="mt-2 text-center text-[13px] text-slate-500">
                  {students.length === 0 ? t("record.studentsNone") : t("record.typesNone")}
                </Text>
                <Pressable
                  onPress={students.length === 0 ? onAddStudent : onAddType}
                  accessibilityRole="button"
                  className="mt-3 rounded-2xl px-4 py-2.5"
                  style={{ backgroundColor: theme.brand900 }}
                >
                  <Text className="text-[13px] font-bold text-white">{students.length === 0 ? t("record.studentsAdd") : t("record.typesAdd")}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="mt-4 text-xs font-bold text-forest-900">{t("record.students")}</Text>
                {student ? (
                  <View className="mt-1 flex-row items-center gap-3 rounded-xl border border-forest-200 bg-white px-3.5 py-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-forest-100">
                      <Text className="text-[12px] font-bold text-forest-800">
                        {student.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14px] font-bold text-forest-900">{student.name}</Text>
                      <Text className="text-[11px] text-slate-500">
                        {t("students.classChip", { cls: student.cls })} · {t("record.deposit")} {formatRupiah(deposit)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setPickedStudent("");
                        setQuery("");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t("record.change")}
                      className="rounded-full bg-forest-50 px-3 py-1"
                    >
                      <Text className="text-[11px] font-bold text-forest-700">{t("record.change")}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View className="mt-1 flex-row items-center gap-2 rounded-xl bg-white border border-forest-200 px-3">
                      <Icon name="magnifier-linear" size={16} color="#94a3b8" />
                      <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t("record.nameOrClass")}
                        placeholderTextColor="#94a3b8"
                        accessibilityLabel={t("record.nameOrClass")}
                        autoCorrect={false}
                        className="h-11 flex-1 text-[14px] text-forest-900"
                      />
                    </View>
                    <View className="mt-2 gap-1.5" style={{ maxHeight: 208 }}>
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {list.map((s) => (
                          <Pressable
                            key={s.id}
                            onPress={() => setPickedStudent(s.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`${s.name} ${s.cls}`}
                            className="mb-1.5 flex-row items-center justify-between rounded-xl bg-white px-3.5 py-2.5 border border-forest-100"
                          >
                            <Text className="text-[13px] font-semibold text-forest-900">{s.name}</Text>
                            <Text className="text-[11px] text-slate-500">{s.cls}</Text>
                          </Pressable>
                        ))}
                        {list.length === 0 && <Text className="py-2 text-center text-[12px] text-slate-500">{t("record.noMatch")}</Text>}
                      </ScrollView>
                    </View>
                  </>
                )}

                <Text className="mt-4 text-xs font-bold text-forest-900">{t("paymentTypes.typesTitle")}</Text>
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {active.map((item) => {
                    const on = item.id === pickedType;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setPickedType(item.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${item.name} ${formatRupiah(item.price)}`}
                        className={`rounded-full px-3 py-1.5 border ${on ? "bg-forest-800 border-forest-800" : "bg-white border-forest-200"}`}
                      >
                        <Text className={`text-[12px] font-semibold ${on ? "text-white" : "text-forest-800"}`}>
                          {item.name} · {formatRupiah(item.price)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {openBill && (
                  <Text className="mt-2 rounded-xl bg-gold-200/60 p-3 text-[11px] text-forest-950">
                    {t("record.openBill", { paid: formatRupiah(paidBefore), due: formatRupiah(due) })}
                  </Text>
                )}

                <Text className="mt-4 text-xs font-bold text-forest-900">{t("record.amount")}</Text>
                <View className="mt-1 flex-row items-center rounded-xl border border-forest-200 bg-white pl-3.5 pr-3">
                  <Text className="text-[14px] font-bold text-slate-400">Rp</Text>
                  <TextInput
                    value={group(amount)}
                    onChangeText={(text) => {
                      setAmount(digits(text));
                      setError("");
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    accessibilityLabel={t("record.amount")}
                    className="h-11 flex-1 px-2 text-[15px] text-forest-900"
                  />
                  <Pressable onPress={() => setAmount(String(due))} accessibilityRole="button" accessibilityLabel={t("record.payFull")} className="rounded-full bg-forest-50 px-3 py-1">
                    <Text className="text-[11px] font-bold text-forest-800">{t("record.payFull")}</Text>
                  </Pressable>
                </View>
                <Text className="mt-1 text-[11px] text-slate-500">{t("record.amountHint")}</Text>
                {offer > 0 && (
                  <Pressable
                    onPress={() => setUseDeposit((on) => !on)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: useDeposit }}
                    accessibilityLabel={t("record.useDeposit", { amount: formatRupiah(offer) })}
                    className={`mt-2 flex-row items-center gap-2 rounded-xl border px-3 py-2 ${useDeposit ? "border-forest-800 bg-forest-100" : "border-forest-200 bg-white"}`}
                  >
                    <Icon name="wallet-money-bold-duotone" size={16} color={useDeposit ? "#136447" : "#94a3b8"} />
                    <Text className={`flex-1 text-[12px] font-semibold ${useDeposit ? "text-forest-900" : "text-slate-600"}`}>
                      {t("record.useDeposit", { amount: formatRupiah(offer) })}
                    </Text>
                    {useDeposit && dep < offer && <Text className="text-[10px] text-slate-500">{formatRupiah(offer - dep)}</Text>}
                    {useDeposit && <Icon name="check-circle-bold" size={14} color="#136447" />}
                  </Pressable>
                )}

                <View className="mt-4 rounded-2xl bg-white p-4 border border-forest-100">
                  <View className="flex-row justify-between">
                    <Text className="text-[13px] text-slate-500">{openBill ? t("paymentTypes.remaining") : t("record.bill")}</Text>
                    <Text className="text-[13px] font-bold text-forest-900">{formatRupiah(due)}</Text>
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <Text className="text-[13px] text-slate-500">{t("record.amount")}</Text>
                    <Text className="text-[13px] font-bold text-forest-800">{formatRupiah(amt + dep)}</Text>
                  </View>
                  {over > 0 && (
                    <View className="mt-1 flex-row justify-between">
                      <Text className="text-[13px] text-slate-500">{t("record.depositAdd")}</Text>
                      <Text className="text-[13px] font-bold text-gold-600">+{formatRupiah(over)}</Text>
                    </View>
                  )}
                  <View className="mt-1 flex-row items-center justify-between border-t border-forest-100 pt-2">
                    <Text className="text-[13px] text-slate-500">{t("paymentTypes.remaining")}</Text>
                    <View className="flex-row items-center gap-2">
                      {status && (
                        <View className={`rounded-full px-2 py-0.5 ${status === "full" ? "bg-forest-100" : status === "part" ? "bg-sky-100" : "bg-gold-200"}`}>
                          <Text className={`text-[10px] font-bold ${status === "full" ? "text-forest-800" : status === "part" ? "text-sky-800" : "text-gold-600"}`}>
                            {t(`record.status.${status}`)}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[13px] font-bold text-gold-600">{formatRupiah(Math.max(due - amt - dep, 0))}</Text>
                    </View>
                  </View>
                </View>

                <Text className="mt-3 text-[10px] text-slate-400">{t("record.noProof")}</Text>
                {error !== "" && <Text className="mt-2 text-xs font-semibold text-danger">{error}</Text>}
                <Pressable
                  onPress={() => void submit()}
                  disabled={saving}
                  accessibilityRole="button"
                  className="mt-4 w-full items-center rounded-2xl py-3.5"
                  style={{ backgroundColor: theme.brand900, opacity: saving ? 0.6 : 1 }}
                >
                  <Text className="text-sm font-bold text-white">{saving ? t("common.loading") : t("record.save")}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
