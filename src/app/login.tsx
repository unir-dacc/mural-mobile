import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Preencha todos os campos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ identifier: identifier.trim(), password });
    } catch {
      setError("Credenciais inválidas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
    >
      <View className="flex-1 justify-center px-6">
        {/* Título */}
        <View className="mb-10 items-center">
          <Text
            className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Mural de Fotos
          </Text>
          <Text className={`text-sm ${textSecondary}`}>Ciência da Computação — UNIR</Text>
        </View>

        {/* Formulário */}
        <View className="gap-4">
          <View>
            <Text
              className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              E-mail
            </Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Digite seu identificador"
              placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
              className={`rounded-xl px-4 py-3 text-base ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
            />
          </View>

          <View>
            <Text
              className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Senha
            </Text>
            <View
              className={`flex-row items-center rounded-xl px-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                className={`flex-1 py-3 text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} className="pl-2">
                {showPassword ? (
                  <EyeOff size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                ) : (
                  <Eye size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Esqueceu a senha */}
          <TouchableOpacity onPress={() => router.push("/reset-password")} className="items-end">
            <Text style={{ color: "#4f46e5" }} className="text-sm">
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>

          {error && <Text className="text-red-500 text-sm text-center">{error}</Text>}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="rounded-xl py-4 items-center justify-center mt-2"
            style={{ backgroundColor: "#4f46e5" }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            className="rounded-xl py-4 items-center justify-center border"
            style={{ borderColor: "#4f46e5" }}
          >
            <Text style={{ color: "#4f46e5" }} className="font-semibold text-base">
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
