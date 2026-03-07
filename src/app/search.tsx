import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react-native";
import { listAllPosts } from "@/api/generated/api";
import {
  GetPaginatedPostDtoDataItem,
  ListAllPostsOrder,
  ListAllPostsOrderBy,
} from "@/api/generated/model";
import { useTheme } from "@/context/ThemeContext";
import { MasonryGrid } from "@/components/MasonryGrid";

type Filters = {
  order: ListAllPostsOrder;
  orderBy: ListAllPostsOrderBy;
};

export default function SearchScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(q ?? "");
  const [filters, setFilters] = useState<Filters>({ order: "desc", orderBy: "createdAt" });
  const [showFilters, setShowFilters] = useState(false);
  const [posts, setPosts] = useState<GetPaginatedPostDtoDataItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const iconColor = (active: boolean) => (active ? "white" : isDarkMode ? "#9ca3af" : "#6b7280");

  const orderIcons = {
    desc: (active: boolean) => <ArrowDownAZ size={14} color={iconColor(active)} />,
    asc: (active: boolean) => <ArrowUpAZ size={14} color={iconColor(active)} />,
  };

  const orderByIcons = {
    createdAt: (active: boolean) => <Clock size={14} color={iconColor(active)} />,
    likes: (active: boolean) => <Heart size={14} color={iconColor(active)} />,
    comments: (active: boolean) => <MessageCircle size={14} color={iconColor(active)} />,
  };

  const fetchPosts = useCallback(async (q: string, f: Filters, pageNumber: number) => {
    setLoading(true);
    try {
      const data = await listAllPosts({
        search: q.trim() || undefined,
        order: f.order,
        orderBy: f.orderBy,
        page: pageNumber,
        limit: 18,
      });
      const newPosts = data.data ?? [];
      if (pageNumber === 1) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(data.meta.currentPage < data.meta.lastPage);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(query, filters, 1);
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setPage(1);
      fetchPosts(query, filters, 1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, filters]);

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchPosts(query, filters, next);
  };

  const applyFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const bg = isDarkMode ? "bg-gray-900" : "bg-gray-100";
  const card = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View className={`flex-1 ${bg}`}>
        {/* Top Bar */}
        <View
          className={`pt-14 px-4 pb-3 gap-3 ${card}`}
          style={{ elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 }}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={22} color={isDarkMode ? "#f9fafb" : "#111827"} />
            </TouchableOpacity>

            <View
              className={`flex-1 flex-row items-center gap-2 px-3 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <Search size={16} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar posts..."
                placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                autoFocus
                returnKeyType="search"
                className={`flex-1 py-2.5 text-sm ${textPrimary}`}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <X size={16} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowFilters((v) => !v)}
              className={`w-9 h-9 rounded-xl items-center justify-center ${showFilters ? "bg-indigo-600" : isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <SlidersHorizontal
                size={18}
                color={showFilters ? "white" : isDarkMode ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          {showFilters && (
            <View className="gap-4 pt-1 pb-1">
              {/* Ordem */}
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
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => applyFilter("order", value)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${active ? "bg-indigo-600 border-indigo-600" : isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                      >
                        {orderIcons[value](active)}
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

              {/* Ordenar por */}
              <View>
                <Text
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}
                >
                  Ordenar por
                </Text>
                <View className="flex-row gap-2">
                  {(["createdAt", "likes", "comments"] as ListAllPostsOrderBy[]).map((value) => {
                    const active = filters.orderBy === value;
                    const labels = { createdAt: "Data", likes: "Likes", comments: "Comentários" };
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => applyFilter("orderBy", value)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${active ? "bg-indigo-600 border-indigo-600" : isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                      >
                        {orderByIcons[value](active)}
                        <Text
                          className={`text-xs font-medium ${active ? "text-white" : textPrimary}`}
                        >
                          {labels[value]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        <MasonryGrid
          posts={posts}
          loading={loading}
          onLoadMore={handleLoadMore}
          onPressItem={(item) => router.push(`/post/${item.id}`)}
        />
      </View>
    </>
  );
}
