import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
  preference: ThemePreference;
  isDarkMode: boolean;
  setPreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = "theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreferenceState(saved);
      }
    });
  }, []);

  const setPreference = async (pref: ThemePreference) => {
    await SecureStore.setItemAsync(THEME_KEY, pref);
    setPreferenceState(pref);
  };

  const isDarkMode = preference === "system" ? systemScheme === "dark" : preference === "dark";

  return (
    <ThemeContext.Provider value={{ preference, isDarkMode, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
