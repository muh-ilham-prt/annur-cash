import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { TENANTS, TENANT, NEUTRALS } from "../../theme/tenant";
import { Icon } from "../../components/Icon";
import { MasjidPattern } from "../../components/MasjidPattern";
import { getRememberedUser, setRememberedUser, signIn } from "../../helpers/auth";

interface LoginScreenProps {
  onSubmit?: () => void;
}

export default function LoginScreen({ onSubmit }: LoginScreenProps) {
  const theme = TENANTS[TENANT];
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<{ user?: boolean; pass?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    void getRememberedUser().then((user) => {
      if (!user) return;
      setIdentifier(user);
      setRemember(true);
    });
  }, [rise]);

  const submit = async () => {
    if (submitting) return;
    const user = identifier.trim();
    const missing = { user: !user, pass: !password };
    setInvalid(missing);
    if (missing.user || missing.pass) {
      setError("Masukkan email/username dan kata sandi");
      return;
    }
    setError(null);
    setSubmitting(true);
    const ok = await signIn(user, password);
    if (!ok) {
      setSubmitting(false);
      setPassword("");
      setError("Email/username atau kata sandi salah");
      return;
    }
    await setRememberedUser(remember ? user : null);
    onSubmit?.();
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={[]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          {/* edges={[]} above: the gradient paints under the status bar; the inner SafeAreaView keeps content clear of it. */}
          <LinearGradient
            colors={[theme.brand700, theme.brand950]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-b-[40px] pb-24"
            style={{ overflow: "hidden" }}
          >
            <View className="absolute inset-0" pointerEvents="none">
              <MasjidPattern />
            </View>
            <SafeAreaView edges={["top"]} className="px-6 pt-8">
              {/* The card lifts −56px over this area; the bottom gap keeps it off the school name. */}
              <View className="items-center pb-24">
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl">
                  <Icon name={theme.brandIcon} size={48} color={theme.brand700} />
                </View>
                <Text className="mt-5 text-[24px] text-gold-300">السلام عليكم</Text>
                <Text className="mt-1 text-[24px] font-extrabold text-white">{theme.name}</Text>
                <Text className="mt-1 text-[12px] text-white/70">{theme.school}</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <Animated.View
            style={{
              opacity: rise,
              transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            }}
            className="relative z-10 -mt-14 px-5 pb-8"
          >
            <View className="rounded-3xl bg-white p-6 ring-1 ring-forest-100">
              <Text className="text-forest-900 text-xl font-extrabold">{"Masuk"}</Text>
              <Text className="mt-1 text-[14px] text-slate-500">{"Khusus petugas keuangan dan admin sekolah."}</Text>

              {error && (
                <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-rose-100 px-4 py-3" accessibilityRole="alert">
                  <Icon name="danger-circle-bold" size={18} color={NEUTRALS.rose700} />
                  <Text className="flex-1 text-[13px] font-semibold" style={{ color: NEUTRALS.rose700 }}>
                    {error}
                  </Text>
                </View>
              )}

              <Text className="mt-5 text-[12px] font-bold text-forest-900">{"Email atau username"}</Text>
              <TextInput
                value={identifier}
                onChangeText={(value) => {
                  setIdentifier(value);
                  setInvalid((v) => ({ ...v, user: false }));
                }}
                placeholder="bendahara@annurifs.sch.id"
                placeholderTextColor={NEUTRALS.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                accessibilityLabel={"Email atau username"}
                accessibilityState={{ disabled: submitting }}
                className={`mt-1 h-[52px] rounded-2xl border bg-white px-4 text-[15px] text-ink ${
                  invalid.user ? "border-danger" : "border-forest-200"
                }`}
              />

              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-[12px] font-bold text-forest-900">{"Kata sandi"}</Text>
                <Text className="text-[12px] font-bold text-forest-600">{"Lupa kata sandi?"}</Text>
              </View>
              <View className={`mt-1 flex-row items-center rounded-2xl border bg-white pr-1.5 ${
                invalid.pass ? "border-danger" : "border-forest-200"
              }`}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setInvalid((v) => ({ ...v, pass: false }));
                  }}
                  placeholder={"Masukkan kata sandi"}
                  placeholderTextColor={NEUTRALS.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  accessibilityLabel={"Kata sandi"}
                  accessibilityState={{ disabled: submitting }}
                  className="h-[52px] flex-1 px-4 text-[15px] text-ink"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  accessibilityState={{ selected: showPassword }}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                >
                  <Icon name={showPassword ? "eye-closed-linear" : "eye-linear"} size={22} color={NEUTRALS.slate500} />
                </Pressable>
              </View>

              <Pressable
                onPress={() => setRemember((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
                accessibilityLabel={"Ingat saya di perangkat ini"}
                className="mt-4 flex-row items-center gap-2.5"
              >
                <View
                  className={`h-5 w-5 items-center justify-center rounded-md border-2 ${
                    remember ? "border-forest-600 bg-forest-600" : "border-forest-300 bg-white"
                  }`}
                >
                  {remember && <Icon name="check-circle-bold" size={12} color="#fff" />}
                </View>
                <Text className="text-[14px] text-slate-600">{"Ingat saya di perangkat ini"}</Text>
              </Pressable>

              <Pressable
                onPress={() => void submit()}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityState={{ disabled: submitting, busy: submitting }}
                className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90"
                style={{ backgroundColor: theme.brand900, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting && <Icon name="refresh-linear" size={20} color="#fff" />}
                <Text className="text-[14px] font-bold text-white">
                  {submitting ? "Memeriksa…" : "Masuk"}
                </Text>
              </Pressable>
            </View>

            <Text className="mt-5 mb-6 text-center text-[12px] text-slate-500">{"Kesulitan masuk? Hubungi admin sekolah."}</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SafeAreaView edges={["bottom"]} className="bg-cream" />
    </SafeAreaView>
  );
}
