import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Heart, MessageCircle, Send, Play } from "lucide-react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const [post, setPost] = useState<GetPostDto | null>(null);
  const [comments, setComments] = useState<CommentsControllerGetComments200Item[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [mediaIndex, setMediaIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getPostById(id),
      commentsControllerGetComments(id),
      likesControllerLiked(id)
        .then(() => true)
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

  const handleLike = async () => {
    if (!id) return;
    try {
      if (liked) {
        await unlikePost(id);
        setLikeCount((p) => p - 1);
      } else {
        await likePost(id);
        setLikeCount((p) => p + 1);
      }
      setLiked((p) => !p);
    } catch {
      //}
    }

    const handleComment = async () => {
      if (!commentText.trim() || !id) return;
      setCommenting(true);
      try {
        await commentsControllerComment(id, { content: commentText.trim() });
        const data = await commentsControllerGetComments(id);
        setComments(data);
        setCommentText("");
      } catch {
        //
      } finally {
        setCommenting(false);
      }
    };

    const mediaList = post?.Media ?? [];

    const handleScroll = (e: any) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setMediaIndex(index);
    };

    if (loading || !post) {
      return (
        <View
          className={`flex-1 items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
        >
          <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#111"} />
        </View>
      );
    }

    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
        >
          <TopBar title="Post" />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header do post — avatar + nome clicável */}
            <View className="flex-row items-center px-4 py-3 gap-3">
              <UserAvatar
                name={post.user?.name}
                avatarUrl={post.user?.avatarUrl}
                size="md"
                onPress={() => router.push(`/user/${post.userId}`)}
              />
              <TouchableOpacity onPress={() => router.push(`/user/${post.userId}`)}>
                <Text
                  className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {post.user?.name ?? "Usuário"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Carrossel de mídias */}
            <View>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
              >
                {mediaList.map((media) => (
                  <View key={media.id} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
                    {media.isVideo ? (
                      <Video
                        source={{ uri: media.imageUrl }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                        resizeMode={ResizeMode.COVER}
                        useNativeControls
                        shouldPlay={false}
                      />
                    ) : (
                      <Image
                        source={{ uri: media.imageUrl }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                        resizeMode="cover"
                      />
                    )}
                    {media.isVideo && (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        pointerEvents="none"
                      >
                        <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
                          <Play size={22} color="white" fill="white" />
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              {mediaList.length > 1 && (
                <View className="flex-row justify-center gap-1 mt-2">
                  {mediaList.map((_, i) => (
                    <View
                      key={i}
                      className={`rounded-full ${i === mediaIndex ? "w-2 h-2 bg-indigo-600" : "w-1.5 h-1.5 bg-gray-400"}`}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Ações */}
            <View className="flex-row items-center px-4 pt-3 pb-1 gap-4">
              <TouchableOpacity onPress={handleLike}>
                <Heart
                  size={26}
                  color={liked ? "#ef4444" : isDarkMode ? "#f9fafb" : "#111827"}
                  fill={liked ? "#ef4444" : "transparent"}
                />
              </TouchableOpacity>
              <MessageCircle size={26} color={isDarkMode ? "#f9fafb" : "#111827"} />
            </View>

            {/* Likes */}
            <Text
              className={`px-4 text-sm font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {likeCount} {likeCount === 1 ? "curtida" : "curtidas"}
            </Text>

            {/* Caption */}
            {post.caption ? (
              <View className="px-4 mb-3 flex-row flex-wrap gap-1">
                <TouchableOpacity onPress={() => router.push(`/user/${post.userId}`)}>
                  <Text
                    className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {post.user?.name}
                  </Text>
                </TouchableOpacity>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {post.caption}
                </Text>
              </View>
            ) : null}

            {/* Comentários */}
            <View className="px-4 mb-4">
              {comments.length > 0 && (
                <Text className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
                </Text>
              )}
              {comments.map((comment) => (
                <View key={comment.id} className="flex-row gap-2 mb-3">
                  <UserAvatar
                    name={comment.user?.name}
                    avatarUrl={comment.user?.avatarUrl}
                    size="sm"
                    onPress={
                      comment.user?.id ? () => router.push(`/user/${comment.user!.id}`) : undefined
                    }
                  />
                  <View className="flex-1">
                    <Text className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      <Text className="font-semibold">{comment.user?.name} </Text>
                      {comment.content}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Input de comentário */}
          <View
            className={`flex-row items-center px-4 py-3 gap-3 border-t ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <UserAvatar name={user?.email} size="sm" />
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Adicione um comentário..."
              placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
              className={`flex-1 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
              multiline
            />
            <TouchableOpacity onPress={handleComment} disabled={!commentText.trim() || commenting}>
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
      </>
    );
  };
}
