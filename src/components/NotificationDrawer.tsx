import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions, FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  BookOpen,
  Clock,
  Globe2,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Trash2,
  User,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import {
  NotificationHistoryItem,
  useNotificationHistory,
} from "@/context/NotificationHistoryContext";
import { getNotificationRoute, NotificationData } from "@/services/notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.round(SCREEN_WIDTH * 0.85);

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function NotifIcon({ data }: { data: NotificationData | null }) {
  if (!data) return <Bell size={18} color="#6b7280" />;
  switch (data.type) {
    case "like":
      return <Heart size={18} color="#ef4444" fill="#ef4444" />;
    case "comment":
      return <MessageCircle size={18} color="#4f46e5" />;
    case "face_detected":
      return <User size={18} color="#0ea5e9" />;
    case "new_post":
      return <ImageIcon size={18} color="#10b981" />;
    case "memory_reminder":
      return <Clock size={18} color="#f59e0b" />;
    case "user_retrospective_story":
      return <BookOpen size={18} color="#8b5cf6" />;
    case "global_retrospective_story":
      return <Globe2 size={18} color="#f97316" />;
    default:
      return <Bell size={18} color="#6b7280" />;
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ visible, onClose }: Props) {
  const { isDarkMode } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotificationHistory();
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (unreadCount > 0) markAllRead();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePressItem = useCallback(
    (item: NotificationHistoryItem) => {
      if (!item.data) return;
      const route = getNotificationRoute(item.data);
      if (!route) return;
      onClose();
      setTimeout(() => router.push(route), 200);
    },
    [onClose, router]
  );

  const bg = isDarkMode ? "#111827" : "#ffffff";
  const headerBg = isDarkMode ? "#1f2937" : "#f9fafb";
  const textPrimary = isDarkMode ? "#f9fafb" : "#111827";
  const textMuted = isDarkMode ? "#9ca3af" : "#6b7280";
  const border = isDarkMode ? "#374151" : "#e5e7eb";
  const iconCircleBg = isDarkMode ? "#374151" : "#f3f4f6";
  const unreadBg = isDarkMode ? "#1e1b4b" : "#eef2ff";

  const renderItem = ({ item }: { item: NotificationHistoryItem }) => (
    <TouchableOpacity
      onPress={() => handlePressItem(item)}
      activeOpacity={item.data ? 0.7 : 1}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: item.read ? "transparent" : unreadBg,
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: iconCircleBg,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <NotifIcon data={item.data} />
      </View>

      <View style={{ flex: 1 }}>
        {!!item.title && (
          <Text
            style={{
              color: textPrimary,
              fontSize: 13,
              fontWeight: item.read ? "400" : "600",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        )}
        {!!item.body && (
          <Text style={{ color: textMuted, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
            {item.body}
          </Text>
        )}
      </View>

      <Text style={{ color: textMuted, fontSize: 11, flexShrink: 0, marginTop: 2 }}>
        {timeAgo(item.receivedAt)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dark overlay — tapping closes the drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: overlayAnim,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: bg,
          transform: [{ translateX: slideAnim }],
          shadowColor: "#000",
          shadowOffset: { width: -4, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 16,
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: 56,
            paddingBottom: 14,
            paddingHorizontal: 16,
            backgroundColor: headerBg,
            borderBottomWidth: 1,
            borderBottomColor: border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: textPrimary, fontSize: 17, fontWeight: "700" }}>Notificações</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllRead}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: "#4f46e5",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Marcar lidas</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAll} hitSlop={8}>
                <Trash2 size={18} color={textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List or empty state */}
        {notifications.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              paddingHorizontal: 32,
            }}
          >
            <Bell size={44} color={isDarkMode ? "#374151" : "#d1d5db"} />
            <Text style={{ color: textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
              Nenhuma notificação recebida nesta sessão.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </Animated.View>
    </Modal>
  );
}
