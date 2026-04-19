import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { getUserById, listAllPosts } from "@/api/generated/api";
import { GetUserDto, GetPaginatedPostDtoDataItem } from "@/api/generated/model";
import { useTheme } from "@/context/ThemeContext";
import { TopBar } from "@/components/TopBar";
import { UserAvatar } from "@/components/UserAvatar";
import { PostsGrid } from "@/components/PostsGrid";
import { ProfileTabs } from "@/components/ProfileTabs";
import { warmPostsMediaCache } from "@/services/mediaCache";

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDarkMode } = useTheme();

  const [profile, setProfile] = useState<GetUserDto | null>(null);
  const [posts, setPosts] = useState<GetPaginatedPostDtoDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");
  const [taggedPosts, setTaggedPosts] = useState<GetPaginatedPostDtoDataItem[]>([]);
  const [loadingTagged, setLoadingTagged] = useState(false);
  const [taggedPage, setTaggedPage] = useState(1);
  const [taggedHasMore, setTaggedHasMore] = useState(true);

  useEffect(() => {
    if (!id) return;
    getUserById(id)
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const fetchPosts = useCallback(
    async (pageNumber: number) => {
      if (!id || loadingPosts) return;
      setLoadingPosts(true);
      try {
        const data = await listAllPosts({ userId: id, page: pageNumber, limit: 18 });
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
    [id]
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
      <TopBar title={profile?.name ?? "Usuário"} />

      <View className={`p-5 mb-2 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <View className="flex-row items-center gap-5 mb-4">
          <UserAvatar name={profile?.name} avatarUrl={profile?.avatarUrl} size="xl" />

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
          <Text className={`text-sm leading-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {profile.bio}
          </Text>
        ) : null}
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
