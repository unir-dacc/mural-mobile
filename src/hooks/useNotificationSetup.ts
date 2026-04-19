import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { updateCurrentUser, likePost } from "@/api/generated/api";
import { useAuth } from "@/context/AuthContext";
import { UpdateUserDtoPlatform } from "@/api/generated/model";
import {
  registerForPushNotifications,
  setupNotificationCategories,
  ACTION_LIKE,
  NotificationData,
  getNotificationImage,
} from "@/services/notifications";

export function useNotificationSetup() {
  const router = useRouter();
  const { user } = useAuth();

  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);
  const isReady = useRef(false);

  const [banner, setBanner] = useState<{
    title: string | null;
    body: string | null;
    imageUrl: string;
  } | null>(null);

  // Trata quando o usuário interage com a notificação
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;
    const actionId = response.actionIdentifier;

    if (!data?.postId) return;

    if (actionId === ACTION_LIKE) {
      likePost(data.postId).catch((err) =>
        console.error("[Notifications] Erro ao curtir via push:", err)
      );
    } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.push(`/post/${data.postId}`);
    }
  };

  // Trata notificações recebidas enquanto o app está em foreground
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log(notification);
    const imageUrl = getNotificationImage(notification);
    const title = notification.request.content.title ?? "";
    const body = notification.request.content.body ?? "";

    if (imageUrl) {
      if (Platform.OS === "android") {
        // No Android, mostra um banner customizado no app
        setBanner({ title, body, imageUrl });
      }
      // iOS exibirá a imagem automaticamente via attachments do push
    }
  };

  useEffect(() => {
    if (user && !isReady.current) {
      (async () => {
        try {
          const token = await registerForPushNotifications();

          if (token) {
            const platform =
              Platform.OS === "android" ? UpdateUserDtoPlatform.ANDROID : UpdateUserDtoPlatform.IOS;

            await updateCurrentUser({ token, platform });
            console.log("[Notifications] Token sincronizado.");
          }

          await setupNotificationCategories();
          isReady.current = true;
        } catch (error) {
          console.error("[Notifications] Falha no setup:", error);
        }
      })();
    }

    // Listener quando o usuário interage com a notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Listener para notificações recebidas no foreground
    receivedListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Caso o app tenha sido aberto a partir de uma notificação
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      responseListener.current?.remove();
      receivedListener.current?.remove();
    };
  }, [user, router]);

  return { banner, setBanner }; // Retornamos para renderizar o banner no layout
}
