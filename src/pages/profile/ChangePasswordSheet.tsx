import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { changePassword } from "../../helpers/auth";

export function ChangePasswordSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (password.length < 8) return setError("Kata sandi minimal 8 karakter.");
    if (password !== confirmation) return setError("Konfirmasi kata sandi tidak cocok.");
    setSaving(true);
    setError("");
    try {
      await changePassword(password);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah kata sandi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 justify-end bg-black/40" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
          <View className="rounded-t-3xl bg-cream p-6">
            <Text className="text-xl font-bold text-forest-900">Ubah kata sandi</Text>
            <Text className="mt-4 text-xs font-bold text-forest-900">Kata sandi baru</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry className="mt-1 h-12 rounded-xl border border-forest-200 bg-white px-3" />
            <Text className="mt-3 text-xs font-bold text-forest-900">Konfirmasi kata sandi</Text>
            <TextInput value={confirmation} onChangeText={setConfirmation} secureTextEntry className="mt-1 h-12 rounded-xl border border-forest-200 bg-white px-3" />
            {error && <Text className="mt-2 text-xs text-red-600">{error}</Text>}
            <View className="mt-5 flex-row gap-2">
              <Pressable onPress={onClose} className="flex-1 items-center rounded-xl bg-forest-100 py-3"><Text className="font-bold text-forest-800">Batal</Text></Pressable>
              <Pressable onPress={() => void save()} disabled={saving} className="flex-1 items-center rounded-xl bg-forest-900 py-3"><Text className="font-bold text-white">{saving ? "Menyimpan…" : "Simpan"}</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
