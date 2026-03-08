import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { User, Search, Plus } from "lucide-react-native";
import { listAllPosts, getUserById } from "@/api/generated/api";
import { GetPostDto, GetUserDto, ListAllPostsParams } from "@/api/generated/model";
import { MasonryGrid } from "@/components/MasonryGrid";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function HomeScreen() {
  const [posts, setPosts] = useState<GetPostDto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<GetUserDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // ── FAB scroll-aware visibility ──
  const fabAnim = useRef(new Animated.Value(1)).current as any;
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(
    (offsetY: number) => {
      const diff = offsetY - lastScrollY.current;
      lastScrollY.current = offsetY;

      // Don't hide near the top
      if (offsetY < 60) {
        Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
        return;
      }

      if (diff > 4) {
        // Scrolling down → hide
        Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      } else if (diff < -4) {
        // Scrolling up → show
        Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
      }
    },
    [fabAnim]
  );

  useEffect(() => {
    if (!user?.sub) return;
    getUserById(user.sub)
      .then((data) => setProfile(data))
      .catch(() => {});
  }, [user?.sub]);

  const fetchPosts = async (pageNumber: number): Promise<void> => {
    if (loading) return;
    setLoading(true);
    try {
      const params: ListAllPostsParams = { page: pageNumber, limit: 20 };
      const { data } = await listAllPosts(params);
      setPosts((prev) => [...prev, ...data]);
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

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const header = (
    <View className={`px-4 pt-4 pb-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <Text
        className={`text-center text-sm leading-6 mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Bem-vindo ao mural de fotos do curso de Ciência da Computação da UNIR. Este espaço foi
        criado para compartilhar visualizações, diagramas e projetos relacionados às disciplinas do
        curso. Explore as imagens, comente e interaja com os trabalhos dos seus colegas e
        professores.
      </Text>

      <View
        className={`flex-row items-center gap-3 px-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 }}
      >
        <Search size={18} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Buscar posts..."
          placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
          returnKeyType="search"
          className={`flex-1 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
        />
      </View>
    </View>
  );

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        {/* ── Top Bar ── */}
        <View
          className={`pt-14 px-4 pb-3 flex-row items-center justify-between ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
          style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 }}
        >
          <View style={{ width: 36 }} />
          <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Mural de Fotos
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            className="w-9 h-9 rounded-full overflow-hidden items-center justify-center"
            style={{ backgroundColor: isDarkMode ? "#374151" : "#f3f4f6" }}
          >
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ width: 36, height: 36, borderRadius: 999 }}
              />
            ) : (
              <User size={20} color={isDarkMode ? "#f9fafb" : "#111827"} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Feed ── */}
        <MasonryGrid
          posts={posts}
          loading={loading}
          onLoadMore={loadMorePosts}
          onPressItem={(item: GetPostDto) => router.push(`/post/${item.id}`)}
          onScroll={handleScroll}
          header={header}
        />

        {/* ── Floating Action Button ── */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 28,
            right: 20,
            opacity: fabAnim,
            transform: [
              {
                scale: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
            ],
          }}
          pointerEvents={fabAnim === 0 ? "none" : "auto"}
        >
          <TouchableOpacity
            onPress={() => router.push("/post/create")}
            activeOpacity={0.85}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#4f46e5",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}
