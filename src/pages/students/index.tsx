import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { MasjidPattern } from "../../components/MasjidPattern";
import { Toast } from "../../components/Toast";
import { TENANTS, TENANT } from "../../theme/tenant";
import { formatRupiah } from "../../helpers/money";
import { studentTotals, type Payment, type Student } from "../../helpers/domain";
import { fetchRecentPayments } from "../../helpers/reports";
import { createStudent, deleteStudent, fetchStudents, importStudents, updateStudent } from "../../helpers/students";
import type { MainTabParamList } from "../../router";
import { ImportSheet } from "./components/ImportSheet";
import { StudentSheet } from "./components/StudentSheet";

const gradeOf = (cls: string | null | undefined) => (cls ?? "").replace(/\D/g, "");
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function StudentsPage() {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Student | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(
    () => students.map((student) => ({ student, totals: studentTotals(student, payments) })).sort((a, b) => (a.student.cls ?? "").localeCompare(b.student.cls ?? "", "id", { numeric: true }) || a.student.name.localeCompare(b.student.name, "id")),
    [students, payments],
  );
  const grades = useMemo(() => [...new Set(students.map((s) => gradeOf(s.cls)).filter(Boolean))].sort((a, b) => +a - +b), [students]);
  const dueCount = rows.filter((r) => r.totals.due > 0).length;
  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    ({ student, totals }) =>
      (!q || `${student.name} ${student.cls} ${student.nis}`.toLowerCase().includes(q)) &&
      (grade === "all" || (grade === "due" ? totals.due > 0 : gradeOf(student.cls) === grade)),
  );

  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try {
      const [nextStudents, nextPayments] = await Promise.all([fetchStudents(), fetchRecentPayments()]);
      setStudents(nextStudents);
      setPayments(nextPayments);
      setLoaded(true);
    } catch (e) {
      setToast((e as Error).message);
    }
  };
  const refresh = () => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
  }, []));

  const save = async (next: Student) => {
    const exists = students.some((s) => s.id === next.id);
    const saved = await (exists ? updateStudent(next) : createStudent(next));
    setStudents((current) => (exists ? current.map((s) => (s.id === next.id ? saved : s)) : [...current, saved]));
    setToast(exists ? "Siswa diperbarui" : "Siswa ditambahkan");
  };

  const importNew = async (added: Student[], skipped: number) => {
    try {
      const res = await importStudents(added);
      setStudents(await fetchStudents());
      setToast(`Berhasil menambahkan ${res.created} siswa; ${skipped + res.skipped.length} dilewati`);
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const remove = async (student: Student) => {
    try {
      await deleteStudent(student);
      setStudents((current) => current.filter((s) => s.id !== student.id));
      setToast("Siswa dihapus");
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const chips: { key: string; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "due", label: "Ada tagihan" },
    ...grades.map((g) => ({ key: g, label: "Kelas" })),
  ];

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
            onPress={() => navigation.navigate("Home")}
            accessibilityRole="button"
            accessibilityLabel={"Kembali ke beranda"}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-forest-800"
          >
            <Icon name="alt-arrow-left-linear" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-[20px] font-bold leading-tight">{"Siswa"}</Text>
            <Text className="text-white/70 text-[12px]">{"Kelola data siswa dan status pembayaran"}</Text>
          </View>
          <Pressable
            onPress={() => setImporting(true)}
            accessibilityRole="button"
            accessibilityLabel={"Impor"}
            className="h-10 flex-row items-center gap-1.5 rounded-2xl bg-forest-800 px-3"
          >
            <Icon name="upload-minimalistic-bold" size={16} color="#fff" />
            <Text className="text-white text-[12px] font-bold">{"Impor"}</Text>
          </Pressable>
        </View>
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-white/15 px-3.5">
          <Icon name="magnifier-linear" size={18} color="#ffffffb3" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={"Cari siswa"}
            placeholderTextColor="#ffffff99"
            autoCorrect={false}
            accessibilityLabel={"Cari siswa"}
            className="h-12 flex-1 text-[14px] text-white"
          />
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.brand700} colors={[theme.brand700]} />}
      >
        <View className="mt-4 flex-row gap-3 px-5">
          <View className="flex-1 rounded-2xl bg-white p-3.5 border border-forest-100">
            <Text className="text-[11px] text-slate-500">{"Total siswa"}</Text>
            <Text className="mt-1 text-forest-900 text-[22px] font-extrabold">{students.length}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-gold-200 p-3.5 border border-gold-300">
            <Text className="text-[11px] font-semibold text-forest-800">{"Belum lunas"}</Text>
            <Text className="mt-1 text-forest-950 text-[22px] font-extrabold">{dueCount}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 16 }}>
          {chips.map((chip) => {
            const active = grade === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setGrade(chip.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={`rounded-full px-4 py-1.5 border ${active ? "bg-forest-800 border-forest-800" : "bg-white border-forest-200"}`}
              >
                <Text className={`text-[12px] font-semibold ${active ? "text-white" : "text-forest-800"}`}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-4 gap-3 px-5">
          {visible.map(({ student, totals }) => (
            <Pressable
              key={student.id}
              onPress={() => setEditing(student)}
              accessibilityRole="button"
              accessibilityLabel={"Edit siswa" + " " + student.name}
              className="flex-row items-center gap-3 rounded-2xl bg-white p-3.5 border border-forest-100"
            >
              {student.qrSvg ? (
                <Image source={{ uri: student.qrSvg }} className="h-11 w-11 rounded-lg" accessibilityLabel={"QR" + " " + student.name} />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-forest-100">
                  <Text className="text-forest-800 text-[14px] font-bold">{initials(student.name)}</Text>
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-forest-900 text-[14px] font-bold" numberOfLines={1}>
                    {student.name}
                  </Text>
                  {student.status === "candidate" && <Text className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700">PPDB</Text>}
                </View>
                <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                  {"Kelas"} · {student.nis ? "NIS" : "Tanpa NIS"} · {" transaksi"}
                </Text>
              </View>
              <View className="shrink-0">
                {totals.due ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-gold-200 px-2 py-0.5">
                    <Icon name="clock-circle-bold" size={11} color="#c27f17" />
                    <Text className="text-[10px] font-bold text-gold-600">{formatRupiah(totals.due)}</Text>
                  </View>
                ) : totals.n ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5">
                    <Icon name="check-circle-bold" size={11} color="#136447" />
                    <Text className="text-[10px] font-bold text-forest-800">{"Lunas"}</Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-slate-400">-</Text>
                )}
              </View>
            </Pressable>
          ))}

          {visible.length === 0 && (
            <View className="rounded-2xl border border-dashed border-forest-200 p-8 items-center">
              <Icon name="users-group-rounded-bold" size={36} color="#80d1ad" />
              <Text className="mt-2 text-forest-900 text-[14px] font-semibold">
                {q || grade !== "all" ? "Siswa tidak ditemukan" : "Belum ada siswa"}
              </Text>
              {loaded && !q && grade === "all" && (
                <Text className="mt-1 text-[13px] text-slate-500 text-center">{"Tambahkan siswa untuk mulai mencatat pembayaran."}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setEditing("new")}
        accessibilityRole="button"
        accessibilityLabel={"Tambah siswa"}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full"
        style={{ bottom: 104, backgroundColor: theme.brand900, shadowColor: "#07271d", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
      >
        <Icon name="user-plus-bold" size={26} color="#fff" />
      </Pressable>

      {editing && (
        <StudentSheet
          theme={theme}
          value={editing === "new" ? null : editing}
          existing={students}
          used={editing === "new" ? 0 : studentTotals(editing, payments).n}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
      {importing && <ImportSheet theme={theme} existing={students} onClose={() => setImporting(false)} onImport={importNew} />}
      <Toast theme={theme} message={toast} onHide={() => setToast(null)} />
    </View>
  );
}
