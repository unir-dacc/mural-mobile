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
  Alert,
  Switch,
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
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  getPostById,
  commentsControllerGetComments,
  commentsControllerComment,
  likePost,
  unlikePost,
  likesControllerLiked,
  updatePostById,
  deletePostById,
} from "@/api/generated/api";
import { GetPostDto, CommentsControllerGetComments200Item } from "@/api/generated/model";
import type { UpdatePostDto } from "@/api/generated/model/updatePostDto";
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

const PostVideoPlayer: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
      contentFit="cover"
      nativeControls
    />
  );
};

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
          <PostVideoPlayer uri={media.imageUrl} />
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
  const [notFound, setNotFound] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

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
      .catch(() => setNotFound(true))
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

  const handleUpdatePost = useCallback(
    async (payload: UpdatePostDto) => {
      if (!id || !post) return null;
      setSavingPost(true);
      try {
        const updatedPost = await updatePostById(id, payload);
        setPost(updatedPost);
        return updatedPost;
      } finally {
        setSavingPost(false);
      }
    },
    [id, post]
  );

  const handleDeletePost = useCallback(async () => {
    if (!id) return false;
    setDeletingPost(true);
    try {
      await deletePostById(id);
      return true;
    } finally {
      setDeletingPost(false);
    }
  }, [id]);

  return {
    post,
    comments,
    liked,
    likeCount,
    loading,
    notFound,
    commenting,
    savingPost,
    deletingPost,
    handleLike,
    handleComment,
    handleUpdatePost,
    handleDeletePost,
  };
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
  const [ownerMenuVisible, setOwnerMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftCaption, setDraftCaption] = useState("");
  const [draftIsPublic, setDraftIsPublic] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const {
    post,
    comments,
    liked,
    likeCount,
    loading,
    notFound,
    commenting,
    savingPost,
    deletingPost,
    handleLike,
    handleComment,
    handleUpdatePost,
    handleDeletePost,
  } = usePostDetail(id);

  const mediaList = post?.Media ?? [];
  const imageList = mediaList.filter((m) => !m.isVideo);
  const isOwner = user?.sub === post?.userId;

  useEffect(() => {
    if (!post) return;
    setDraftCaption(post.caption ?? "");
    setDraftIsPublic(post.public);
  }, [post]);

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

  const onCommentSubmit = useCallback(() => {
    handleComment(commentText, () => setCommentText(""));
  }, [commentText, handleComment]);

  const navigateToUser = useCallback(
    (userId: string) => () => router.push(`/user/${userId}`),
    [router]
  );

  const openEditModal = useCallback(() => {
    if (!post) return;
    setDraftCaption(post.caption ?? "");
    setDraftIsPublic(post.public);
    setOwnerMenuVisible(false);
    setEditModalVisible(true);
  }, [post]);

  const onSavePost = useCallback(async () => {
    if (!post) return;
    try {
      const updated = await handleUpdatePost({
        caption: draftCaption.trim(),
        public: String(draftIsPublic),
      });
      if (!updated) return;
      setEditModalVisible(false);
      Alert.alert("Post atualizado", "As alterações foram salvas com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o post. Tente novamente.");
    }
  }, [draftCaption, draftIsPublic, handleUpdatePost, post]);

  const onDeletePost = useCallback(() => {
    setOwnerMenuVisible(false);
    Alert.alert("Excluir post", "Essa ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const deleted = await handleDeletePost();
            if (!deleted) return;
            router.replace("/");
          } catch {
            Alert.alert("Erro", "Não foi possível excluir o post. Tente novamente.");
          }
        },
      },
    ]);
  }, [handleDeletePost, router]);

  // ── Error state ──
  if (notFound) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <TopBar title="Post" />
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className={`text-base text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Este post não está disponível.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-indigo-500 text-sm font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
  const modalBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const inputBg = isDarkMode ? "bg-gray-900" : "bg-gray-50";
  const inputBorder = isDarkMode ? "border-gray-700" : "border-gray-200";

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <KeyboardAvoidingView behavior="padding" className={`flex-1 ${bg}`}>
        <TopBar
          title="Post"
          right={
            isOwner ? (
              <TouchableOpacity
                onPress={() => setOwnerMenuVisible(true)}
                activeOpacity={0.7}
                disabled={deletingPost}
              >
                {deletingPost ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <MoreVertical size={20} color={iconColor} />
                )}
              </TouchableOpacity>
            ) : undefined
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
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

      {/* ── Full-screen image viewer ── */}
      <ImageViewerModal
        images={imageList}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />

      <Modal
        visible={ownerMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOwnerMenuVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/40 justify-start"
          onPress={() => setOwnerMenuVisible(false)}
        >
          <View
            className={`mt-20 mx-4 ml-auto w-48 rounded-2xl overflow-hidden ${modalBg}`}
            style={{ elevation: 10, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16 }}
          >
            <TouchableOpacity
              onPress={openEditModal}
              className="flex-row items-center gap-3 px-4 py-3"
            >
              <Pencil size={18} color={iconColor} />
              <Text className={`text-sm font-medium ${textPrimary}`}>Editar post</Text>
            </TouchableOpacity>
            <View className={`h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <TouchableOpacity
              onPress={onDeletePost}
              className="flex-row items-center gap-3 px-4 py-3"
            >
              <Trash2 size={18} color="#ef4444" />
              <Text className="text-sm font-medium text-red-500">Excluir post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/50 px-4"
        >
          <View
            className={`rounded-3xl p-5 ${modalBg}`}
            style={{ elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className={`text-lg font-bold ${textPrimary}`}>Editar post</Text>
                <Text className={`text-sm mt-1 ${textMuted}`}>
                  Atualize a legenda e a visibilidade do seu post.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} activeOpacity={0.7}>
                <X size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Legenda</Text>
                <TextInput
                  value={draftCaption}
                  onChangeText={setDraftCaption}
                  placeholder="Escreva uma legenda para este post..."
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
                  multiline
                  textAlignVertical="top"
                  className={`min-h-[120px] rounded-2xl border px-4 py-3 text-sm ${textPrimary} ${inputBg} ${inputBorder}`}
                />
              </View>

              <View
                className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${inputBg} ${inputBorder}`}
              >
                <View className="flex-1 pr-3">
                  <Text className={`text-sm font-semibold ${textPrimary}`}>Post público</Text>
                  <Text className={`text-xs mt-1 ${textMuted}`}>
                    Quando ativado, outros usuários podem encontrar este post.
                  </Text>
                </View>
                <Switch value={draftIsPublic} onValueChange={setDraftIsPublic} />
              </View>
            </View>

            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                disabled={savingPost}
                className={`flex-1 rounded-2xl border py-3 items-center ${inputBorder}`}
              >
                <Text className={`text-sm font-semibold ${textPrimary}`}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSavePost}
                disabled={savingPost}
                className={`flex-1 rounded-2xl py-3 items-center ${
                  savingPost ? "bg-indigo-400" : "bg-indigo-600"
                }`}
              >
                {savingPost ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
