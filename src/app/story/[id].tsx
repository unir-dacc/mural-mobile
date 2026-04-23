import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Pressable,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Lock,
  Heart,
  MessageCircle,
  Send,
} from "lucide-react-native";
import axios from "axios";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  commentsControllerComment,
  commentsControllerGetComments,
  getPostById,
  getStoryById,
  likePost,
  likesControllerLiked,
  unlikePost,
} from "@/api/generated/api";
import type { StoryDto, StoryDtoItemsItem } from "@/api/generated/model";
import { useAuth } from "@/context/AuthContext";
import { ZoomableView } from "@/components/ZoomableView";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_STORY_DURATION = 5000;

function StoryMedia({
  item,
  onLoaded,
  onZoomChange,
}: {
  item: StoryDtoItemsItem;
  onLoaded: () => void;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const player = useVideoPlayer(item.isVideo ? item.imageUrl : null, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.play();
  });

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {item.isVideo ? (
        <VideoView
          player={player}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          onFirstFrameRender={onLoaded}
        />
      ) : (
        <ZoomableView
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          onScaleChange={(s) => onZoomChange?.(s > 1)}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="contain"
            onLoad={onLoaded}
            onError={onLoaded}
          />
        </ZoomableView>
      )}
    </View>
  );
}

function getStoryTypeLabel(type: StoryDto["type"]) {
  switch (type) {
    case "USER_QUARTERLY_RETROSPECTIVE":
      return "Retrospectiva trimestral";
    case "USER_YEARLY_RETROSPECTIVE":
      return "Retrospectiva anual";
    case "GLOBAL_YEARLY_RETROSPECTIVE":
      return "Retrospectiva global";
    default:
      return "Story";
  }
}

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [story, setStory] = useState<StoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [commenting, setCommenting] = useState(false);
  const [loadingInteraction, setLoadingInteraction] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressValueRef = useRef(0);
  const listRef = useRef<FlatList<StoryDtoItemsItem>>(null);

  const items = useMemo(
    () => [...(story?.items ?? [])].sort((a, b) => a.order - b.order),
    [story?.items]
  );
  const currentItem = items[currentIndex];
  const currentPostId = currentItem?.postId;
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!id) return;

    getStoryById(id)
      .then((data) => {
        setStory(data);
      })
      .catch((error) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          Alert.alert("Story indisponível", "Esse story expirou ou não está mais acessível.", [
            {
              text: "Fechar",
              onPress: handleClose,
            },
          ]);
          return;
        }

        Alert.alert("Erro", "Não foi possível carregar o story.", [
          {
            text: "Fechar",
            onPress: handleClose,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [handleClose, id]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) {
        if (index >= items.length) {
          handleClose();
        }
        return;
      }

      listRef.current?.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    },
    [handleClose, items.length]
  );

  // Track animated value so we can resume from the paused position
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      progressValueRef.current = value;
    });
    return () => progressAnim.removeListener(listenerId);
  }, [progressAnim]);

  // Reset progress whenever the slide changes
  useEffect(() => {
    setMediaLoading(true);
    setIsPaused(false);
    setIsZoomed(false);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    progressValueRef.current = 0;
  }, [currentIndex, progressAnim]);

  // Start/resume/pause the progress bar animation
  useEffect(() => {
    if (mediaLoading || isPaused || isZoomed || !currentItem || currentItem.isVideo) {
      return;
    }

    const remainingDuration = (1 - progressValueRef.current) * IMAGE_STORY_DURATION;

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        goToIndex(currentIndex + 1);
      }
    });

    return () => animation.stop();
  }, [currentIndex, currentItem, goToIndex, isPaused, isZoomed, mediaLoading, progressAnim]);

  useEffect(() => {
    if (!currentPostId) return;

    setLoadingInteraction(true);

    Promise.all([
      getPostById(currentPostId),
      commentsControllerGetComments(currentPostId),
      likesControllerLiked(currentPostId)
        .then((res: any) => !!res)
        .catch(() => false),
    ])
      .then(([post, comments, isLiked]) => {
        setLikeCount(post._count.likes);
        setCommentCount(comments.length);
        setLiked(isLiked as boolean);
      })
      .catch(() => {
        setLikeCount(0);
        setCommentCount(0);
        setLiked(false);
      })
      .finally(() => setLoadingInteraction(false));
  }, [currentPostId]);

  const handleMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(nextIndex);
    setCommentText("");
  }, []);

  const handleTapLeft = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const handleTapRight = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const handleLike = useCallback(async () => {
    if (!currentPostId) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => prev + (wasLiked ? -1 : 1));

    try {
      if (wasLiked) {
        await unlikePost(currentPostId);
      } else {
        await likePost(currentPostId);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((prev) => prev + (wasLiked ? 1 : -1));
    }
  }, [currentPostId, liked]);

  const handleCommentSubmit = useCallback(async () => {
    if (!currentPostId || !commentText.trim()) return;

    setCommenting(true);
    try {
      await commentsControllerComment(currentPostId, { content: commentText.trim() });
      const comments = await commentsControllerGetComments(currentPostId);
      setCommentCount(comments.length);
      setCommentText("");
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o comentário.");
    } finally {
      setCommenting(false);
    }
  }, [commentText, currentPostId]);

  const renderStoryItem = useCallback(
    ({ item }: { item: StoryDtoItemsItem }) => (
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "#000" }}>
        <StoryMedia
          item={item}
          onLoaded={() => {
            if (item.id === currentItem?.id) {
              setMediaLoading(false);
            }
          }}
          onZoomChange={(zoomed) => {
            if (item.id === currentItem?.id) {
              setIsZoomed(zoomed);
            }
          }}
        />
      </View>
    ),
    [currentItem?.id]
  );

  if (loading || !story || items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderStoryItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isZoomed}
          onMomentumScrollEnd={handleMomentumEnd}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={2}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={{ flex: 1, backgroundColor: "#000" }}
        />

        {mediaLoading && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 24,
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}
            >
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </View>
        )}

        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            zIndex: 30,
          }}
        >
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.25)",
                }}
              >
                {index < currentIndex ? (
                  <View style={{ flex: 1, backgroundColor: "#fff" }} />
                ) : index === currentIndex ? (
                  <Animated.View
                    style={{
                      height: 3,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                      backgroundColor: "#fff",
                    }}
                  />
                ) : null}
              </View>
            ))}
          </View>

          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{story.title}</Text>
              <Text className="text-white/80 text-sm mt-1">
                {story.subtitle ?? getStoryTypeLabel(story.type)}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                {story.visibility === "GLOBAL" ? (
                  <Globe2 size={14} color="#fff" />
                ) : (
                  <Lock size={14} color="#fff" />
                )}
                <Text className="text-white/80 text-xs">{getStoryTypeLabel(story.type)}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.8}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.35)",
              }}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: insets.top + 110,
            bottom: insets.bottom + 170,
            flexDirection: "row",
            zIndex: 10,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={!isZoomed ? handleTapLeft : undefined}
            onPressIn={!isZoomed ? () => setIsPaused(true) : undefined}
            onPressOut={!isZoomed ? () => setIsPaused(false) : undefined}
          />
          <Pressable
            style={{ flex: 1 }}
            onPress={!isZoomed ? handleTapRight : undefined}
            onPressIn={!isZoomed ? () => setIsPaused(true) : undefined}
            onPressOut={!isZoomed ? () => setIsPaused(false) : undefined}
          />
        </View>

        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 18,
            left: 16,
            right: 16,
            zIndex: 20,
          }}
        >
          {!!currentItem?.caption && (
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text className="text-white text-sm leading-5">{currentItem.caption}</Text>
            </View>
          )}

          <View className="flex-row items-center justify-between mt-3">
            <View
              className="flex-row items-center gap-2"
              style={{
                backgroundColor: "rgba(0,0,0,0.35)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <ChevronLeft size={14} color="#fff" />
              <Text className="text-white/90 text-xs">
                {currentIndex + 1} de {items.length}
              </Text>
              <ChevronRight size={14} color="#fff" />
            </View>

            {currentItem?.isVideo && (
              <Text className="text-white/80 text-xs">Vídeo • arraste para navegar</Text>
            )}
          </View>

          <View className="flex-row items-center gap-3 mt-3">
            <TouchableOpacity
              onPress={handleLike}
              activeOpacity={0.8}
              disabled={!currentPostId}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.35)",
              }}
            >
              <Heart
                size={22}
                color={liked ? "#ef4444" : "#fff"}
                fill={liked ? "#ef4444" : "transparent"}
              />
            </TouchableOpacity>

            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.35)",
                paddingLeft: 14,
                paddingRight: 8,
                minHeight: 44,
              }}
            >
              <MessageCircle size={18} color="#fff" />
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={user ? "Comente neste post..." : "Entre para comentar"}
                placeholderTextColor="rgba(255,255,255,0.65)"
                editable={!!user}
                className="flex-1 text-white text-sm ml-3 py-3"
              />
              <TouchableOpacity
                onPress={handleCommentSubmit}
                disabled={!commentText.trim() || commenting || !user}
                activeOpacity={0.8}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    commentText.trim() && user ? "rgba(79,70,229,0.95)" : "rgba(255,255,255,0.14)",
                }}
              >
                {commenting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mt-2 px-2">
            <Text className="text-white/85 text-xs">
              {loadingInteraction ? "..." : `${likeCount} curtida${likeCount === 1 ? "" : "s"}`}
            </Text>
            <Text className="text-white/85 text-xs">
              {loadingInteraction
                ? "..."
                : `${commentCount} comentário${commentCount === 1 ? "" : "s"}`}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
