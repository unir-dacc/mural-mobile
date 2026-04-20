import React, { memo, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Play } from "lucide-react-native";
import { Heart, MessageCircle, Image as ImageIcon } from "lucide-react-native";
import { GetPostDto } from "@/api/generated/model";

interface PhotoItemProps {
  item: GetPostDto;
  columnWidth: number;
  onPress?: (item: GetPostDto) => void;
}

const DEFAULT_ASPECT_RATIO = 1.33;
const imageHeightCache = new Map<string, number>();

function PhotoItemComponent({ item, columnWidth, onPress }: PhotoItemProps) {
  const [height, setHeight] = useState<number>(columnWidth * 1.33);

  const thumbnailUrl = item.thumbnailUrl ?? item.Media?.[0]?.imageUrl;

  useEffect(() => {
    if (!thumbnailUrl) {
      setHeight(columnWidth * DEFAULT_ASPECT_RATIO);
      return;
    }

    const cacheKey = `${thumbnailUrl}:${columnWidth}`;
    const cachedHeight = imageHeightCache.get(cacheKey);

    if (cachedHeight) {
      setHeight(cachedHeight);
      return;
    }

    Image.getSize(
      thumbnailUrl,
      (w, h) => {
        const resolvedHeight = columnWidth * (h / w);
        imageHeightCache.set(cacheKey, resolvedHeight);
        setHeight(resolvedHeight);
      },
      () => {
        const fallbackHeight = columnWidth * DEFAULT_ASPECT_RATIO;
        imageHeightCache.set(cacheKey, fallbackHeight);
        setHeight(fallbackHeight);
      }
    );
  }, [columnWidth, thumbnailUrl]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
      className="mb-2 rounded-xl overflow-hidden"
    >
      <View style={{ height, width: columnWidth }}>
        {/* Vídeos e imagens usam thumbnail — mais leve */}
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ width: columnWidth, height }}
          resizeMode="cover"
        />

        {item.isVideo && (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <View
              style={{ backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 999 }}
              className="w-10 h-10 items-center justify-center"
            >
              <Play size={18} color="white" fill="white" />
            </View>
          </View>
        )}

        <View
          className="absolute bottom-2 right-2 rounded-lg overflow-hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.30)", borderRadius: 32 }}
        >
          <View className="flex-row items-center px-2 py-1" style={{ gap: 10 }}>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Heart size={13} color="white" />
              <Text className="text-white" style={{ fontSize: 11 }}>
                {item._count?.likes ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <MessageCircle size={13} color="white" />
              <Text className="text-white" style={{ fontSize: 11 }}>
                {item._count?.comments ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <ImageIcon size={13} color="white" />
              <Text className="text-white" style={{ fontSize: 11 }}>
                {item._count?.Media ?? 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const PhotoItem = memo(
  PhotoItemComponent,
  (prev, next) =>
    prev.columnWidth === next.columnWidth &&
    prev.item.id === next.item.id &&
    prev.item.thumbnailUrl === next.item.thumbnailUrl &&
    prev.item.Media?.[0]?.imageUrl === next.item.Media?.[0]?.imageUrl &&
    prev.item.isVideo === next.item.isVideo &&
    prev.item._count?.likes === next.item._count?.likes &&
    prev.item._count?.comments === next.item._count?.comments &&
    prev.item._count?.Media === next.item._count?.Media &&
    prev.onPress === next.onPress
);
