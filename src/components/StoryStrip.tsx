import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Sparkles } from "lucide-react-native";
import type { StoryListDtoItem } from "@/api/generated/model";
import { useTheme } from "@/context/ThemeContext";

interface StoryStripProps {
  stories: StoryListDtoItem[];
  loading: boolean;
  onPressStory: (story: StoryListDtoItem) => void;
}

const STORY_SIZE = 78;

export function StoryStrip({ stories, loading, onPressStory }: StoryStripProps) {
  const { isDarkMode } = useTheme();

  if (!loading && stories.length === 0) {
    return null;
  }

  return (
    <View className="min-h-[108px] justify-center">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingRight: 4 }}
      >
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            onPress={() => onPressStory(story)}
            activeOpacity={0.85}
            style={{ width: 86, alignItems: "center" }}
          >
            <View
              className="rounded-full p-[2px]"
              style={{
                width: STORY_SIZE + 8,
                height: STORY_SIZE + 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDarkMode ? "#7c3aed" : "#e11d48",
              }}
            >
              <View
                className={`rounded-full p-[3px] ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
              >
                <View
                  className={`rounded-full overflow-hidden items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                  style={{ width: STORY_SIZE, height: STORY_SIZE }}
                >
                  {story.coverImageUrl ? (
                    <Image
                      source={{ uri: story.coverImageUrl }}
                      style={{ width: STORY_SIZE, height: STORY_SIZE }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Sparkles size={24} color={isDarkMode ? "#c4b5fd" : "#4f46e5"} />
                  )}
                </View>
              </View>
            </View>

            <Text
              numberOfLines={1}
              className={`text-[11px] font-medium mt-2 text-center ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {story.title}
            </Text>
          </TouchableOpacity>
        ))}

        {loading && (
          <View style={{ width: 86, alignItems: "center", justifyContent: "center" }}>
            <View
              className={`rounded-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
              style={{
                width: STORY_SIZE + 8,
                height: STORY_SIZE + 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
