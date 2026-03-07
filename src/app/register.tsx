import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { createUser } from "@/api/generated/api";

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const router = useRouter();

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bg = isDarkMode ? "bg-gray-900" : "bg-gray-100";
  const card = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const labelStyle = `text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputStyle = {
    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
    color: isDarkMode ? "#f9fafb" : "#111827",
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleRegister = async () => {
    const rawCpf = cpf.replace(/\D/g, "");

    if (!name.trim() || name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return;
    }
    if (rawCpf.length !== 11) {
      setError("CPF inválido");
      return;
    }
    if (!email.trim()) {
      setError("Digite um e-mail válido");
      return;
    }
    if (!password || password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createUser({
        name: name.trim(),
        cpf: rawCpf,
        email: email.trim(),
        bio: bio.trim() || undefined,
        password,
      });
      setSuccess(true);
    } catch {
      setError("Não foi possível criar a conta. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${bg}`}>
        <Text className="text-4xl mb-4">🎉</Text>
        <Text className={`text-xl font-bold mb-2 text-center ${textPrimary}`}>Conta criada!</Text>
        <Text className={`text-sm text-center mb-8 ${textSecondary}`}>
          Sua conta foi criada com sucesso. Faça login para continuar.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          className="rounded-xl py-4 px-8 items-center"
          style={{ backgroundColor: "#4f46e5" }}
        >
          <Text className="text-white font-semibold text-base">Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${bg}`}
    >
      {/* Top Bar */}
      <View
        className={`pt-14 px-4 pb-3 flex-row items-center ${card}`}
        style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
        </TouchableOpacity>
        <Text className={`text-lg font-bold ${textPrimary}`}>Criar conta</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className={labelStyle}>Nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Seu nome completo"
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            style={inputStyle}
            className="rounded-xl px-4 py-3 text-base"
          />
        </View>

        <View>
          <Text className={labelStyle}>CPF</Text>
          <TextInput
            value={cpf}
            onChangeText={(v) => setCpf(formatCpf(v))}
            placeholder="000.000.000-00"
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            keyboardType="number-pad"
            style={inputStyle}
            className="rounded-xl px-4 py-3 text-base"
          />
        </View>

        <View>
          <Text className={labelStyle}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
            className="rounded-xl px-4 py-3 text-base"
          />
        </View>

        <View>
          <Text className={labelStyle}>
            Bio <Text className={textSecondary}>(opcional)</Text>
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Fale um pouco sobre você"
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            multiline
            numberOfLines={3}
            style={[inputStyle, { textAlignVertical: "top" }]}
            className="rounded-xl px-4 py-3 text-base"
          />
        </View>

        <View>
          <Text className={labelStyle}>Senha</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            style={inputStyle}
            className="rounded-xl px-4 py-3 text-base"
          />
        </View>

        <View>
          <Text className={labelStyle}>Confirmar senha</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Repita a senha"
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            style={inputStyle}
            className="rounded-xl px-4 py-3 text-base"
          />
        </View>

        {error && <Text className="text-red-500 text-sm text-center">{error}</Text>}

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className="rounded-xl py-4 items-center justify-center mt-2"
          style={{ backgroundColor: "#4f46e5" }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Criar conta</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
