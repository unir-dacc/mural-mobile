import React, { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useNotificationSetup } from "@/hooks/useNotificationSetup";
import "../global.css";
import { getNotificationImage } from "@/services/notifications";
import { NotificationBanner } from "@/components/NotificationBanner";

// Configuração de notificações push
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const imageUrl = getNotificationImage(notification);

    if (!imageUrl) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }

    if (Platform.OS === "ios") {
      // iOS suporta attachments
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        attachments: [
          {
            identifier: "image-attachment",
            url: imageUrl,
            type: "image",
          },
        ],
      };
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        },
        trigger: null,
      });

      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      } as any;
    }
  },
});

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const { banner, setBanner } = useNotificationSetup();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup =
      segments[0] === "login" || segments[0] === "reset-password" || segments[0] === "register";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    if (banner) {
      const timer = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [banner, setBanner]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        {banner && (
          <NotificationBanner
            title={banner.title!}
            body={banner.body!}
            imageUrl={banner.imageUrl}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthGuard />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
