import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../../components/Icon";
import { useI18n } from "../../../helpers/i18n";
import { newId, type Student } from "../../../helpers/db";
import type { TenantTheme } from "../../../theme/tenant";

interface StudentSheetProps {
  theme: TenantTheme;
  /** Existing murid to edit, or null to create. */
  value: Student | null;
  existing: Student[];
  /** Payments on record — blocks delete. */
  used?: number;
  onClose: () => void;
  onSave: (student: Student) => Promise<void>;
  onDelete?: (student: Student) => void;
}

const CLASS_RE = /^[1-6][A-Z]?$/;

export function StudentSheet({ theme, value, existing, used = 0, onClose, onSave, onDelete }: StudentSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [name, setName] = useState(value?.name ?? "");
  const [cls, setCls] = useState(value?.cls ?? "");
  const [nis, setNis] = useState(value?.nis ?? "");
  const [errors, setErrors] = useState<{ name?: string; cls?: string; nis?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (again = false) => {
    const clean = name.trim().replace(/\s+/g, " ");
    const classKey = cls.trim().toUpperCase();
    const nisKey = nis.replace(/\D/g, "");
    const next = {
      name:
        clean.length < 3
          ? t("students.errName")
          : existing.some((s) => s.name.toLowerCase() === clean.toLowerCase() && s.cls === classKey && s.id !== value?.id)
            ? t("students.errDuplicate")
            : undefined,
      cls: CLASS_RE.test(classKey) ? undefined : t("students.errClass"),
      nis:
        nisKey && existing.some((s) => s.nis === nisKey && s.id !== value?.id)
          ? t("students.errNisDuplicate")
          : undefined,
    };
    setErrors(next);
    if (next.name || next.cls || next.nis) return;

    setSaving(true);
    await onSave({ id: value?.id ?? newId(), name: clean, cls: classKey, nis: nisKey });
    setSaving(false);
    // "Save & add another" keeps the class and clears the identity fields.
    if (again && !value) {
      setName("");
      setNis("");
      return;
    }
    onClose();
  };

  const confirmDelete = () => {
    if (!value) return;
    const run = () => {
      onDelete?.(value);
      onClose();
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(t("students.deleteConfirm", { name: value.name }))) run();
      return;
    }
    Alert.alert(t("students.deleteTitle", { name: value.name }), t("students.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("students.delete"), style: "destructive", onPress: run },
    ]);
  };

  const border = (invalid?: string) => ({ borderColor: invalid ? "#f43f5e" : "#d8f3e3" });
  const field = "rounded-xl border bg-white px-3.5 py-3 text-[15px] text-forest-900";

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(7,39,29,0.45)" }}
      >
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={t("paymentTypes.close")} />
        <View className="bg-cream rounded-t-[28px]" style={{ maxHeight: "92%", paddingBottom: Math.max(insets.bottom, 16) }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest-200" />
            <View className="flex-row items-center gap-4">
              <Text className="flex-1 text-forest-900 text-xl font-bold">
                {value ? t("students.sheetEdit") : t("students.sheetNew")}
              </Text>
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

            <Text className="mt-4 text-xs font-bold text-forest-900">{t("students.name")}</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              maxLength={60}
              autoFocus
              autoCorrect={false}
              accessibilityLabel={t("students.name")}
              className={`mt-1 ${field}`}
              style={border(errors.name)}
            />
            {errors.name && <Text className="mt-1 text-xs font-semibold text-danger">{errors.name}</Text>}

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-forest-900">{t("students.class")}</Text>
                <TextInput
                  value={cls}
                  onChangeText={(text) => {
                    setCls(text.toUpperCase());
                    if (errors.cls) setErrors((prev) => ({ ...prev, cls: undefined }));
                  }}
                  maxLength={2}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder={t("students.classPlaceholder")}
                  placeholderTextColor="#94a3b8"
                  accessibilityLabel={t("students.class")}
                  className={`mt-1 ${field}`}
                  style={border(errors.cls)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-forest-900">{t("students.nisLabel")}</Text>
                <TextInput
                  value={nis}
                  onChangeText={(text) => {
                    setNis(text.replace(/\D/g, ""));
                    if (errors.nis) setErrors((prev) => ({ ...prev, nis: undefined }));
                  }}
                  maxLength={16}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  accessibilityLabel={t("students.nisLabel")}
                  className={`mt-1 ${field}`}
                  style={border(errors.nis)}
                />
              </View>
            </View>
            {(errors.cls || errors.nis) && (
              <Text className="mt-1 text-xs font-semibold text-danger">{errors.cls ?? errors.nis}</Text>
            )}

            <Pressable
              onPress={() => void submit()}
              disabled={saving}
              accessibilityRole="button"
              className="mt-5 w-full items-center rounded-2xl py-3.5"
              style={{ backgroundColor: theme.brand900, opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-sm font-bold text-white">{saving ? t("common.loading") : t("students.save")}</Text>
            </Pressable>

            {!value && (
              <Pressable
                onPress={() => void submit(true)}
                disabled={saving}
                accessibilityRole="button"
                className="mt-2 w-full items-center rounded-2xl bg-white py-3 border border-forest-200"
              >
                <Text className="text-sm font-bold text-forest-800">{t("students.saveAgain")}</Text>
              </Pressable>
            )}

            {value && (
              <Pressable
                onPress={used === 0 ? confirmDelete : undefined}
                disabled={used > 0}
                accessibilityRole="button"
                accessibilityState={{ disabled: used > 0 }}
                accessibilityLabel={t("students.delete")}
                className="mt-3 w-full items-center rounded-2xl bg-white py-3 border border-forest-100"
                style={{ opacity: used > 0 ? 0.45 : 1 }}
              >
                <Text className="text-sm font-bold text-danger">{t("students.delete")}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
