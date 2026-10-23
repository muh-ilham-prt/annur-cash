import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MasjidPattern } from "./MasjidPattern";
import { Icon } from "./Icon";
import { TENANTS, TENANT } from "../theme/tenant";

const SHOW_MS = 2200;
const FADE_MS = 450;

// In-app splash: brand lockup over the forest gradient, then fades to the router.
// ponytail: native launch image is still Expo's default; regenerate assets/splash-icon.png from this lockup.
export function Splash({ onDone }: { onDone: () => void }) {
  const theme = TENANTS[TENANT];
  const opacity = useRef(new Animated.Value(1)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rise = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const sequence = Animated.parallel([
      rise(logo, 0),
      rise(text, 300),
      Animated.timing(progress, {
        toValue: 1,
        duration: SHOW_MS - 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]);
    sequence.start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(onDone);
    }, SHOW_MS);
    return () => {
      clearTimeout(timer);
      sequence.stop();
    };
  }, [opacity, logo, text, progress, onDone]);

  const rise = (value: Animated.Value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  return (
    <Animated.View style={{ position: "absolute", inset: 0, opacity, zIndex: 70 }} pointerEvents="none">
      <LinearGradient
        colors={[theme.brand700, theme.brand900, theme.brand950]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={{ flex: 1 }}
      >
        <MasjidPattern opacity={0.09} />
        <View
          className="absolute -left-16 top-24 h-52 w-52 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
        />
        <View
          className="absolute -right-20 bottom-40 h-64 w-64 rounded-full"
          style={{ backgroundColor: theme.glow }}
        />
        <View style={styles.center}>
          <Text className="text-gold-300 text-[24px]">بسم الله الرحمن الرحيم</Text>
          <Animated.View style={[styles.lockup, rise(logo)]}>
            <Icon name={theme.brandIcon} size={56} color={theme.brand700} />
          </Animated.View>
          <Animated.View style={[styles.centerContent, rise(text)]}>
            <Text className="mt-6 text-white text-[30px] font-bold tracking-tight">{theme.name}</Text>
            <Text className="mt-1 text-gold-300 text-[11px] font-bold uppercase tracking-[4px]">
              {theme.school}
            </Text>
          </Animated.View>
        </View>
        <View className="px-12 pb-10">
          <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <Animated.View
              style={{
                height: "100%",
                borderRadius: 999,
                backgroundColor: theme.accent500,
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              }}
            />
          </View>
          <Text className="mt-4 text-center text-white/60 text-[12px]">Menyiapkan data sekolah…</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  centerContent: { alignItems: "center" },
  lockup: {
    marginTop: 24,
    height: 96,
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#fff",
  },
});
