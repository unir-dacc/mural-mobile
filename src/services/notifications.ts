import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const CATEGORY_NEW_POST = "new_post";
export const CATEGORY_DEFAULT = "default_notification";

export const ACTION_LIKE = "LIKE";

export type PushNotificationType =
  | "comment"
  | "like"
  | "face_detected"
  | "new_post"
  | "memory_reminder"
  | "user_retrospective_story"
  | "global_retrospective_story";

export type PostPushData = {
  type: Exclude<PushNotificationType, "user_retrospective_story" | "global_retrospective_story">;
  postId?: string;
  mediaId?: string;
  actorId?: string;
  actorName?: string;
  imageUrl?: string;
};

export type StoryPushData = {
  type: "user_retrospective_story" | "global_retrospective_story";
  storyId: string;
  imageUrl?: string;
};

export type NotificationData = PostPushData | StoryPushData;

export type AppNotification = {
  title?: string;
  body?: string;
  data?: NotificationData;
};

function getNotificationContent(
  source: Notifications.Notification | Notifications.NotificationResponse
): Notifications.NotificationContent {
  if ("notification" in source) {
    return source.notification.request.content;
  }

  return source.request.content;
}

export function parseNotificationData(
  source: Notifications.Notification | Notifications.NotificationResponse
): NotificationData | null {
  const content = getNotificationContent(source);
  const rawData = content.data as Record<string, unknown> | undefined;

  if (!rawData || typeof rawData.type !== "string") {
    return null;
  }

  const type = rawData.type as PushNotificationType;
  const imageUrl = typeof rawData.imageUrl === "string" ? rawData.imageUrl : undefined;

  if (type === "user_retrospective_story" || type === "global_retrospective_story") {
    if (typeof rawData.storyId !== "string" || rawData.storyId.length === 0) {
      return null;
    }

    return {
      type,
      storyId: rawData.storyId,
      imageUrl,
    };
  }

  return {
    type,
    postId: typeof rawData.postId === "string" ? rawData.postId : undefined,
    mediaId: typeof rawData.mediaId === "string" ? rawData.mediaId : undefined,
    actorId: typeof rawData.actorId === "string" ? rawData.actorId : undefined,
    actorName: typeof rawData.actorName === "string" ? rawData.actorName : undefined,
    imageUrl,
  };
}

export function getNotificationRoute(
  data: NotificationData
): `/story/${string}` | `/post/${string}` | null {
  if ("storyId" in data) {
    return `/story/${data.storyId}`;
  }

  if (data.postId) {
    return `/post/${data.postId}`;
  }

  return null;
}

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
  const content = notification.request.content as Notifications.NotificationContent & {
    image?: string;
  };

  // iOS envia attachments -> content.image
  if (typeof content.image === "string" && content.image.length > 0) {
    return content.image;
  }

  // fallback para Android ou data.imageUrl
  const dataImage = parseNotificationData(notification)?.imageUrl;
  if (typeof dataImage === "string" && dataImage.length > 0) {
    return dataImage;
  }

  return undefined;
}
