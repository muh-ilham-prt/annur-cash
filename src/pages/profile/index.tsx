import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TENANTS, TENANT, NEUTRALS } from "../../theme/tenant";
import { Topbar } from "../../components/Topbar";
import { Icon, type IconName } from "../../components/Icon";

interface ProfilePageProps {
  onLogout: () => void;
  onChangePassword: () => void;
  onEditProfile: () => void;
  onAbout: () => void;
  user?: { name: string; email: string } | null;
}

export default function ProfilePage({
  onLogout,
  onChangePassword,
  onEditProfile,
  onAbout,
  user,
}: ProfilePageProps) {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  const items: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: "Ubah kata sandi", icon: "lock-outline", onPress: onChangePassword },
    { label: "Edit profil", icon: "users-group-rounded-bold", onPress: onEditProfile },
    { label: "Tentang aplikasi", icon: "information-outline", onPress: onAbout },
  ];
  return (
    <View className="flex-1 bg-cream">
      <LinearGradient
        colors={[theme.brand700, theme.brand950]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 34, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
      >
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white/15 border-2 border-white/40">
            <Icon name="users-group-rounded-bold" size={38} color="#fff" />
          </View>
          <Text className="mt-3 text-[20px] font-bold text-white">{user?.name || "Profil"}</Text>
          <Text className="mt-1 text-[12px] text-white/70">{user?.email || "Kelola akun dan preferensi aplikasi"}</Text>
        </View>
      </LinearGradient>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>
        <Text className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-500">Akun</Text>
        <View className="overflow-hidden rounded-2xl border border-forest-100 bg-white">
          {items.map((item, index) => (
            <Pressable key={item.label} onPress={item.onPress} accessibilityRole="button" className={`flex-row items-center gap-3 px-4 py-4 ${index < items.length - 1 ? "border-b border-forest-100" : ""}`}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-forest-100"><Icon name={item.icon} size={20} color={theme.brand700} /></View>
              <Text className="flex-1 text-[14px] font-semibold text-forest-900">{item.label}</Text>
              <Icon name="chevron-right" size={20} color={NEUTRALS.placeholder} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onLogout} accessibilityRole="button" className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-4">
          <Icon name="logout-2-outline" size={19} color="#dc2626" />
          <Text className="text-[14px] font-bold text-red-600">Keluar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
