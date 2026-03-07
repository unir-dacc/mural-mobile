import React from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  useColorScheme,
} from "react-native";
import { GetPostDto } from "@/api/generated/model";
import { PhotoItem } from "./PhotoItem";
import { SkeletonGrid } from "./SkeletonGrid";

const COLUMN_GAP = 8;
const HORIZONTAL_PADDING = 16;
const MIN_COLUMN_WIDTH = 150;

interface MasonryGridProps {
  posts: GetPostDto[];
  loading: boolean;
  onLoadMore: () => void;
  onPressItem?: (item: GetPostDto) => void;
  header?: React.ReactNode;
}

export function MasonryGrid({ posts, loading, onLoadMore, onPressItem, header }: MasonryGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const numColumns = Math.max(
    2,
    Math.floor(
      (screenWidth - HORIZONTAL_PADDING * 2 + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP)
    )
  );

  const columnWidth =
    (screenWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (numColumns - 1)) / numColumns;

  const columns: GetPostDto[][] = Array.from({ length: numColumns }, () => []);
  posts.forEach((post, i) => {
    columns[i % numColumns].push(post);
  });

  if (loading && posts.length === 0) {
    return (
      <>
        {header}
        <SkeletonGrid numColumns={numColumns} columnWidth={columnWidth} count={numColumns * 4} />
      </>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: HORIZONTAL_PADDING,
        flexDirection: "column",
      }}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
        if (isNearBottom) onLoadMore();
      }}
      scrollEventThrottle={400}
      showsVerticalScrollIndicator={false}
    >
      {/* Header scrolla junto com o grid */}
      {header}

      {/* Grid */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: COLUMN_GAP,
          paddingTop: HORIZONTAL_PADDING,
        }}
      >
        {columns.map((columnPosts, colIndex) => (
          <View key={colIndex} style={{ width: columnWidth }}>
            {columnPosts.map((item) => (
              <PhotoItem
                key={item.id}
                item={item}
                columnWidth={columnWidth}
                onPress={onPressItem}
              />
            ))}
            {loading &&
              colIndex === 0 &&
              Array.from({ length: 2 }).map((_, i) => (
                <View
                  key={`skel-${i}`}
                  style={{
                    height: 180 + i * 60,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#e0e0e0",
                    opacity: 0.6,
                  }}
                />
              ))}
          </View>
        ))}
      </View>

      {loading && posts.length > 0 && (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <ActivityIndicator size="small" color={isDarkMode ? "#ffffff88" : "#00000055"} />
        </View>
      )}
    </ScrollView>
  );
}
