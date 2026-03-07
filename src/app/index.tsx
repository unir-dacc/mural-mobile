import React, { useState, useEffect } from "react";
import { View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { listAllPosts } from "@/api/generated/api";
import { GetPostDto, ListAllPostsParams } from "@/api/generated/model";
import { MasonryGrid } from "@/components/MasonryGrid";

export default function HomeScreen() {
  const [posts, setPosts] = useState<GetPostDto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const fetchPosts = async (pageNumber: number): Promise<void> => {
    if (loading) return;
    setLoading(true);
    try {
      const params: ListAllPostsParams = { page: pageNumber, limit: 10 };
      const { data: response } = await listAllPosts(params);
      setPosts((prev) => [...prev, ...response.data]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const loadMorePosts = () => {
    if (!loading) setPage((prev) => prev + 1);
  };

  const handlePressItem = () => {};

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <MasonryGrid
          posts={posts}
          loading={loading}
          onLoadMore={loadMorePosts}
          onPressItem={handlePressItem}
        />
      </View>
    </>
  );
}
