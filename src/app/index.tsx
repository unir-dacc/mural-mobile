import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { listAllPosts } from "@/api/generated/api";
import { GetPostDto, ListAllPostsParams } from "@/api/generated/model";
import { MasonryGrid } from "@/components/MasonryGrid";

export default function HomeScreen() {
  const [posts, setPosts] = useState<GetPostDto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const router = useRouter();

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

  const header = (
    <View className={`px-4 pt-4 pb-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <Text
        className={`text-center text-sm leading-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Bem-vindo ao mural de fotos do curso de Ciência da Computação da UNIR. Este espaço foi
        criado para compartilhar visualizações, diagramas e projetos relacionados às disciplinas do
        curso. Explore as imagens, comente e interaja com os trabalhos dos seus colegas e
        professores.
      </Text>
    </View>
  );

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        {/* Top Bar */}
        <View
          className={`pt-14 px-4 pb-3 flex-row items-center justify-between ${
            isDarkMode ? "bg-gray-900" : "bg-white"
          }`}
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View style={{ width: 36 }} />

          <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Mural de Fotos
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/profile")}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: isDarkMode ? "#374151" : "#f3f4f6" }}
          >
            <User size={20} color={isDarkMode ? "#f9fafb" : "#111827"} />
          </TouchableOpacity>
        </View>

        <MasonryGrid
          posts={posts}
          loading={loading}
          onLoadMore={loadMorePosts}
          onPressItem={handlePressItem}
          header={header}
        />
      </View>
    </>
  );
}
