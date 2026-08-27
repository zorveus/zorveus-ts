import React from "react";
import { useZorveusAuth, type UseZorveusAuthReturn } from "../hooks/useZorveusAuth";
import { ZorveusIcon } from "./ZorveusIcon";

export interface ConnectWalletButtonProps {
  /**
   * Pre-configured visual style variant.
   * @default "default"
   */
  variant?: "default" | "dark" | "outline" | "secondary";

  /**
   * Size presets following standard button sizing guidelines.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * OAuth permission scopes to request.
   * @default ["inference:write", "models:*"]
   */
  scopes?: string[];

  /**
   * Callback invoked when wallet connection succeeds.
   */
  onSuccess?: (data: { accessToken: string; appConnectionId?: string }) => void;

  /**
   * Callback invoked when wallet connection encounters an error.
   */
  onError?: (error: Error) => void;

  /**
   * Label rendered when disconnected.
   * @default "Connect AI Wallet"
   */
  children?: React.ReactNode;

  /**
   * Custom label rendered when authorization is pending.
   * @default "Connecting..."
   */
  loadingLabel?: React.ReactNode;

  /**
   * Custom label rendered when connection is active.
   * @default "Connected"
   */
  connectedLabel?: React.ReactNode;

  /**
   * Custom icon element to replace the default Zorveus logo.
   */
  icon?: React.ReactNode;

  /**
   * Whether to render the leading brand logo icon.
   * @default true
   */
  showIcon?: boolean;

  /**
   * If true, removes all built-in inline styles for seamless Tailwind CSS / custom design system styling.
   * @default false
   */
  unstyled?: boolean;

  /**
   * Custom render prop to completely replace the button markup with your own design.
   */
  renderCustom?: (auth: UseZorveusAuthReturn) => React.ReactNode;

  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function ConnectWalletButton({
  variant = "default",
  size = "md",
  scopes = ["inference:write", "models:*"],
  onSuccess,
  onError,
  children = "Connect AI Wallet",
  loadingLabel = "Connecting...",
  connectedLabel = "Connected",
  icon,
  showIcon = true,
  unstyled = false,
  renderCustom,
  className,
  iconClassName,
  labelClassName,
  style,
  disabled = false
}: ConnectWalletButtonProps): React.JSX.Element {
  const auth = useZorveusAuth();
  const { connect, isLoading, isConnected, accessToken, appConnectionId } = auth;

  if (renderCustom) {
    return <>{renderCustom(auth)}</>;
  }

  const handleClick = async () => {
    if (disabled || isLoading) return;
    try {
      await connect(scopes);
      if (accessToken) {
        onSuccess?.({
          accessToken,
          appConnectionId: appConnectionId || undefined
        });
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      onError?.(e);
    }
  };

  // Base size presets
  const sizeStyles: Record<string, { height: string; padding: string; fontSize: string; iconSize: number }> = {
    sm: { height: "36px", padding: "0 14px", fontSize: "13px", iconSize: 18 },
    md: { height: "42px", padding: "0 18px", fontSize: "14px", iconSize: 22 },
    lg: { height: "50px", padding: "0 22px", fontSize: "16px", iconSize: 26 }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // Clean, standard variant presets
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "#FFFFFF",
      color: "#0F172A",
      border: "1px solid #CBD5E1",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
    },
    dark: {
      backgroundColor: "#0F172A",
      color: "#F8FAFC",
      border: "1px solid #334155",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.15)"
    },
    outline: {
      backgroundColor: "transparent",
      color: "#2563EB",
      border: "1.5px solid #2563EB"
    },
    secondary: {
      backgroundColor: "#F1F5F9",
      color: "#1E293B",
      border: "1px solid #E2E8F0"
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  const defaultButtonStyle: React.CSSProperties = unstyled
    ? {}
    : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        borderRadius: "8px",
        fontWeight: 600,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: "all 150ms ease",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        height: currentSize.height,
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        lineHeight: 1,
        boxSizing: "border-box",
        userSelect: "none",
        ...currentVariant,
        ...style
      };

  const renderLogoIcon = () => {
    if (!showIcon) return null;
    if (icon) return icon;
    return (
      <span className={iconClassName} style={{ display: "inline-flex", alignItems: "center" }}>
        <ZorveusIcon size={currentSize.iconSize} />
      </span>
    );
  };

  const labelContent = isLoading ? loadingLabel : isConnected ? connectedLabel : children;

  return (
    <button
      type="button"
      className={className}
      style={defaultButtonStyle}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {renderLogoIcon()}
      <span className={labelClassName}>{labelContent}</span>
    </button>
  );
}
