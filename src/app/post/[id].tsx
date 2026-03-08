import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ActivityIndicator,
  Modal,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Heart,
  MessageCircle,
  Send,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react-native";
import { Video, ResizeMode } from "expo-av";
import {
  getPostById,
  commentsControllerGetComments,
  commentsControllerComment,
  likePost,
  unlikePost,
  likesControllerLiked,
} from "@/api/generated/api";
import { GetPostDto, CommentsControllerGetComments200Item } from "@/api/generated/model";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TopBar } from "@/components/TopBar";
import { UserAvatar } from "@/components/UserAvatar";
import { PostSkeleton, SkeletonPulse } from "@/components/PostSkeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ImageViewerModalProps {
  images: { id: string; imageUrl: string }[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  initialIndex,
  visible,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const { width: W, height: H } = Dimensions.get("window");

  // Sync to initialIndex when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      // Scroll to the right position after layout
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * W, animated: false });
      }, 0);
    }
  }, [visible, initialIndex, W]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / W);
      setCurrentIndex(index);
    },
    [W]
  );

  const goTo = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * W, animated: true });
      setCurrentIndex(index);
    },
    [W]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar style="light" />

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            top: (RNStatusBar.currentHeight ?? 44) + 8,
            right: 16,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <X size={22} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        {images.length > 1 && (
          <View
            style={{
              position: "absolute",
              top: (RNStatusBar.currentHeight ?? 44) + 14,
              alignSelf: "center",
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Horizontal pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={{ flex: 1 }}
        >
          {images.map((img) => (
            <View
              key={img.id}
              style={{ width: W, height: H, justifyContent: "center", alignItems: "center" }}
            >
              <Image
                source={{ uri: img.imageUrl }}
                style={{ width: W, height: H }}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                onPress={() => goTo(currentIndex - 1)}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                onPress={() => goTo(currentIndex + 1)}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <ChevronRight size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <View
            style={{
              position: "absolute",
              bottom: 40,
              width: "100%",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 8 : 6,
                  height: i === currentIndex ? 8 : 6,
                  borderRadius: 4,
                  backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface MediaItemProps {
  media: { id: string; imageUrl: string; isVideo?: boolean };
  onPress?: () => void;
}

const MediaItem: React.FC<MediaItemProps> = ({ media, onPress }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
      {media.isVideo ? (
        <>
          <Video
            source={{ uri: media.imageUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
          />
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
              <Play size={22} color="white" fill="white" />
            </View>
          </View>
        </>
      ) : (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPress}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
        >
          {/* Skeleton shown until image loads */}
          {!imageLoaded && (
            <SkeletonPulse
              className="absolute inset-0 bg-gray-300"
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            />
          )}
          <Animated.Image
            source={{ uri: media.imageUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, opacity: fadeAnim }}
            resizeMode="cover"
            onLoad={onLoad}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
}

const CarouselDots: React.FC<CarouselDotsProps> = ({ count, activeIndex }) => {
  if (count <= 1) return null;
  return (
    <View className="flex-row justify-center gap-1 mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`rounded-full ${
            i === activeIndex ? "w-2 h-2 bg-indigo-600" : "w-1.5 h-1.5 bg-gray-400"
          }`}
        />
      ))}
    </View>
  );
};

interface CommentItemProps {
  comment: CommentsControllerGetComments200Item;
  isDarkMode: boolean;
  onUserPress?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isDarkMode, onUserPress }) => (
  <View className="flex-row gap-2 mb-3">
    <UserAvatar
      name={comment.user?.name}
      avatarUrl={comment.user?.avatarUrl}
      size="sm"
      onPress={onUserPress}
    />
    <View className="flex-1">
      <Text className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        <Text className="font-semibold">{comment.user?.name} </Text>
        {comment.content}
      </Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────
// Custom hook — encapsulates all data logic
// ─────────────────────────────────────────────

function usePostDetail(id: string | undefined) {
  const [post, setPost] = useState<GetPostDto | null>(null);
  const [comments, setComments] = useState<CommentsControllerGetComments200Item[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      getPostById(id),
      commentsControllerGetComments(id),
      likesControllerLiked(id)
        .then((res: any) => !!res)
        .catch(() => false),
    ])
      .then(([postRes, commentsRes, isLiked]) => {
        setPost(postRes);
        setLikeCount(postRes._count.likes);
        setComments(commentsRes);
        setLiked(isLiked as boolean);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = useCallback(async () => {
    if (!id) return;
    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => prev + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) {
        await unlikePost(id);
      } else {
        await likePost(id);
      }
    } catch {
      // Rollback on failure
      setLiked(wasLiked);
      setLikeCount((prev) => prev + (wasLiked ? 1 : -1));
    }
  }, [id, liked]);

  const handleComment = useCallback(
    async (text: string, onSuccess: () => void) => {
      if (!text.trim() || !id) return;
      setCommenting(true);
      try {
        await commentsControllerComment(id, { content: text.trim() });
        const data = await commentsControllerGetComments(id);
        setComments(data);
        onSuccess();
      } catch {
        // handle error (toast, etc.)
      } finally {
        setCommenting(false);
      }
    },
    [id]
  );

  return { post, comments, liked, likeCount, loading, commenting, handleLike, handleComment };
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const [commentText, setCommentText] = useState("");
  const [mediaIndex, setMediaIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fabAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const fabVisible = useRef(true);

  const { post, comments, liked, likeCount, loading, commenting, handleLike, handleComment } =
    usePostDetail(id);

  const mediaList = post?.Media ?? [];
  const imageList = mediaList.filter((m) => !m.isVideo);

  const openViewer = useCallback(
    (mediaId: string) => {
      const idx = imageList.findIndex((m) => m.id === mediaId);
      setViewerIndex(idx >= 0 ? idx : 0);
      setViewerVisible(true);
    },
    [imageList]
  );

  const handleCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setMediaIndex(index);
  }, []);

  const handleVerticalScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // scrolling down → hide FAB; scrolling up → show FAB
      if (diff > 4 && fabVisible.current) {
        fabVisible.current = false;
        Animated.spring(fabAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }).start();
      } else if (diff < -4 && !fabVisible.current) {
        fabVisible.current = true;
        Animated.spring(fabAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }).start();
      }
    },
    [fabAnim]
  );

  const onCommentSubmit = useCallback(() => {
    handleComment(commentText, () => setCommentText(""));
  }, [commentText, handleComment]);

  const navigateToUser = useCallback(
    (userId: string) => () => router.push(`/user/${userId}`),
    [router]
  );

  // ── Loading state ──
  if (loading || !post) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <TopBar title="Post" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <PostSkeleton isDarkMode={isDarkMode} />
        </ScrollView>
      </View>
    );
  }

  const bg = isDarkMode ? "bg-gray-900" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const iconColor = isDarkMode ? "#f9fafb" : "#111827";

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className={`flex-1 ${bg}`}
      >
        <TopBar title="Post" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleVerticalScroll}
          scrollEventThrottle={16}
        >
          {/* ── Post header ── */}
          <View className="flex-row items-center px-4 py-3 gap-3">
            <UserAvatar
              name={post.user?.name}
              avatarUrl={post.user?.avatarUrl}
              size="md"
              onPress={navigateToUser(post.userId)}
            />
            <TouchableOpacity onPress={navigateToUser(post.userId)}>
              <Text className={`font-semibold text-sm ${textPrimary}`}>
                {post.user?.name ?? "Usuário"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Media carousel ── */}
          <View>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
            >
              {mediaList.map((media) => (
                <MediaItem
                  key={media.id}
                  media={media}
                  onPress={!media.isVideo ? () => openViewer(media.id) : undefined}
                />
              ))}
            </ScrollView>
            <CarouselDots count={mediaList.length} activeIndex={mediaIndex} />
          </View>

          {/* ── Actions ── */}
          <View className="flex-row items-center px-4 pt-3 pb-1 gap-4">
            <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
              <Heart
                size={26}
                color={liked ? "#ef4444" : iconColor}
                fill={liked ? "#ef4444" : "transparent"}
              />
            </TouchableOpacity>
            <MessageCircle size={26} color={iconColor} />
          </View>

          {/* ── Like count ── */}
          <Text className={`px-4 text-sm font-semibold mb-1 ${textPrimary}`}>
            {likeCount} {likeCount === 1 ? "curtida" : "curtidas"}
          </Text>

          {/* ── Caption ── */}
          {!!post.caption && (
            <View className="px-4 mb-3 flex-row flex-wrap gap-1">
              <TouchableOpacity onPress={navigateToUser(post.userId)}>
                <Text className={`text-sm font-semibold ${textPrimary}`}>{post.user?.name}</Text>
              </TouchableOpacity>
              <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {post.caption}
              </Text>
            </View>
          )}

          {/* ── Comments ── */}
          <View className="px-4 mb-4">
            {comments.length > 0 && (
              <Text className={`text-sm mb-2 ${textMuted}`}>
                {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
              </Text>
            )}
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isDarkMode={isDarkMode}
                onUserPress={comment.user?.id ? navigateToUser(comment.user.id) : undefined}
              />
            ))}
          </View>
        </ScrollView>

        {/* ── Comment input ── */}
        <View
          className={`flex-row items-center px-4 py-3 gap-3 border-t ${
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <UserAvatar name={user?.email} size="sm" />
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Adicione um comentário..."
            placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
            className={`flex-1 text-sm ${textPrimary}`}
            multiline
          />
          <TouchableOpacity
            onPress={onCommentSubmit}
            disabled={!commentText.trim() || commenting}
            activeOpacity={0.7}
          >
            {commenting ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Send
                size={20}
                color={commentText.trim() ? "#4f46e5" : isDarkMode ? "#6b7280" : "#9ca3af"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── FAB: novo post ── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 96,
          right: 20,
          opacity: fabAnim,
          transform: [{ scale: fabAnim }],
        }}
        pointerEvents={fabVisible.current ? "auto" : "none"}
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
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Full-screen image viewer ── */}
      <ImageViewerModal
        images={imageList}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}
