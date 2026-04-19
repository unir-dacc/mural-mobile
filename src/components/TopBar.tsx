import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function TopBar({ title, onBack, left, right }: TopBarProps) {
  const { isDarkMode } = useTheme();
  const router = useRouter();

  return (
    <View
      className={`pt-14 px-4 pb-3 flex-row items-center justify-between ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
      style={{ elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 }}
    >
      <View style={{ minWidth: 22, justifyContent: "center" }}>
        {left ?? (
          <TouchableOpacity onPress={onBack ?? (() => router.back())}>
            <ArrowLeft size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
          </TouchableOpacity>
        )}
      </View>
      <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </Text>
      <View style={{ minWidth: 22, alignItems: "flex-end", justifyContent: "center" }}>
        {right ?? null}
      </View>
    </View>
  );
}
