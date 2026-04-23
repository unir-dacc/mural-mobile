import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Settings, Camera, Mail, FileText, Pencil, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import {
  getUserById,
  awsControllerUploadImage,
  updateCurrentUser,
  listAllPosts,
} from "@/api/generated/api";
import { GetUserDto, GetPaginatedPostDtoDataItem } from "@/api/generated/model";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { TopBar } from "@/components/TopBar";
import { UserAvatar } from "@/components/UserAvatar";
import { PostsGrid } from "@/components/PostsGrid";
import { ProfileTabs } from "@/components/ProfileTabs";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<GetUserDto | null>(null);
  const [posts, setPosts] = useState<GetPaginatedPostDtoDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");
  const [taggedPosts, setTaggedPosts] = useState<GetPaginatedPostDtoDataItem[]>([]);
  const [loadingTagged, setLoadingTagged] = useState(false);
  const [taggedPage, setTaggedPage] = useState(1);
  const [taggedHasMore, setTaggedHasMore] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");

  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.sub) return;
    getUserById(user.sub)
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.sub]);

  useEffect(() => {
    if (!profile) return;
    setDraftName(profile.name ?? "");
    setDraftBio(profile.bio ?? "");
  }, [profile]);

  const fetchPosts = useCallback(
    async (pageNumber: number) => {
      if (!user?.sub || loadingPosts) return;
      setLoadingPosts(true);
      try {
        const data = await listAllPosts({ userId: user.sub, page: pageNumber, limit: 18 });
        const newPosts = data.data ?? [];
        if (pageNumber === 1) setPosts(newPosts);
        else setPosts((prev) => [...prev, ...newPosts]);
        setHasMore(data.meta.currentPage < data.meta.lastPage);
      } catch {
        //
      } finally {
        setLoadingPosts(false);
      }
    },
    [user?.sub]
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const fetchTaggedPosts = useCallback(
    async (pageNumber: number) => {
      if (!profile?.name || loadingTagged) return;
      setLoadingTagged(true);
      try {
        const data = await listAllPosts({ search: profile.name, page: pageNumber, limit: 18 });
        const newPosts = data.data ?? [];
        if (pageNumber === 1) setTaggedPosts(newPosts);
        else setTaggedPosts((prev) => [...prev, ...newPosts]);
        setTaggedHasMore(data.meta.currentPage < data.meta.lastPage);
      } catch {
        //
      } finally {
        setLoadingTagged(false);
      }
    },
    [profile?.name]
  );

  useEffect(() => {
    if (activeTab === "tagged" && taggedPosts.length === 0) fetchTaggedPosts(1);
  }, [activeTab]);

  const handleLoadMore = () => {
    if (activeTab === "posts") {
      if (!hasMore || loadingPosts) return;
      const next = page + 1;
      setPage(next);
      fetchPosts(next);
    } else {
      if (!taggedHasMore || loadingTagged) return;
      const next = taggedPage + 1;
      setTaggedPage(next);
      fetchTaggedPosts(next);
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fallbackExtension = asset.uri.split(".").pop() ?? "jpg";
      const mimeType = asset.mimeType ?? "image/jpeg";
      const fileName = asset.fileName ?? `avatar.${fallbackExtension}`;

      const uploadData = await awsControllerUploadImage({
        image: {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob,
        folder: "avatars",
      });
      if (!uploadData.url) throw new Error();
      const updatedUser = await updateCurrentUser({ avatarUrl: uploadData.url });
      setProfile(updatedUser);
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar a foto de perfil. Tente novamente.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openEditModal = useCallback(() => {
    if (!profile) return;
    setDraftName(profile.name ?? "");
    setDraftBio(profile.bio ?? "");
    setEditModalVisible(true);
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    const trimmedName = draftName.trim();
    const trimmedBio = draftBio.trim();

    if (trimmedName.length < 2) {
      Alert.alert("Atenção", "O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateCurrentUser({
        name: trimmedName,
        bio: trimmedBio || undefined,
      });
      setProfile(updatedUser);
      setEditModalVisible(false);
      Alert.alert("Perfil atualizado", "Suas informações foram salvas com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o perfil. Tente novamente.");
    } finally {
      setSavingProfile(false);
    }
  }, [draftBio, draftName]);

  if (loading) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
      >
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#111"} />
      </View>
    );
  }

  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const modalBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const inputBg = isDarkMode ? "bg-gray-900" : "bg-gray-50";
  const inputBorder = isDarkMode ? "border-gray-700" : "border-gray-200";

  const header = (
    <View className={isDarkMode ? "bg-gray-900" : "bg-gray-100"}>
      <TopBar
        title="Perfil"
        right={
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <Settings size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
          </TouchableOpacity>
        }
      />

      <View className={`p-5 mb-2 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <View className="flex-row items-center gap-5 mb-4">
          {/* Avatar editável */}
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
            <View
              className={`w-20 h-20 rounded-full overflow-hidden items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
            >
              {uploadingAvatar ? (
                <ActivityIndicator color={isDarkMode ? "#fff" : "#111"} />
              ) : (
                <UserAvatar name={profile?.name} avatarUrl={profile?.avatarUrl} size="xl" />
              )}
            </View>
            {!uploadingAvatar && (
              <View
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-indigo-600 items-center justify-center border-2"
                style={{ borderColor: isDarkMode ? "#1f2937" : "#ffffff" }}
              >
                <Camera size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {/* Stats */}
          <View className="flex-1 flex-row justify-around">
            <View className="items-center">
              <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {posts.length}
              </Text>
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Posts
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className={`font-bold text-base mb-0.5 ${textPrimary}`}>
              {profile?.name ?? "—"}
            </Text>
            {profile?.bio ? (
              <Text className={`text-sm leading-5 mb-3 ${textSecondary}`}>{profile.bio}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={openEditModal}
            activeOpacity={0.7}
            className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <Pencil size={16} color={isDarkMode ? "#f9fafb" : "#111827"} />
          </TouchableOpacity>
        </View>

        <View className="mt-3 gap-2">
          <View className="flex-row items-center gap-2">
            <Mail size={14} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
            <Text className={`text-sm ${textSecondary}`}>{profile?.email}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <FileText size={14} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
            <Text className={`text-sm ${textSecondary}`}>{profile?.cpf}</Text>
          </View>
        </View>
      </View>

      <ProfileTabs active={activeTab} onChange={setActiveTab} />
    </View>
  );

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <PostsGrid
        posts={activeTab === "posts" ? posts : taggedPosts}
        loading={activeTab === "posts" ? loadingPosts : loadingTagged}
        onLoadMore={handleLoadMore}
        header={header}
        emptyText={activeTab === "posts" ? "Nenhum post ainda" : "Nenhuma menção encontrada"}
      />

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/50 px-4"
        >
          <View
            className={`rounded-3xl p-5 ${modalBg}`}
            style={{ elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className={`text-lg font-bold ${textPrimary}`}>Editar perfil</Text>
                <Text className={`text-sm mt-1 ${textSecondary}`}>
                  Atualize seu nome e sua biografia.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} activeOpacity={0.7}>
                <X size={20} color={isDarkMode ? "#f9fafb" : "#111827"} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Nome</Text>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Seu nome"
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                  className={`rounded-2xl border px-4 py-3 text-sm ${textPrimary} ${inputBg} ${inputBorder}`}
                />
              </View>

              <View>
                <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Bio</Text>
                <TextInput
                  value={draftBio}
                  onChangeText={setDraftBio}
                  placeholder="Conte um pouco sobre você"
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                  multiline
                  textAlignVertical="top"
                  className={`min-h-[120px] rounded-2xl border px-4 py-3 text-sm ${textPrimary} ${inputBg} ${inputBorder}`}
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                disabled={savingProfile}
                className={`flex-1 rounded-2xl border py-3 items-center ${inputBorder}`}
              >
                <Text className={`text-sm font-semibold ${textPrimary}`}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={savingProfile}
                className={`flex-1 rounded-2xl py-3 items-center ${
                  savingProfile ? "bg-indigo-400" : "bg-indigo-600"
                }`}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
