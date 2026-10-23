import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TenantTheme } from "../theme/tenant";
import { Icon } from "./Icon";

interface ToastProps {
  theme: TenantTheme;
  message: string | null;
  status?: "success" | "error";
  /** Called after the toast auto-dismisses so the parent can clear its message. */
  onHide?: () => void;
}

export function Toast({ theme, message, status = "success", onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  const hide = useRef<() => void>(() => {});
  hide.current = onHide ?? (() => {});
  useEffect(() => {
    Animated.timing(progress, {
      toValue: message ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    if (!message) return;
    // Auto-dismiss: otherwise the last toast stays pinned until the next one fires.
    const timer = setTimeout(() => hide.current(), 2500);
    return () => clearTimeout(timer);
  }, [message, progress]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={[styles.overlay, { paddingTop: insets.top + 30 }]}>
      <Animated.View
        style={{
          maxWidth: "80%",
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }}
      >
        <View className="flex-row items-center gap-2 rounded-full px-4 py-2.5 shadow-lg bg-white">
          <Icon
            name={status === "success" ? "check-circle" : "alert-circle"}
            size={16}
            color={status === "success" ? theme.accent500 : "#FB7185"}
          />
          <Text className="text-ink text-[13px]">{message}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
});
