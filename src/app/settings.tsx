import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ArrowLeft, Sun, Moon, Smartphone, LogOut, Check } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemePreference } from "@/context/ThemeContext";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { preference, isDarkMode, setPreference } = useTheme();
  const router = useRouter();

  const iconColor = (value: ThemePreference) =>
    preference === value ? "#4f46e5" : isDarkMode ? "#9ca3af" : "#6b7280";

  const themeOptions: { label: string; value: ThemePreference; icon: React.ReactNode }[] = [
    { label: "Claro", value: "light", icon: <Sun size={20} color={iconColor("light")} /> },
    { label: "Escuro", value: "dark", icon: <Moon size={20} color={iconColor("dark")} /> },
    {
      label: "Sistema",
      value: "system",
      icon: <Smartphone size={20} color={iconColor("system")} />,
    },
  ];

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        {/* Top Bar */}
        <View
          className={`pt-14 px-4 pb-3 flex-row items-center gap-3 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          style={{ elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Configurações
          </Text>
        </View>

        <View className="p-4 gap-4">
          {/* Aparência */}
          <View
            className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <Text
              className={`px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Aparência
            </Text>

            {themeOptions.map((option, index) => (
              <React.Fragment key={option.value}>
                <TouchableOpacity
                  onPress={() => setPreference(option.value)}
                  className="flex-row items-center px-4 py-3 gap-3"
                >
                  {option.icon}
                  <Text
                    className={`flex-1 text-base ${
                      preference === option.value
                        ? "text-indigo-600 font-semibold"
                        : isDarkMode
                          ? "text-white"
                          : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {preference === option.value && <Check size={18} color="#4f46e5" />}
                </TouchableOpacity>

                {index < themeOptions.length - 1 && (
                  <View className={`h-px ml-12 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Logout */}
          <View
            className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <TouchableOpacity onPress={logout} className="flex-row items-center px-4 py-3 gap-3">
              <LogOut size={20} color="#ef4444" />
              <Text className="text-red-500 font-semibold text-base">Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}
