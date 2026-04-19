import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onPress?: () => void;
}

const sizeMap = {
  sm: { container: "w-7 h-7", size: 28, text: "text-xs" },
  md: { container: "w-9 h-9", size: 36, text: "text-sm" },
  lg: { container: "w-14 h-14", size: 56, text: "text-lg" },
  xl: { container: "w-20 h-20", size: 80, text: "text-2xl" },
};

export function UserAvatar({ name, avatarUrl, size = "md", onPress }: UserAvatarProps) {
  const { isDarkMode } = useTheme();
  const s = sizeMap[size];

  const content = (
    <View
      className={`${s.container} rounded-full overflow-hidden items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: s.size, height: s.size }} />
      ) : (
        <Text className={`${s.text} font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
}
