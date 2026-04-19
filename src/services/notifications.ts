import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const CATEGORY_NEW_POST = "new_post";
export const CATEGORY_DEFAULT = "default_notification";

export const ACTION_LIKE = "LIKE";

export type NotificationType = "like" | "comment" | "face_detected" | "new_post" | "general";

export type NotificationData = {
  postId: string;
  type: NotificationType;
  mediaId?: string;
  actorId?: string;
  actorName?: string;
  imageUrl?: string; // adicionado
};

export type AppNotification = {
  title?: string;
  body?: string;
  data?: NotificationData;
};

// Registro de push token
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[Notifications] Push notifications require a physical device.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Mural de Fotos",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4f46e5",
      sound: "default",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] Permission not granted.");
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

  return token.data;
}

// Configura categorias e ações
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(CATEGORY_NEW_POST, [
    {
      identifier: ACTION_LIKE,
      buttonTitle: "❤️ Curtir",
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
}

// Retorna a imagem da notificação, considerando backend (imageUrl)
export function getNotificationImage(notification: Notifications.Notification): string | undefined {
  const content = notification.request.content as any;

  // iOS envia attachments -> content.image
  if (typeof content.image === "string" && content.image.length > 0) {
    return content.image;
  }

  // fallback para Android ou data.imageUrl
  const dataImage = content.data?.imageUrl;
  if (typeof dataImage === "string" && dataImage.length > 0) {
    return dataImage;
  }

  return undefined;
}
