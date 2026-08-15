/**
 * Zorveus Design System tokens and base CSS rules for React components.
 * Mint accent: #4DFFB4
 */

export const tokens = {
  colors: {
    brandMint: "#4DFFB4",
    brandMintHover: "#39E69E",
    brandMintDark: "#003822",
    brandMintGlow: "rgba(77, 255, 180, 0.25)",
    bgDark: "#0B0F17",
    bgCard: "#121824",
    bgCardHover: "#182232",
    borderDark: "rgba(255, 255, 255, 0.1)",
    borderActive: "rgba(77, 255, 180, 0.4)",
    textPrimary: "#F3F4F6",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    warning: "#FFA04D",
    warningGlow: "rgba(255, 160, 77, 0.25)",
    danger: "#FF4D4D",
    dangerGlow: "rgba(255, 77, 77, 0.25)"
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    full: "9999px"
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  }
} as const;
