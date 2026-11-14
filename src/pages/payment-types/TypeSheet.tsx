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
import { Icon } from "../../components/Icon";
import { newId, TYPE_ICONS, type PaymentType } from "../../helpers/domain";
import type { TenantTheme } from "../../theme/tenant";

interface TypeSheetProps {
  theme: TenantTheme;
  /** Existing type to edit, or null to create. */
  value: PaymentType | null;
  existing: PaymentType[];
  /** In use by payments — blocks delete and shows the price-change note. */
  used?: number;
  onClose: () => void;
  onSave: (type: PaymentType) => Promise<void>;
  onToggleArchive?: (type: PaymentType) => void;
  onDelete?: (type: PaymentType) => void;
}

const MIN_PRICE = 1000;
const MAX_PRICE = 100000000;

// "350000" → "350.000"; keeps only digits while typing.
const groupDigits = (value: string) => {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export function TypeSheet({
  theme,
  value,
  existing,
  used = 0,
  onClose,
  onSave,
  onToggleArchive,
  onDelete,
}: TypeSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(value?.name ?? "");
  const [price, setPrice] = useState(
    value ? groupDigits(String(value.price)) : "",
  );
  const [icon, setIcon] = useState(value?.icon ?? TYPE_ICONS[0].icon);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const clean = name.trim().replace(/\s+/g, " ");
    const amount = Number(price.replace(/\D/g, "")) || 0;
    const duplicate = existing.some(
      (item) =>
        item.name.toLowerCase() === clean.toLowerCase() &&
        item.id !== value?.id,
    );
    const next = {
      name:
        clean.length < 2
          ? "paymentTypes.errName"
          : duplicate
            ? "paymentTypes.errDuplicate"
            : undefined,
      price:
        amount < MIN_PRICE
          ? "paymentTypes.errPriceMin"
          : amount > MAX_PRICE
            ? "paymentTypes.errPriceMax"
            : undefined,
    };
    setErrors(next);
    if (next.name || next.price) return;

    setSaving(true);
    try {
      await onSave({
        id: value?.id ?? newId(),
        name: clean,
        price: amount,
        icon,
        archived: value?.archived ?? false,
      });
    } catch (e) {
      setErrors({ name: e instanceof Error ? e.message : "paymentTypes.errName" });
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  const confirmDelete = () => {
    if (!value) return;
    const run = () => {
      onDelete?.(value);
      onClose();
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("paymentTypes.deleteConfirm"))
        run();
      return;
    }
    Alert.alert(
      "paymentTypes.deleteTitle",
      "paymentTypes.deleteBody",
      [
        { text: "common.cancel", style: "cancel" },
        { text: "paymentTypes.delete", style: "destructive", onPress: run },
      ],
    );
  };

  const field =
    "mt-1 rounded-xl border bg-white px-3.5 py-3 text-[15px] text-forest-900";
  const border = (invalid?: string) => ({
    borderColor: invalid ? "#f43f5e" : "#d8f3e3",
  });

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(7,39,29,0.45)" }}
      >
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel={"paymentTypes.close"}
        />
        <View
          className="bg-cream rounded-t-[28px]"
          style={{
            maxHeight: "92%",
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingVertical: 20,
            }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest-200" />
            <View className="flex-row items-center gap-4">
              <Text className="flex-1 text-forest-900 text-xl font-bold">
                {value ? "paymentTypes.sheetEdit" : "paymentTypes.sheetNew"}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={"paymentTypes.close"}
                hitSlop={12}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#136447] border border-forest-100"
              >
                <Icon name="close-linear" size={15} color="#ffffff" />
              </Pressable>
            </View>

            <Text className="mt-4 text-xs font-bold text-forest-900">
              {"paymentTypes.name"}
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              maxLength={40}
              autoFocus
              placeholder={"paymentTypes.namePlaceholder"}
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              accessibilityLabel={"paymentTypes.name"}
              className={field}
              style={border(errors.name)}
            />
            {errors.name && (
              <Text className="mt-1 text-xs font-semibold text-danger">
                {errors.name}
              </Text>
            )}

            <Text className="mt-4 text-xs font-bold text-forest-900">
              {"paymentTypes.price"}
            </Text>
            <View
              className="mt-1 flex-row items-center rounded-xl border bg-white"
              style={border(errors.price)}
            >
              <Text className="pl-3.5 text-[15px] font-bold text-slate-400">
                Rp
              </Text>
              <TextInput
                value={price}
                onChangeText={(text) => {
                  setPrice(groupDigits(text));
                  if (errors.price)
                    setErrors((prev) => ({ ...prev, price: undefined }));
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="350.000"
                placeholderTextColor="#94a3b8"
                accessibilityLabel={"paymentTypes.price"}
                className="flex-1 py-3 pr-3.5 text-[15px] text-forest-900"
              />
            </View>
            <Text className="mt-1 text-[11px] text-slate-500">
              {"paymentTypes.priceHint"}
            </Text>
            {errors.price && (
              <Text className="mt-1 text-xs font-semibold text-danger">
                {errors.price}
              </Text>
            )}

            <Text className="mt-4 text-xs font-bold text-forest-900">
              {"paymentTypes.icon"}
            </Text>
            <View className="mt-1 flex-row flex-wrap gap-2">
              {TYPE_ICONS.map((tone) => {
                const selected = tone.icon === icon;
                return (
                  <Pressable
                    key={tone.icon}
                    onPress={() => setIcon(tone.icon)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className="w-[22%] items-center justify-center rounded-xl border bg-white"
                    style={{
                      height: 48,
                      borderColor: selected ? theme.brand700 : "#d8f3e3",
                      borderWidth: selected ? 2 : 1,
                    }}
                  >
                    <View
                      className="h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: tone.bg }}
                    >
                      <Icon name={tone.icon} size={22} color={tone.color} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {used > 0 && (
              <Text className="mt-4 rounded-xl bg-gold-200 p-3 text-xs text-forest-900">
                {"paymentTypes.priceNote"}
              </Text>
            )}

            <Pressable
              onPress={submit}
              disabled={saving}
              accessibilityRole="button"
              className="mt-5 w-full items-center rounded-2xl py-3.5"
              style={{
                backgroundColor: theme.brand900,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text className="text-sm font-bold text-white">
                {saving ? "common.loading" : "common.save"}
              </Text>
            </Pressable>

            {value && (
              <View className="mt-3 gap-2">
                <Pressable
                  onPress={() => {
                    onToggleArchive?.(value);
                    onClose();
                  }}
                  className="w-full items-center rounded-2xl bg-white py-3 border border-forest-200"
                >
                  <Text className="text-sm font-bold text-forest-800">
                    {value.archived
                      ? "paymentTypes.restoreAction"
                      : "paymentTypes.archiveAction"}
                  </Text>
                </Pressable>
                {used === 0 && (
                  <Pressable
                    onPress={confirmDelete}
                    className="w-full items-center rounded-2xl bg-white py-3 border border-forest-100"
                  >
                    <Text className="text-sm font-bold text-danger">
                      {"paymentTypes.delete"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

