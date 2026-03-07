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
import { ArrowLeft } from "lucide-react-native";
import { recoverPassword, resetPassword } from "@/api/generated/api";

type Step = "email" | "code";

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bg = isDarkMode ? "bg-gray-900" : "bg-gray-100";
  const card = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const inputStyle = {
    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
    color: isDarkMode ? "#f9fafb" : "#111827",
  };

  const handleRequestCode = async () => {
    if (!email.trim()) {
      setError("Digite seu e-mail");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await recoverPassword({ email: email.trim() });
      setStep("code");
    } catch {
      setError("Não foi possível enviar o código. Verifique o e-mail informado.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      setError("Digite o código recebido");
      return;
    }
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      setSuccess(true);
    } catch {
      setError("Código inválido ou expirado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${bg}`}>
        <Text className="text-4xl mb-4">✅</Text>
        <Text className={`text-xl font-bold mb-2 text-center ${textPrimary}`}>
          Senha redefinida!
        </Text>
        <Text className={`text-sm text-center mb-8 ${textSecondary}`}>
          Sua senha foi alterada com sucesso. Faça login com a nova senha.
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
        <Text className={`text-lg font-bold ${textPrimary}`}>Redefinir senha</Text>
      </View>

      <View className="flex-1 px-6 pt-10 gap-6">
        <View className="gap-1">
          <Text className={`text-2xl font-bold ${textPrimary}`}>
            {step === "email" ? "Esqueceu a senha?" : "Verifique seu e-mail"}
          </Text>
          <Text className={`text-sm leading-6 ${textSecondary}`}>
            {step === "email"
              ? "Digite seu e-mail para receber um código de recuperação."
              : `Enviamos um código para ${email}. Digite abaixo junto com sua nova senha.`}
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className={`text-sm font-medium mb-1 ${textSecondary}`}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="seu@email.com"
              placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
              editable={step === "email"}
              style={[inputStyle, { opacity: step === "code" ? 0.5 : 1 }]}
              className="rounded-xl px-4 py-3 text-base"
            />
          </View>

          {step === "code" && (
            <>
              <View>
                <Text className={`text-sm font-medium mb-1 ${textSecondary}`}>
                  Código de verificação
                </Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Digite o código recebido"
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                  keyboardType="number-pad"
                  style={inputStyle}
                  className="rounded-xl px-4 py-3 text-base"
                />
              </View>

              <View>
                <Text className={`text-sm font-medium mb-1 ${textSecondary}`}>Nova senha</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                  style={inputStyle}
                  className="rounded-xl px-4 py-3 text-base"
                />
              </View>

              <View>
                <Text className={`text-sm font-medium mb-1 ${textSecondary}`}>
                  Confirmar nova senha
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Repita a nova senha"
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                  style={inputStyle}
                  className="rounded-xl px-4 py-3 text-base"
                />
              </View>
            </>
          )}

          {error && <Text className="text-red-500 text-sm text-center">{error}</Text>}

          <TouchableOpacity
            onPress={step === "email" ? handleRequestCode : handleResetPassword}
            disabled={loading}
            className="rounded-xl py-4 items-center justify-center"
            style={{ backgroundColor: "#4f46e5" }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {step === "email" ? "Enviar código" : "Redefinir senha"}
              </Text>
            )}
          </TouchableOpacity>

          {step === "code" && (
            <TouchableOpacity
              onPress={() => {
                setStep("email");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
              }}
              className="items-center py-2"
            >
              <Text className={`text-sm ${textSecondary}`}>
                Não recebeu o código? <Text style={{ color: "#4f46e5" }}>Reenviar</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
