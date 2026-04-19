import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  X,
  ImagePlus,
  GripVertical,
  Send,
  ChevronLeft,
  Film,
  ImageIcon,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { TopBar } from "@/components/TopBar";
import { createPost } from "@/api/generated/api";
import type { CreatePostBody } from "@/api/generated/model/createPostBody";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type MediaType = "image" | "video";

interface MediaPreview {
  id: string;
  uri: string;
  type: MediaType;
  fileName?: string;
  mimeType?: string;
}

// ─────────────────────────────────────────────
// MediaCard
// ─────────────────────────────────────────────

interface MediaCardProps {
  media: MediaPreview;
  index: number;
  total: number;
  isDarkMode: boolean;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const MediaVideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: 192 }}
      contentFit="contain"
      nativeControls
    />
  );
};

const MediaCard: React.FC<MediaCardProps> = ({
  media,
  index,
  total,
  isDarkMode,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const isVideo = media.type === "video";

  return (
    <View
      className={`rounded-2xl border mb-3 overflow-hidden ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Card header */}
      <View
        className={`flex-row items-center justify-between px-3 py-2 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Left: grip + badge + index */}
        <View className="flex-row items-center gap-1.5">
          <GripVertical size={16} color={isDarkMode ? "#9ca3af" : "#6b7280"} />

          <View
            className={`flex-row items-center gap-1 rounded-lg px-2 py-0.5 ${
              isVideo
                ? isDarkMode
                  ? "bg-indigo-950"
                  : "bg-violet-100"
                : isDarkMode
                  ? "bg-green-950"
                  : "bg-green-100"
            }`}
          >
            {isVideo ? (
              <Film size={12} color={isDarkMode ? "#a5b4fc" : "#7c3aed"} />
            ) : (
              <ImageIcon size={12} color={isDarkMode ? "#86efac" : "#16a34a"} />
            )}
            <Text
              className={`text-xs font-semibold ${
                isVideo
                  ? isDarkMode
                    ? "text-indigo-300"
                    : "text-violet-700"
                  : isDarkMode
                    ? "text-green-300"
                    : "text-green-700"
              }`}
            >
              {isVideo ? "Vídeo" : "Imagem"}
            </Text>
          </View>

          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            #{index + 1}
          </Text>
        </View>

        {/* Right: order arrows + remove */}
        <View className="flex-row items-center gap-1.5">
          {total > 1 && (
            <>
              <TouchableOpacity
                onPress={() => onMoveUp(index)}
                disabled={index === 0}
                className={index === 0 ? "opacity-30 p-1" : "opacity-100 p-1"}
              >
                <Text className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ↑
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMoveDown(index)}
                disabled={index === total - 1}
                className={index === total - 1 ? "opacity-30 p-1" : "opacity-100 p-1"}
              >
                <Text className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ↓
                </Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => onRemove(media.id)}
            className="bg-red-500 rounded-lg p-1.5"
          >
            <X size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Media preview */}
      <View className="h-48">
        {isVideo ? (
          <MediaVideoPreview uri={media.uri} />
        ) : (
          <Image
            source={{ uri: media.uri }}
            style={{ width: "100%", height: 192 }}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

const EmptyMedia: React.FC<{ isDarkMode: boolean; onPick: () => void }> = ({
  isDarkMode,
  onPick,
}) => (
  <TouchableOpacity
    onPress={onPick}
    activeOpacity={0.7}
    className={`h-44 rounded-2xl border-2 border-dashed items-center justify-center gap-2 ${
      isDarkMode ? "border-gray-700" : "border-gray-300"
    }`}
  >
    <View
      className={`w-14 h-14 rounded-full items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
    >
      <ImagePlus size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
    </View>
    <Text className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
      Nenhuma mídia selecionada
    </Text>
    <Text className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
      Toque para adicionar imagens ou vídeos
    </Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function CreatePostScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [mediaList, setMediaList] = useState<MediaPreview[]>([]);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Pick media ──

  const pickMedia = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria para selecionar mídias.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.85,
      orderedSelection: true,
    });

    if (result.canceled) return;

    const newMedia: MediaPreview[] = result.assets.map((asset) => ({
      id: Math.random().toString(36).slice(2),
      uri: asset.uri,
      type: asset.type === "video" ? "video" : "image",
      fileName: asset.fileName ?? undefined,
      mimeType: asset.mimeType ?? undefined,
    }));

    setMediaList((prev) => [...prev, ...newMedia]);
  }, []);

  // ── Reorder ──

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setMediaList((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setMediaList((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const removeMedia = useCallback((id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── Submit ──

  const handleSubmit = useCallback(async () => {
    if (!mediaList.length) {
      Alert.alert("Atenção", "Adicione pelo menos uma mídia.");
      return;
    }
    if (!caption.trim()) {
      Alert.alert("Atenção", "Escreva uma legenda para o post.");
      return;
    }

    setSubmitting(true);
    try {
      const body: CreatePostBody = {
        caption: caption.trim(),
        public: isPublic,
        media: mediaList.map((media) => {
          const ext = media.uri.split(".").pop() ?? "jpg";
          const mime = media.mimeType ?? (media.type === "video" ? "video/mp4" : "image/jpeg");
          return {
            uri: media.uri,
            name: media.fileName ?? `media_${media.id}.${ext}`,
            type: mime,
          } as unknown as Blob;
        }),
      };

      await createPost(body);

      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível publicar o post. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }, [mediaList, caption, isPublic, router]);

  const canSubmit = mediaList.length > 0 && caption.trim().length > 0 && !submitting;

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <TopBar
          title="Novo Post"
          left={
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <ChevronLeft size={24} color={isDarkMode ? "#f9fafb" : "#111827"} />
            </TouchableOpacity>
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Caption card ── */}
          <View
            className={`rounded-2xl border p-4 mb-3 ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Legenda
            </Text>

            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Escreva uma legenda para este post..."
              placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={`rounded-xl p-3 text-sm min-h-20 ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
              }`}
            />

            {/* ── Public toggle ── */}
            <View
              className={`flex-row items-center justify-between mt-3.5 pt-3.5 border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <View>
                <Text
                  className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Post público
                </Text>
                <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Visível para todos os usuários
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: isDarkMode ? "#374151" : "#d1d5db", true: "#4f46e5" }}
                thumbColor={isPublic ? "#fff" : isDarkMode ? "#9ca3af" : "#fff"}
              />
            </View>
          </View>

          {/* ── Add media button ── */}
          <TouchableOpacity
            onPress={pickMedia}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center gap-2 rounded-xl py-3.5 mb-4 border ${
              isDarkMode ? "bg-indigo-950 border-indigo-700" : "bg-indigo-50 border-indigo-200"
            }`}
          >
            <ImagePlus size={18} color={isDarkMode ? "#a5b4fc" : "#4f46e5"} />
            <Text
              className={`text-sm font-bold ${isDarkMode ? "text-indigo-300" : "text-indigo-600"}`}
            >
              {mediaList.length === 0 ? "Selecionar mídias" : "Adicionar mais mídias"}
            </Text>
          </TouchableOpacity>

          {/* ── Media list ── */}
          {mediaList.length === 0 ? (
            <EmptyMedia isDarkMode={isDarkMode} onPick={pickMedia} />
          ) : (
            <>
              <Text
                className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {mediaList.length} {mediaList.length === 1 ? "mídia" : "mídias"} · use ↑↓ para
                reordenar
              </Text>
              {mediaList.map((media, index) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  index={index}
                  total={mediaList.length}
                  isDarkMode={isDarkMode}
                  onRemove={removeMedia}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </>
          )}

          {/* ── Submit button ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            className={`mt-2 rounded-2xl py-4 flex-row items-center justify-center gap-2 ${
              canSubmit ? "bg-indigo-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={18} color={canSubmit ? "#fff" : isDarkMode ? "#6b7280" : "#9ca3af"} />
                <Text
                  className={`text-sm font-bold ${
                    canSubmit ? "text-white" : isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {mediaList.length > 0
                    ? `Publicar com ${mediaList.length} ${mediaList.length === 1 ? "mídia" : "mídias"}`
                    : "Publicar"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
