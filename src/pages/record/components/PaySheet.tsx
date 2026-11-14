import { useMemo, useState } from "react";
import { Image } from "react-native";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../../components/Icon";
import { depositOf, type Payment, type PaymentType, type Student } from "../../../helpers/domain";
import { apiFetch } from "../../../helpers/api";
import { formatRupiah } from "../../../helpers/money";
import type { TenantTheme } from "../../../theme/tenant";

interface PaySheetProps {
  theme: TenantTheme;
  students: Student[];
  types: PaymentType[];
  payments: Payment[];
  remotePayments?: Payment[];
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

export function PaySheet({ theme, students, types, payments, remotePayments, studentId, onClose, onDone, onAddStudent, onAddType }: PaySheetProps) {
  const insets = useSafeAreaInsets();
  const active = types.filter((type) => !type.archived);
  const [pickedStudent, setPickedStudent] = useState(studentId ?? "");
  const [pickedType, setPickedType] = useState(active[0]?.id ?? "");
  const [typePicker, setTypePicker] = useState(false);
  const [typeQuery, setTypeQuery] = useState("");
  const [useDeposit, setUseDeposit] = useState(false);
  const [evidence, setEvidence] = useState<string | null>(null);
  const [step, setStep] = useState<"payment" | "evidence">("payment");
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const student = students.find((s) => s.id === pickedStudent) ?? null;
  const type = active.find((x) => x.id === pickedType) ?? null;
  const billRows = remotePayments ?? payments;
  // Reuse an open bill. A settled type has no remaining bill; new payments become deposit.
  const studentTypeBills = student && type
    ? billRows.filter((p) => p.studentId === student.id && p.typeId === type.id)
    : [];
  const openBill = studentTypeBills
    .filter((p) => (p.billPaid ?? p.paid) < p.price)
    .sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""))[0] ?? null;
  const settledBill = !openBill ? studentTypeBills[0] ?? null : null;
  const price = openBill ? openBill.price : settledBill ? 0 : (type?.price ?? 0);
  const paidBefore = openBill?.billPaid ?? openBill?.paid ?? 0;
  const due = Math.max(price - paidBefore, 0);
  const amt = Number(digits(amount)) || 0;
  const depositRows = remotePayments ?? payments;
  const deposit = student ? depositOf(student.id, depositRows) : 0;
  // Offered up to what this murid still owes, not just this bill: the rest goes to other bills.
  const owed =
    student && type
      ? billRows
          .filter((p) => p.studentId === student.id && (p.billPaid ?? p.paid) < p.price)
          .reduce((sum, p) => sum + p.price - (p.billPaid ?? p.paid), 0) + (openBill ? 0 : Math.max(type.price, 0))
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

  const chooseEvidence = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) {
      const compressed = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 960 } }],
        { compress: 0.45, format: SaveFormat.JPEG, base64: false },
      );
      setEvidence(compressed.uri);
    }
  };

  const next = () => {
    const bad = !student ? "Pilih siswa terlebih dahulu" : !type ? "Pilih jenis pembayaran" : !amount.trim() && !useDeposit ? "Masukkan jumlah pembayaran" : "";
    setError(bad);
    if (!bad) setStep("evidence");
  };

  const submit = async () => {
    const bad = !student ? "Pilih siswa terlebih dahulu" : !type ? "Pilih jenis pembayaran" : !amount.trim() && !useDeposit ? "Masukkan jumlah pembayaran" : !evidence ? "Bukti pembayaran wajib diunggah" : "";
    setError(bad);
    if (bad || !student || !type) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("student_id", student.id);
      form.append("payment_type_id", type.id);
      form.append("amount", String(amt));
      if (useDeposit) form.append("use_deposit", "1");
      if (evidence) {
        const base64 = await FileSystem.readAsStringAsync(evidence, { encoding: FileSystem.EncodingType.Base64 });
        form.append("evidence_base64", base64);
        form.append("evidence_name", "evidence.jpg");
      }
      const response = await apiFetch<{ payment: { paid: number; credit: number }; rest: number; deposit: number }>("/payments", { method: "POST", body: form });
      const bill = {
        paid: response.payment.paid,
        credit: response.payment.credit,
        rest: response.rest,
        deposit: response.deposit,
      };
      const name = student.name;
      // No toast for the 0/0 case: the bill itself already shows as credit.
      if (bill.rest === 0 && price === 0) onClose();
      else
      onDone(
        over > 0
          ? `Pembayaran penuh: ${name} · Deposit ${formatRupiah(bill.deposit)}`
          : amt === 0 && dep > 0
            ? `Dibayar dari deposit: ${name}`
            : `${amt === 0 ? "Kredit tercatat" : bill.rest === 0 ? "Pembayaran lunas" : "Pembayaran sebagian"}: ${name} · Sisa ${formatRupiah(bill.rest)}`,
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Masukkan jumlah pembayaran");
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
              <Text className="flex-1 text-forest-900 text-xl font-bold">{"Catat pembayaran"}</Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={"Tutup"}
                hitSlop={12}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#136447] border border-forest-100"
              >
                <Icon name="close-linear" size={15} color="#ffffff" />
              </Pressable>
            </View>

            {step === "evidence" ? (
              <View className="mt-6">
                <Pressable onPress={() => setStep("payment")} className="mb-4 flex-row items-center gap-2"><Icon name="alt-arrow-left-linear" size={18} color="#136447" /><Text className="font-semibold text-forest-700">{"Kembali"}</Text></Pressable>
                <Text className="text-xl font-bold text-forest-900">{"Bukti pembayaran"}</Text>
                <Text className="mt-1 text-[12px] text-slate-500">{"Ambil atau pilih foto bukti pembayaran"}</Text>
                {evidence && <Image source={{ uri: evidence }} className="mt-4 h-48 w-full rounded-2xl" resizeMode="cover" />}
                <View className="mt-4 flex-row gap-2"><Pressable onPress={() => void chooseEvidence(true)} className="flex-1 items-center rounded-2xl bg-forest-900 py-3"><Text className="font-bold text-white">{"Ambil foto"}</Text></Pressable><Pressable onPress={() => void chooseEvidence(false)} className="flex-1 items-center rounded-2xl bg-forest-100 py-3"><Text className="font-bold text-forest-800">{"Pilih dari galeri"}</Text></Pressable></View>
                {error !== "" && <Text className="mt-2 text-xs font-semibold text-danger">{error}</Text>}
                <Pressable onPress={() => void submit()} disabled={saving} className="mt-4 items-center rounded-2xl bg-forest-900 py-3.5"><Text className="font-bold text-white">{saving ? "Menyimpan…" : "Simpan pembayaran"}</Text></Pressable>
              </View>
            ) : students.length === 0 || active.length === 0 ? (
              <View className="mt-5 items-center rounded-2xl border border-dashed border-forest-200 p-6">
                <Icon name={students.length === 0 ? "users-group-rounded-bold" : "tag-price-bold"} size={32} color="#80d1ad" />
                <Text className="mt-2 text-center text-[13px] text-slate-500">
                  {students.length === 0 ? "Belum ada siswa. Tambahkan siswa terlebih dahulu." : "Belum ada jenis pembayaran"}
                </Text>
                <Pressable
                  onPress={students.length === 0 ? onAddStudent : onAddType}
                  accessibilityRole="button"
                  className="mt-3 rounded-2xl px-4 py-2.5"
                  style={{ backgroundColor: theme.brand900 }}
                >
                  <Text className="text-[13px] font-bold text-white">{students.length === 0 ? "Tambah siswa" : "Tambah jenis pembayaran"}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="mt-4 text-xs font-bold text-forest-900">{"Siswa"}</Text>
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
                        {"Kelas"} · {"Deposit"} {formatRupiah(deposit)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setPickedStudent("");
                        setQuery("");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={"Ubah"}
                      className="rounded-full bg-forest-50 px-3 py-1"
                    >
                      <Text className="text-[11px] font-bold text-forest-700">{"Ubah"}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View className="mt-1 flex-row items-center gap-2 rounded-xl bg-white border border-forest-200 px-3">
                      <Icon name="magnifier-linear" size={16} color="#94a3b8" />
                      <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={"Cari nama siswa"}
                        placeholderTextColor="#94a3b8"
                        accessibilityLabel={"Cari nama siswa"}
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
                        {list.length === 0 && <Text className="py-2 text-center text-[12px] text-slate-500">{"Tidak ada siswa yang cocok"}</Text>}
                      </ScrollView>
                    </View>
                  </>
                )}

                <Text className="mt-4 text-xs font-bold text-forest-900">{"Jenis pembayaran"}</Text>
                <Pressable onPress={() => setTypePicker(true)} accessibilityRole="button" className="mt-1 flex-row items-center gap-3 rounded-xl border border-forest-200 bg-white px-3.5 py-3">
                  <Icon name="tag-price-bold" size={18} color="#136447" />
                  <Text className="flex-1 text-[13px] font-semibold text-forest-900">{type?.name ?? "Belum ada jenis pembayaran"}</Text>
                  <Text className="text-[12px] text-slate-500">{type ? formatRupiah(type.price) : ""}</Text>
                  <Icon name="alt-arrow-down-linear" size={16} color="#64748b" />
                </Pressable>
                <Modal transparent animationType="slide" visible={typePicker} onRequestClose={() => setTypePicker(false)}>
                  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end" style={{ backgroundColor: "rgba(7,39,29,0.45)" }}>
                    <View className="rounded-t-[28px] bg-cream" style={{ paddingBottom: Math.max(insets.bottom, 16), maxHeight: "80%" }}>
                      <View className="p-5"><View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest-200" /><View className="flex-row items-center gap-3"><Text className="flex-1 text-xl font-bold text-forest-900">{"Jenis pembayaran"}</Text><Pressable onPress={() => setTypePicker(false)} hitSlop={12}><Icon name="close-linear" size={20} color="#136447" /></Pressable></View>
                        <View className="mt-4 flex-row items-center gap-2 rounded-xl border border-forest-200 bg-white px-3"><Icon name="magnifier-linear" size={17} color="#94a3b8" /><TextInput value={typeQuery} onChangeText={setTypeQuery} placeholder={"Cari nama jenis pembayaran"} placeholderTextColor="#94a3b8" className="h-11 flex-1 text-[14px] text-forest-900" /></View></View>
                      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">{active.filter((item) => !typeQuery.trim() || item.name.toLowerCase().includes(typeQuery.trim().toLowerCase())).map((item) => <Pressable key={item.id} onPress={() => { setPickedType(item.id); setTypePicker(false); setTypeQuery(""); }} className={`mb-2 flex-row items-center gap-3 rounded-xl border px-3.5 py-3 ${item.id === pickedType ? "border-forest-800 bg-forest-100" : "border-forest-100 bg-white"}`}><Icon name={item.icon} size={20} color="#136447" /><Text className="flex-1 text-[13px] font-semibold text-forest-900">{item.name}</Text><Text className="text-[12px] text-slate-500">{formatRupiah(item.price)}</Text>{item.id === pickedType && <Icon name="check-circle-bold" size={16} color="#136447" />}</Pressable>)}</ScrollView>
                    </View>
                  </KeyboardAvoidingView>
                </Modal>

                {openBill && (
                  <Text className="mt-2 rounded-xl bg-gold-200/60 p-3 text-[11px] text-forest-950">
                    {`Sudah dibayar ${formatRupiah(paidBefore)} · Sisa tagihan ${formatRupiah(due)}`}
                  </Text>
                )}

                <Text className="mt-4 text-xs font-bold text-forest-900">{"Jumlah bayar"}</Text>
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
                    accessibilityLabel={"Jumlah bayar"}
                    className="h-11 flex-1 px-2 text-[15px] text-forest-900"
                  />
                  <Pressable onPress={() => setAmount(String(due))} accessibilityRole="button" accessibilityLabel={"Bayar penuh"} className="rounded-full bg-forest-50 px-3 py-1">
                    <Text className="text-[11px] font-bold text-forest-800">{"Bayar penuh"}</Text>
                  </Pressable>
                </View>
                <Text className="mt-1 text-[11px] text-slate-500">{"Masukkan 0 jika belum ada pembayaran (dicatat sebagai kredit)."}</Text>
                {offer > 0 && (
                  <Pressable
                    onPress={() => setUseDeposit((on) => !on)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: useDeposit }}
                    accessibilityLabel={`Gunakan deposit ${formatRupiah(offer)}`}
                    className={`mt-2 flex-row items-center gap-2 rounded-xl border px-3 py-2 ${useDeposit ? "border-forest-800 bg-forest-100" : "border-forest-200 bg-white"}`}
                  >
                    <Icon name="wallet-money-bold-duotone" size={16} color={useDeposit ? "#136447" : "#94a3b8"} />
                    <Text className={`flex-1 text-[12px] font-semibold ${useDeposit ? "text-forest-900" : "text-slate-600"}`}>
                      {`Gunakan deposit ${formatRupiah(offer)}`}
                    </Text>
                    {useDeposit && dep < offer && <Text className="text-[10px] text-slate-500">{formatRupiah(offer - dep)}</Text>}
                    {useDeposit && <Icon name="check-circle-bold" size={14} color="#136447" />}
                  </Pressable>
                )}

                <View className="mt-4 rounded-2xl bg-white p-4 border border-forest-100">
                  <View className="flex-row justify-between">
                    <Text className="text-[13px] text-slate-500">{openBill ? "Sisa" : "Tagihan"}</Text>
                    <Text className="text-[13px] font-bold text-forest-900">{formatRupiah(due)}</Text>
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <Text className="text-[13px] text-slate-500">{"Jumlah bayar"}</Text>
                    <Text className="text-[13px] font-bold text-forest-800">{formatRupiah(amt + dep)}</Text>
                  </View>
                  {over > 0 && (
                    <View className="mt-1 flex-row justify-between">
                      <Text className="text-[13px] text-slate-500">{"Masuk deposit"}</Text>
                      <Text className="text-[13px] font-bold text-gold-600">+{formatRupiah(over)}</Text>
                    </View>
                  )}
                  <View className="mt-1 flex-row items-center justify-between border-t border-forest-100 pt-2">
                    <Text className="text-[13px] text-slate-500">{"Sisa"}</Text>
                    <View className="flex-row items-center gap-2">
                      {status && (
                        <View className={`rounded-full px-2 py-0.5 ${status === "full" ? "bg-forest-100" : status === "part" ? "bg-sky-100" : "bg-gold-200"}`}>
                          <Text className={`text-[10px] font-bold ${status === "full" ? "text-forest-800" : status === "part" ? "text-sky-800" : "text-gold-600"}`}>
                            {status === "full" ? "Lunas" : status === "part" ? "Sebagian" : "Kredit"}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[13px] font-bold text-gold-600">{formatRupiah(Math.max(due - amt - dep, 0))}</Text>
                    </View>
                  </View>
                </View>

                <Text className="mt-3 text-[10px] text-slate-400">{"Bukti pembayaran wajib diunggah"}</Text>
                {error !== "" && <Text className="mt-2 text-xs font-semibold text-danger">{error}</Text>}
                <Pressable
                  onPress={next}
                  disabled={saving}
                  accessibilityRole="button"
                  className="mt-4 w-full items-center rounded-2xl py-3.5"
                  style={{ backgroundColor: theme.brand900, opacity: saving ? 0.6 : 1 }}
                >
                  <Text className="text-sm font-bold text-white">{"Lanjut"}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
