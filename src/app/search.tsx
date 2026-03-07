import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react-native";
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

const ORDER_OPTIONS: { label: string; value: ListAllPostsOrder }[] = [
  { label: "Decrescente", value: "desc" },
  { label: "Crescente", value: "asc" },
];

const ORDER_BY_OPTIONS: { label: string; value: ListAllPostsOrderBy }[] = [
  { label: "Data de criação", value: "createdAt" },
  { label: "Likes", value: "likes" },
  { label: "Comentarios", value: "comments" },
];

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

  // Busca inicial com o q da URL
  useEffect(() => {
    fetchPosts(query, filters, 1);
  }, []);

  // Debounce quando query ou filtros mudam (após mount)
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
              className={`w-9 h-9 rounded-xl items-center justify-center ${
                showFilters ? "bg-indigo-600" : isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <SlidersHorizontal
                size={18}
                color={showFilters ? "white" : isDarkMode ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          {showFilters && (
            <View className="gap-3 pt-1 pb-1">
              <View>
                <Text
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}
                >
                  Ordem
                </Text>
                <View className="flex-row gap-2">
                  {ORDER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => applyFilter("order", opt.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        filters.order === opt.value
                          ? "bg-indigo-600 border-indigo-600"
                          : isDarkMode
                            ? "border-gray-600"
                            : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          filters.order === opt.value ? "text-white" : textPrimary
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}
                >
                  Ordenar por
                </Text>
                <View className="flex-row gap-2">
                  {ORDER_BY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => applyFilter("orderBy", opt.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        filters.orderBy === opt.value
                          ? "bg-indigo-600 border-indigo-600"
                          : isDarkMode
                            ? "border-gray-600"
                            : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          filters.orderBy === opt.value ? "text-white" : textPrimary
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
