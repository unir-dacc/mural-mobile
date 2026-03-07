import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Grid2x2, UserCheck } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Tab = "posts" | "tagged";

interface ProfileTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function ProfileTabs({ active, onChange }: ProfileTabsProps) {
  const { isDarkMode } = useTheme();

  return (
    <View
      className={`flex-row border-b ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <TouchableOpacity
        onPress={() => onChange("posts")}
        className="flex-1 items-center py-3"
        style={{
          borderBottomWidth: 2,
          borderBottomColor: active === "posts" ? "#4f46e5" : "transparent",
        }}
      >
        <Grid2x2
          size={20}
          color={active === "posts" ? "#4f46e5" : isDarkMode ? "#9ca3af" : "#6b7280"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange("tagged")}
        className="flex-1 items-center py-3"
        style={{
          borderBottomWidth: 2,
          borderBottomColor: active === "tagged" ? "#4f46e5" : "transparent",
        }}
      >
        <UserCheck
          size={20}
          color={active === "tagged" ? "#4f46e5" : isDarkMode ? "#9ca3af" : "#6b7280"}
        />
      </TouchableOpacity>
    </View>
  );
}
