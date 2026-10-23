import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TenantTheme } from "../theme/tenant";
import { Icon } from "./Icon";

interface TopbarProps {
  theme: TenantTheme;
  onPressNotifications?: () => void;
  onPressAvatar?: () => void;
}

export function Topbar({ theme, onPressNotifications, onPressAvatar }: TopbarProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void AsyncStorage.getItem("name").then((savedName) => {
        if (active) setName(savedName?.trim() ?? "");
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <View
      className="flex-row items-center justify-between"
      style={{ paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 24 }}
    >
      <View className="flex-row items-center gap-2">
        <Icon name={theme.brandIcon} size={22} color={theme.accent600} />
        <Text className="text-ink text-[14px] font-semibold tracking-tight">{theme.name}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        {onPressNotifications && (
          <Pressable
            onPress={onPressNotifications}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Icon name="bell-outline" size={20} color={theme.accent600} />
          </Pressable>
        )}
        <Pressable
          onPress={onPressAvatar}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: theme.accent500 }}
        >
          <Text className="text-[12px] font-semibold text-white">{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}
