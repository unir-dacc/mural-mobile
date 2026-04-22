import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput, Animated, Image, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import {
  User,
  Search,
  Plus,
  SlidersHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react-native";
import { listAllPosts, getUserById, listStories, likePost } from "@/api/generated/api";
import {
  GetPostDto,
  GetUserDto,
  ListAllPostsParams,
  ListAllPostsOrder,
  ListAllPostsOrderBy,
  StoryListDtoItem,
} from "@/api/generated/model";
import { MasonryGrid } from "@/components/MasonryGrid";
import { StoryStrip } from "@/components/StoryStrip";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

type Filters = {
  order: ListAllPostsOrder;
  orderBy: ListAllPostsOrderBy;
  onlyMine: boolean;
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<GetPostDto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<GetUserDto | null>(null);
  const [stories, setStories] = useState<StoryListDtoItem[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    order: ListAllPostsOrder.desc,
    orderBy: ListAllPostsOrderBy.createdAt,
    onlyMine: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // ── FAB scroll-aware visibility ──
  const fabAnim = useRef(new Animated.Value(1)).current as any;
  const lastScrollY = useRef(0);
  const savedScrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fabVisibilityRef = useRef<"visible" | "hidden">("visible");
  const loadingRef = useRef(false);

  const animateFab = useCallback(
    (nextVisibility: "visible" | "hidden") => {
      if (fabVisibilityRef.current === nextVisibility) {
        return;
      }

      fabVisibilityRef.current = nextVisibility;
      Animated.spring(fabAnim, {
        toValue: nextVisibility === "visible" ? 1 : 0,
        useNativeDriver: true,
        bounciness: nextVisibility === "visible" ? 4 : 0,
      }).start();
    },
    [fabAnim]
  );

  const handleScroll = useCallback(
    (offsetY: number) => {
      savedScrollY.current = offsetY;
      const diff = offsetY - lastScrollY.current;
      lastScrollY.current = offsetY;

      if (offsetY < 60) {
        animateFab("visible");
        return;
      }

      if (diff > 4) {
        animateFab("hidden");
      } else if (diff < -4) {
        animateFab("visible");
      }
    },
    [animateFab]
  );

  useEffect(() => {
    if (!user?.sub) return;
    getUserById(user.sub)
      .then((data) => setProfile(data))
      .catch(() => {});
  }, [user?.sub]);

  const fetchStories = useCallback(async () => {
    setLoadingStories(true);
    try {
      const data = await listStories();
      setStories(data ?? []);
    } catch {
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStories();
      const y = savedScrollY.current;
      if (y > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y, animated: false });
        }, 50);
      }
    }, [fetchStories])
  );

  const fetchPosts = useCallback(
    async (pageNumber: number, f: Filters): Promise<void> => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const params: ListAllPostsParams = {
          page: pageNumber,
          limit: 20,
          order: f.order,
          orderBy: f.orderBy,
          userId: f.onlyMine ? user?.sub : undefined,
        };
        const { data } = await listAllPosts(params);
        setPosts((prev) => (pageNumber === 1 ? data : [...prev, ...data]));
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [user?.sub]
  );

  useEffect(() => {
    fetchPosts(page, filters);
  }, [fetchPosts, page, filters]);

  const applyFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const loadMorePosts = useCallback(() => {
    if (!loadingRef.current) setPage((prev) => prev + 1);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  }, [router, searchQuery]);

  const iconColor = useCallback(
    (active: boolean) => (active ? "white" : isDarkMode ? "#9ca3af" : "#6b7280"),
    [isDarkMode]
  );
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";

  const handlePressStory = useCallback(
    (story: StoryListDtoItem) => router.push(`/story/${story.id}`),
    [router]
  );

  const handlePressPost = useCallback(
    (item: GetPostDto) => router.push(`/post/${item.id}`),
    [router]
  );

  const handleDoubleTapPost = useCallback((item: GetPostDto) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1 } } : p
      )
    );
    likePost(item.id).catch(() => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, _count: { ...p._count, likes: Math.max(0, (p._count?.likes ?? 1) - 1) } }
            : p
        )
      );
    });
  }, []);

  const header = useMemo(
    () => (
      <View className={`px-4 pt-4 pb-4 gap-3 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        {stories.length > 0 ? (
          <StoryStrip stories={stories} loading={loadingStories} onPressStory={handlePressStory} />
        ) : (
          <Text
            className={`text-center text-sm leading-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Bem-vindo ao mural de fotos do curso de Ciência da Computação da UNIR. Este espaço foi
            criado para compartilhar visualizações, diagramas e projetos relacionados às disciplinas
            do curso. Explore as imagens, comente e interaja com os trabalhos dos seus colegas e
            professores.
          </Text>
        )}

        <View className="flex-row items-center gap-2">
          <View
            className={`flex-1 flex-row items-center gap-3 px-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
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

          <TouchableOpacity
            onPress={() => setShowFilters((v) => !v)}
            className={`w-11 h-11 rounded-2xl items-center justify-center ${showFilters ? "bg-indigo-600" : isDarkMode ? "bg-gray-800" : "bg-white"}`}
            style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 }}
          >
            <SlidersHorizontal
              size={18}
              color={showFilters ? "white" : isDarkMode ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View
            className={`rounded-2xl p-4 gap-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 }}
          >
            <View>
              <Text
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Ordem
              </Text>
              <View className="flex-row gap-2">
                {(["desc", "asc"] as ListAllPostsOrder[]).map((value) => {
                  const active = filters.order === value;
                  const label = value === "desc" ? "Decrescente" : "Crescente";
                  const Icon = value === "desc" ? ArrowDownAZ : ArrowUpAZ;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => applyFilter("order", value)}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${active ? "bg-indigo-600 border-indigo-600" : isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                    >
                      <Icon size={14} color={iconColor(active)} />
                      <Text
                        className={`text-xs font-medium ${active ? "text-white" : textPrimary}`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Ordenar por
              </Text>
              <View className="flex-row gap-2">
                {(
                  [
                    { value: "createdAt", label: "Data", Icon: Clock },
                    { value: "likes", label: "Likes", Icon: Heart },
                    { value: "comments", label: "Comentários", Icon: MessageCircle },
                  ] as { value: ListAllPostsOrderBy; label: string; Icon: any }[]
                ).map(({ value, label, Icon }) => {
                  const active = filters.orderBy === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => applyFilter("orderBy", value)}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${active ? "bg-indigo-600 border-indigo-600" : isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                    >
                      <Icon size={14} color={iconColor(active)} />
                      <Text
                        className={`text-xs font-medium ${active ? "text-white" : textPrimary}`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Autor
              </Text>
              <TouchableOpacity
                onPress={() => applyFilter("onlyMine", !filters.onlyMine)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border self-start ${filters.onlyMine ? "bg-indigo-600 border-indigo-600" : isDarkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <User size={14} color={iconColor(filters.onlyMine)} />
                <Text
                  className={`text-xs font-medium ${filters.onlyMine ? "text-white" : textPrimary}`}
                >
                  Meus posts
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    ),
    [
      filters.onlyMine,
      filters.order,
      filters.orderBy,
      handlePressStory,
      handleSearchSubmit,
      iconColor,
      isDarkMode,
      loadingStories,
      searchQuery,
      showFilters,
      stories,
      textPrimary,
      textSecondary,
    ]
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
          onPressItem={handlePressPost}
          onDoubleTapItem={handleDoubleTapPost}
          onScroll={handleScroll}
          scrollViewRef={scrollViewRef}
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
