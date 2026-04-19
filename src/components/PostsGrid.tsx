import React from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Text,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { GetPaginatedPostDtoDataItem } from "@/api/generated/model";
import { useTheme } from "@/context/ThemeContext";
import { CachedImage } from "@/components/CachedImage";

const GRID_GAP = 2;

interface PostsGridProps {
  posts: GetPaginatedPostDtoDataItem[];
  loading: boolean;
  onLoadMore: () => void;
  header?: React.ReactElement;
  emptyText?: string;
}

export function PostsGrid({
  posts,
  loading,
  onLoadMore,
  header,
  emptyText = "Nenhum post ainda",
}: PostsGridProps) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const thumbSize = (width - GRID_GAP * 2) / 3;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      ListHeaderComponent={header}
      columnWrapperStyle={{ gap: GRID_GAP }}
      ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      className={isDarkMode ? "bg-gray-900" : "bg-gray-100"}
      ListFooterComponent={
        loading ? (
          <ActivityIndicator className="py-5" color={isDarkMode ? "#9ca3af" : "#6b7280"} />
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <View className="items-center py-10">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {emptyText}
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
              <CachedImage
                uri={thumb}
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
  );
}
