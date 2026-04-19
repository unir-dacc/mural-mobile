/**
 * Cores baseadas na paleta OKLCH do projeto Mural de Fotos.
 */

const lightPalette = {
  background: "#FFFFFF",
  foreground: "#020617",
  primary: "#0f172a",
  secondary: "#f1f5f9",
  destructive: "#ef4444",
  border: "#e2e8f0",
};

const darkPalette = {
  background: "#020617",
  foreground: "#f8fafc",
  primary: "#e2e8f0",
  secondary: "#1e293b",
  destructive: "#ef4444",
  border: "rgba(255, 255, 255, 0.1)",
};

export const Colors = {
  light: {
    text: lightPalette.foreground,
    background: lightPalette.background,
    tint: lightPalette.primary,
    icon: "#64748b",
    tabIconDefault: "#64748b",
    tabIconSelected: lightPalette.primary,
    border: lightPalette.border,
  },
  dark: {
    text: darkPalette.foreground,
    background: darkPalette.background,
    tint: darkPalette.primary,
    icon: "#94a3b8",
    tabIconDefault: "#94a3b8",
    tabIconSelected: darkPalette.primary,
    border: darkPalette.border,
  },
};
