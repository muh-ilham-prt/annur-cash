import { Pressable, ScrollView, Text, View } from "react-native";
import { TENANTS, TENANT, NEUTRALS } from "../../theme/tenant";
import { Topbar } from "../../components/Topbar";
import { Icon, type IconName } from "../../components/Icon";

interface ProfilePageProps {
  onLogout: () => void;
  onChangePassword: () => void;
  onEditProfile: () => void;
  onAbout: () => void;
}

export default function ProfilePage({
  onLogout,
  onChangePassword,
  onEditProfile,
  onAbout,
}: ProfilePageProps) {
  const theme = TENANTS[TENANT];
  const items: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: "Ubah kata sandi", icon: "lock-outline", onPress: onChangePassword },
    { label: "Edit profil", icon: "account-edit-outline", onPress: onEditProfile },
    { label: "Tentang aplikasi", icon: "information-outline", onPress: onAbout },
  ];
  return (
    <View className="flex-1 bg-surface">
      <Topbar theme={theme} />
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="bg-white border border-line rounded-2xl overflow-hidden">
          {items.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="button"
              className="flex-row items-center gap-3 px-4 py-4 border-b border-line last:border-b-0"
            >
              <Icon name={item.icon} size={20} color={NEUTRALS.muted} />
              <Text className="flex-1 text-ink text-[14px]">{item.label}</Text>
              <Icon name="chevron-right" size={20} color={NEUTRALS.placeholder} />
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          className="mt-4 rounded-2xl py-4 items-center bg-white border border-line"
        >
          <Text className="font-semibold text-[14px]" style={{ color: theme.accent600 }}>
            Keluar
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
