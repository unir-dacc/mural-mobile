import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onPress?: () => void;
}

const sizeMap = {
  sm: { container: "w-7 h-7", image: "w-7 h-7", text: "text-xs" },
  md: { container: "w-9 h-9", image: "w-9 h-9", text: "text-sm" },
  lg: { container: "w-14 h-14", image: "w-14 h-14", text: "text-lg" },
  xl: { container: "w-20 h-20", image: "w-20 h-20", text: "text-2xl" },
};

export function UserAvatar({ name, avatarUrl, size = "md", onPress }: UserAvatarProps) {
  const { isDarkMode } = useTheme();
  const s = sizeMap[size];

  const content = (
    <View
      className={`${s.container} rounded-full overflow-hidden items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className={s.image} />
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
