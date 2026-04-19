import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Settings, Camera, Mail, FileText } from "lucide-react-native";
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
import { warmPostsMediaCache } from "@/services/mediaCache";

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

  useEffect(() => {
    if (!user?.sub) return;
    getUserById(user.sub)
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.sub]);

  const fetchPosts = useCallback(
    async (pageNumber: number) => {
      if (!user?.sub || loadingPosts) return;
      setLoadingPosts(true);
      try {
        const data = await listAllPosts({ userId: user.sub, page: pageNumber, limit: 18 });
        const newPosts = data.data ?? [];
        if (pageNumber === 1) setPosts(newPosts);
        else setPosts((prev) => [...prev, ...newPosts]);
        warmPostsMediaCache(newPosts);
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
        warmPostsMediaCache(newPosts);
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
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const uploadData = await awsControllerUploadImage({ image: blob, folder: "avatars" });
      if (!uploadData.url) throw new Error();
      const updatedUser = await updateCurrentUser({ avatarUrl: uploadData.url });
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
    </>
  );
}
