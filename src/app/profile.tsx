import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  User,
  Mail,
  FileText,
  ArrowLeft,
  Camera,
  Grid2x2,
  UserCheck,
  Settings,
} from "lucide-react-native";
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

const GRID_GAP = 2;

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

  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const thumbSize = (width - GRID_GAP * 2) / 3;

  useEffect(() => {
    if (!user?.sub) return;
    getUserById(user.sub)
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.sub]);

  const fetchPosts = useCallback(
    async (pageNumber: number) => {
      if (!user?.sub || loadingPosts) return;
      setLoadingPosts(true);
      try {
        const { data } = await listAllPosts({ userId: user.sub, page: pageNumber, limit: 18 });
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
        const { data } = await listAllPosts({ search: profile.name, page: pageNumber, limit: 18 });
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingAvatar(true);

    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const { data: uploadData } = await awsControllerUploadImage({
        image: blob,
        folder: "avatars",
      });
      if (!uploadData.url) throw new Error();
      const { data: updatedUser } = await updateCurrentUser({ avatarUrl: uploadData.url });
      setProfile(updatedUser);
    } catch {
      //
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
      >
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#111"} />
      </View>
    );
  }

  const Header = (
    <View className={isDarkMode ? "bg-gray-900" : "bg-gray-100"}>
      {/* Top Bar */}
      <View
        className={`pt-14 px-4 pb-3 flex-row items-center justify-between ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        style={{ elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
        </TouchableOpacity>
        <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Perfil
        </Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Settings size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
        </TouchableOpacity>
      </View>

      {/* Info do perfil */}
      <View className={`p-5 mb-2 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        {/* Avatar + stats */}
        <View className="flex-row items-center gap-5 mb-4">
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
            <View
              className={`w-20 h-20 rounded-full overflow-hidden items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
            >
              {uploadingAvatar ? (
                <ActivityIndicator color={isDarkMode ? "#fff" : "#111"} />
              ) : profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} className="w-20 h-20" />
              ) : (
                <User size={36} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
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

        {/* Nome e bio */}
        <Text
          className={`font-bold text-base mb-0.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          {profile?.name ?? "—"}
        </Text>
        {profile?.bio ? (
          <Text
            className={`text-sm leading-5 mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {profile.bio}
          </Text>
        ) : null}

        {/* Dados */}
        <View className="mt-3 gap-2">
          <View className="flex-row items-center gap-2">
            <Mail size={14} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {profile?.email}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <FileText size={14} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {profile?.cpf}
            </Text>
          </View>
        </View>
      </View>

      {/* Abas */}
      <View
        className={`flex-row border-b ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("posts")}
          className="flex-1 items-center py-3"
          style={{
            borderBottomWidth: 2,
            borderBottomColor: activeTab === "posts" ? "#4f46e5" : "transparent",
          }}
        >
          <Grid2x2
            size={20}
            color={activeTab === "posts" ? "#4f46e5" : isDarkMode ? "#9ca3af" : "#6b7280"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("tagged")}
          className="flex-1 items-center py-3"
          style={{
            borderBottomWidth: 2,
            borderBottomColor: activeTab === "tagged" ? "#4f46e5" : "transparent",
          }}
        >
          <UserCheck
            size={20}
            color={activeTab === "tagged" ? "#4f46e5" : isDarkMode ? "#9ca3af" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const currentPosts = activeTab === "posts" ? posts : taggedPosts;
  const isLoadingCurrent = activeTab === "posts" ? loadingPosts : loadingTagged;

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <FlatList
        data={currentPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={Header}
        columnWrapperStyle={{ gap: GRID_GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        className={isDarkMode ? "bg-gray-900" : "bg-gray-100"}
        ListFooterComponent={
          isLoadingCurrent ? (
            <ActivityIndicator className="py-5" color={isDarkMode ? "#9ca3af" : "#6b7280"} />
          ) : null
        }
        ListEmptyComponent={
          !isLoadingCurrent ? (
            <View className="items-center py-10">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {activeTab === "posts" ? "Nenhum post ainda" : "Nenhuma menção encontrada"}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const thumb = item.thumbnailUrl ?? item.Media?.[0]?.imageUrl;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/post/${item.id}`)}
              style={{ width: thumbSize, height: thumbSize }}
            >
              {thumb ? (
                <Image
                  source={{ uri: thumb }}
                  style={{ width: thumbSize, height: thumbSize }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{ width: thumbSize, height: thumbSize }}
                  className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}
                />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}
