import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Icon } from "../../../components/Icon";
import { newId, type Student } from "../../../helpers/domain";
import type { TenantTheme } from "../../../theme/tenant";
import { evaluate, MAX_FILE, readSheet, type Row } from "../parse";

interface ImportSheetProps {
  theme: TenantTheme;
  existing: Student[];
  onClose: () => void;
  onImport: (students: Student[], skipped: number) => void;
}

const TONE = {
  new: { chip: "bg-forest-100", text: "text-forest-800", icon: "check-circle-bold" as const, color: "#136447" },
  dup: { chip: "bg-gold-200", text: "text-gold-600", icon: "forbidden-circle-bold" as const, color: "#c27f17" },
  err: { chip: "bg-red-100", text: "text-red-700", icon: "danger-circle-bold" as const, color: "#dc2626" },
};
const ORDER = { err: 0, dup: 1, new: 2 };
const SHOWN = 150;

export function ImportSheet({ theme, existing, onClose, onImport }: ImportSheetProps) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "text/comma-separated-values"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setBusy(true);
      const file = result.assets[0];
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("Format file tidak didukung");
      if ((file.size ?? 0) > MAX_FILE) throw new Error("File terlalu besar");
      if (!file.uri) throw new Error("File tidak valid");
      // ponytail: fetch() on the blob/file URI — no bytes in base64 (file/base64 options kept off).
      const res = await fetch(file.uri);
      const parsed = evaluate(readSheet(new Uint8Array(await res.arrayBuffer())), existing, {
        tooMany: "Terlalu banyak baris",
        nisSci: "NIS tidak boleh dalam notasi ilmiah",
        badName: "Nama siswa tidak valid",
        badClass: "Kelas tidak valid",
        badNis: "NIS tidak valid",
        longNis: "NIS terlalu panjang",
        dup: "Data siswa duplikat",
        dupNis: "NIS duplikat",
      });
      if (parsed.length === 0) throw new Error("File kosong");
      setRows(parsed);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "File tidak valid");
    } finally {
      setBusy(false);
    }
  };

  const go = () => {
    if (!rows) return;
    const add = rows.filter((r) => r.status === "new");
    if (!add.length) return;
    onImport(
      add.map((r) => ({ id: newId(), name: r.name, cls: r.cls, nis: r.nis })),
      rows.length - add.length,
    );
    onClose();
  };

  const count = (status: Row["status"]) => rows?.filter((r) => r.status === status).length ?? 0;
  const shown = rows ? [...rows].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.line - b.line).slice(0, SHOWN) : [];
  const fresh = count("new");

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(7,39,29,0.45)" }}>
        <View className="bg-cream rounded-t-[28px]" style={{ flexShrink: 1, paddingBottom: Math.max(insets.bottom, 16) }}>
          {/* The scroll view only grows once content exceeds the sheet, so the action stays visible. */}
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }} keyboardShouldPersistTaps="handled">
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest-200" />
            <View className="flex-row items-center gap-4">
              <Text className="flex-1 text-forest-900 text-xl font-bold">{"Impor siswa"}</Text>
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

            {!rows ? (
              <>
                <Pressable
                  onPress={() => void pick()}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={"Pilih file"}
                  className="mt-5 items-center rounded-2xl border border-dashed border-forest-300 bg-white p-6"
                >
                  <Icon name="upload-minimalistic-bold" size={32} color="#136447" />
                  <Text className="mt-2 text-[14px] font-bold text-forest-900">{busy ? "Memuat…" : "Pilih file"}</Text>
                  <Text className="mt-1 text-center text-[12px] text-slate-500">{"Format XLSX, XLS, atau CSV"}</Text>
                  {busy && <ActivityIndicator className="mt-2" color={theme.brand900} />}
                </Pressable>
                <View className="mt-4 flex-row gap-2 rounded-2xl bg-white p-3.5 border border-forest-100">
                  <Icon name="file-text-bold-duotone" size={18} color="#136447" />
                  <View className="flex-1 gap-1">
                    <Text className="text-[12px] text-forest-900">{"Kolom nama siswa"}</Text>
                    <Text className="text-[12px] text-forest-900">{"Kolom kelas"}</Text>
                    <Text className="text-[12px] text-forest-900">{"Kolom NIS"}</Text>
                  </View>
                </View>
                {error !== "" && <Text className="mt-3 text-xs font-semibold text-danger">{error}</Text>}
              </>
            ) : (
              <>
                <Text className="mt-4 text-[12px] text-slate-500">
                  {fileName} · {rows.length} {"baris"}
                </Text>
                <View className="mt-3 flex-row gap-2">
                  {([
                    ["new", "Baru"],
                    ["dup", "Dilewati"],
                    ["err", "Tidak valid"],
                  ] as const).map(([status, label]) => (
                    <View key={status} className="flex-1 rounded-xl bg-white p-2.5 border border-forest-100 items-center">
                      <Text className={`text-[18px] font-extrabold ${TONE[status].text}`}>{count(status)}</Text>
                      <Text className="text-[10px] text-slate-500">{label}</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-3 gap-2">
                  {shown.map((row) => (
                    <View key={row.line} className="flex-row items-start gap-2 rounded-xl bg-white p-2.5 border border-forest-100">
                      <Text className="mt-0.5 w-8 shrink-0 text-center text-[10px] text-slate-400">{row.line}</Text>
                      <View className="flex-1">
                        <Text className="text-[12px] font-bold text-forest-900" numberOfLines={1}>
                          {row.name || "Kosong"}
                          <Text className="font-normal text-slate-500">
                            {" · "}
                            {row.cls || "–"}
                            {row.nis ? ` · ${row.nis}` : ""}
                          </Text>
                        </Text>
                        {row.msg !== "" && <Text className="text-[11px] text-slate-500">{row.msg}</Text>}
                      </View>
                      <View className={`shrink-0 flex-row items-center gap-1 rounded-full px-2 py-0.5 ${TONE[row.status].chip}`}>
                        <Icon name={TONE[row.status].icon} size={11} color={TONE[row.status].color} />
                        <Text className={`text-[10px] font-bold ${TONE[row.status].text}`}>{row.status === "err" ? "Tidak valid" : row.status === "dup" ? "Dilewati" : "Baru"}</Text>
                      </View>
                    </View>
                  ))}
                  {rows.length > shown.length && (
                    <Text className="py-2 text-center text-[11px] text-slate-500">{"dan lainnya"}</Text>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    setRows(null);
                    setError("");
                  }}
                  accessibilityRole="button"
                  className="mt-4 w-full items-center rounded-2xl bg-white py-3 border border-forest-200"
                >
                  <Text className="text-sm font-bold text-forest-800">{"Pilih ulang"}</Text>
                </Pressable>
                <Pressable
                  onPress={go}
                  disabled={fresh === 0}
                  accessibilityRole="button"
                  accessibilityLabel={"Impor"}
                  className="mt-2 w-full items-center rounded-2xl py-3.5"
                  style={{ backgroundColor: theme.brand900, opacity: fresh ? 1 : 0.45 }}
                >
                  <Text className="text-sm font-bold text-white">{fresh ? "Impor" : "Tidak ada data"}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
