import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationData } from "@/services/notifications";

export type NotificationHistoryItem = {
  id: string;
  title: string;
  body: string;
  data: NotificationData | null;
  receivedAt: string; // ISO string para serialização
  read: boolean;
};

type NotificationHistoryContextType = {
  notifications: NotificationHistoryItem[];
  unreadCount: number;
  addNotification: (item: Pick<NotificationHistoryItem, "title" | "body" | "data">) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

const NotificationHistoryContext = createContext<NotificationHistoryContextType | null>(null);

const STORAGE_KEY = "@mural:notification_history";
const MAX_NOTIFICATIONS = 50;

export function NotificationHistoryProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const counterRef = useRef(0);
  const initialized = useRef(false);

  // Carrega do storage na inicialização
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as NotificationHistoryItem[];
          setNotifications(parsed);
        }
      })
      .catch(() => {})
      .finally(() => {
        initialized.current = true;
      });
  }, []);

  // Persiste sempre que a lista muda (após inicialização)
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(() => {});
  }, [notifications]);

  const addNotification = useCallback(
    (item: Pick<NotificationHistoryItem, "title" | "body" | "data">) => {
      counterRef.current += 1;
      const newItem: NotificationHistoryItem = {
        ...item,
        id: `notif-${Date.now()}-${counterRef.current}`,
        receivedAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newItem, ...prev].slice(0, MAX_NOTIFICATIONS));
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationHistoryContext.Provider
      value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}
    >
      {children}
    </NotificationHistoryContext.Provider>
  );
}

export function useNotificationHistory() {
  const ctx = useContext(NotificationHistoryContext);
  if (!ctx)
    throw new Error("useNotificationHistory deve ser usado dentro de NotificationHistoryProvider");
  return ctx;
}
