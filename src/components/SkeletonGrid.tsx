import React, { useEffect, useRef } from "react";
import { View, Animated, useColorScheme, useWindowDimensions } from "react-native";

const COLUMN_GAP = 8;
const HORIZONTAL_PADDING = 16;
const MIN_COLUMN_WIDTH = 150;

// Alturas variadas para simular o masonry
const SKELETON_HEIGHTS = [180, 240, 200, 280, 160, 220, 300, 190];

interface SkeletonCardProps {
  height: number;
  shimmerValue: Animated.Value;
  isDarkMode: boolean;
}

function SkeletonCard({ height, shimmerValue, isDarkMode }: SkeletonCardProps) {
  const backgroundColor = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: isDarkMode ? ["#2a2a2a", "#3d3d3d"] : ["#e0e0e0", "#f0f0f0"],
  });

  return (
    <Animated.View
      style={{
        height,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor,
      }}
    />
  );
}

interface SkeletonGridProps {
  numColumns: number;
  columnWidth: number;
  count?: number; // total de skeletons a exibir
}

export function SkeletonGrid({ numColumns, columnWidth, count = 8 }: SkeletonGridProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerValue]);

  // Distribui os skeletons nas colunas
  const columns: number[][] = Array.from({ length: numColumns }, () => []);
  Array.from({ length: count }).forEach((_, i) => {
    columns[i % numColumns].push(SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length]);
  });

  return (
    <View
      style={{
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingVertical: HORIZONTAL_PADDING,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: COLUMN_GAP,
      }}
    >
      {columns.map((colHeights, colIndex) => (
        <View key={colIndex} style={{ width: columnWidth }}>
          {colHeights.map((height, cardIndex) => (
            <SkeletonCard
              key={cardIndex}
              height={height}
              shimmerValue={shimmerValue}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
