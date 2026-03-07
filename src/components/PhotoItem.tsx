import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Video } from "expo-av";
import { Heart, MessageCircle, Image as ImageIcon } from "lucide-react-native";
import { GetPostDto } from "@/api/generated/model";

const COLUMN_GAP = 8;
const HORIZONTAL_PADDING = 16;

interface PhotoItemProps {
  item: GetPostDto;
  columnWidth: number;
  onPress?: (item: GetPostDto) => void;
}

export function PhotoItem({ item, columnWidth, onPress }: PhotoItemProps) {
  const [height, setHeight] = useState<number>(columnWidth * 1.33);

  useEffect(() => {
    const url = item.Media?.[0]?.imageUrl;
    if (!url) return;

    Image.getSize(
      url,
      (w, h) => {
        setHeight(columnWidth * (h / w));
      },
      () => {
        setHeight(columnWidth * 1.33);
      }
    );
  }, [item.id, columnWidth]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
      className="mb-2 rounded-xl overflow-hidden"
    >
      <View style={{ height, width: columnWidth }}>
        {item.isVideo ? (
          <Video
            source={{ uri: item.Media![0].imageUrl }}
            style={{ width: columnWidth, height }}
            useNativeControls={false}
            isMuted={true}
            shouldPlay={false}
            isLooping={false}
          />
        ) : (
          <Image
            source={{ uri: item.Media![0].imageUrl }}
            style={{ width: columnWidth, height }}
            resizeMode="cover"
          />
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
