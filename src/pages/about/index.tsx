import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MasjidPattern } from "../../components/MasjidPattern";
import Constants from "expo-constants";
import { TENANTS, TENANT } from "../../theme/tenant";
import { Icon } from "../../components/Icon";

export default function AboutPage({ onBack }: { onBack: () => void }) {
  const theme = TENANTS[TENANT];
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-cream">
      <LinearGradient colors={[theme.brand700, theme.brand950]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" }}>
        <MasjidPattern />
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kembali" className="h-10 w-10 items-center justify-center rounded-2xl bg-forest-800">
            <Icon name="chevron-left" size={24} color="#fff" />
          </Pressable>
          <Text className="flex-1 text-[20px] font-bold text-white">Tentang aplikasi</Text>
          <Icon name="information-outline" size={25} color="#ecb94a" />
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View className="items-center rounded-3xl border border-forest-100 bg-white p-7">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-forest-100">
            <Icon name={theme.brandIcon} size={58} color={theme.brand700} />
          </View>
          <Text className="mt-5 text-[24px] font-extrabold text-forest-900">{theme.name}</Text>
          <Text className="mt-1 text-[13px] text-slate-500">Aplikasi kas sekolah</Text>
          <View className="mt-4 rounded-full bg-gold-200 px-4 py-1.5"><Text className="text-[12px] font-bold text-forest-800">Versi {Constants.expoConfig?.version ?? "—"}</Text></View>
        </View>
        <View className="mt-4 rounded-2xl border border-forest-100 bg-white p-5">
          <Text className="text-[15px] font-bold text-forest-900">Tentang aplikasi</Text>
          <Text className="mt-2 text-[13px] leading-5 text-slate-500">Kelola pembayaran siswa, jenis tagihan, bukti pembayaran, dan laporan kas sekolah dalam satu aplikasi.</Text>
        </View>
        <Text className="mt-6 text-center text-[11px] text-slate-400">Dibuat untuk pengelolaan kas sekolah yang lebih tertib.</Text>
      </ScrollView>
    </View>
  );
}
