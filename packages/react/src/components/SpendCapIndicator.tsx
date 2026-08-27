import React from "react";
import { tokens } from "../styles/styles";
import { useZorveusSpend, type UseZorveusSpendReturn } from "../hooks/useZorveusSpend";

export interface SpendCapStatusLabels {
  onTrack?: string;
  warning?: string;
  capReached?: string;
  uncapped?: string;
}

export interface SpendCapRenderData {
  current: number;
  currentFormatted: string;
  limit: number | null;
  limitFormatted: string | null;
  remainingBalance: number | null;
  remainingBalanceFormatted: string | null;
  percentage: number;
  period: string;
  currency: string;
  isUncapped: boolean;
  statusText: string;
  statusColor: string;
  spendData: UseZorveusSpendReturn;
}

export interface SpendCapIndicatorProps {
  /**
   * Current amount spent in the active period.
   * If omitted, automatically queried from the active Zorveus connection via `useZorveusSpend()`.
   */
  current?: string | number;

  /**
   * Spending cap limit for the active period.
   * If omitted, automatically queried from the active Zorveus connection via `useZorveusSpend()`.
   */
  limit?: string | number | null;

  /**
   * Period interval ("daily" | "weekly" | "monthly" | "lifetime").
   * @default "monthly"
   */
  period?: "daily" | "weekly" | "monthly" | "lifetime" | string;

  /**
   * Currency code (e.g., "USD").
   * @default "USD"
   */
  currency?: string;

  /**
   * Color theme preset ("light" or "dark").
   * @default "light"
   */
  theme?: "light" | "dark";

  /**
   * Ratio at which the progress bar transitions to warning color (default: 0.8 / 80%).
   * @default 0.8
   */
  warningThreshold?: number;

  /**
   * Whether to render the header details (labels, spent amounts, percentage).
   * @default true
   */
  showDetails?: boolean;

  /**
   * Custom text overrides for status indicators.
   */
  statusLabels?: SpendCapStatusLabels;

  /**
   * Custom formatter for monetary numbers.
   */
  formatAmount?: (amount: number, currency: string) => string;

  /**
   * Custom color overrides.
   */
  barColor?: string;
  warningColor?: string;
  dangerColor?: string;
  trackColor?: string;

  /**
   * If true, removes all built-in inline styles for pure Tailwind CSS styling.
   * @default false
   */
  unstyled?: boolean;

  /**
   * Custom render prop to completely customize the spending meter.
   */
  renderCustom?: (data: SpendCapRenderData) => React.ReactNode;

  className?: string;
  headerClassName?: string;
  labelClassName?: string;
  statusClassName?: string;
  trackClassName?: string;
  fillClassName?: string;
  style?: React.CSSProperties;
}

export function SpendCapIndicator(props: SpendCapIndicatorProps): React.JSX.Element {
  const isAutoMode = props.current === undefined && props.limit === undefined;
  const autoSpend = useZorveusSpend({ autoFetch: isAutoMode });

  const currentVal = props.current !== undefined ? props.current : autoSpend.spent;
  const limitVal = props.limit !== undefined ? props.limit : autoSpend.spendCap;
  const period = props.period || autoSpend.period || "monthly";
  const currency = props.currency || autoSpend.currency || "USD";
  const theme = props.theme || "light";
  const warningThreshold = props.warningThreshold ?? 0.8;
  const showDetails = props.showDetails ?? true;

  const numCurrent = typeof currentVal === "number" ? currentVal : parseFloat(String(currentVal || "0"));
  const numLimit = limitVal !== null && limitVal !== undefined
    ? (typeof limitVal === "number" ? limitVal : parseFloat(String(limitVal || "0")))
    : null;

  const isUncapped = numLimit === null || isNaN(numLimit) || numLimit <= 0;
  const ratio = !isUncapped && numLimit > 0 ? numCurrent / numLimit : 0;
  const percentage = isUncapped ? 100 : Math.min(100, Math.max(0, ratio * 100));

  const format = props.formatAmount || ((amt, cur) => {
    const sym = cur === "USD" ? "$" : `${cur} `;
    return `${sym}${amt.toFixed(2)}`;
  });

  const defaultStatusLabels: Required<SpendCapStatusLabels> = {
    onTrack: "On Track",
    warning: "Approaching Limit",
    capReached: "Limit Reached",
    uncapped: "Active (No Limit)",
    ...props.statusLabels
  };

  // High-contrast, WCAG-compliant color palettes for light and dark modes
  const themeColors = theme === "dark"
    ? {
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        track: "#334155",
        onTrack: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171"
      }
    : {
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        track: "#E2E8F0",
        onTrack: "#059669",
        warning: "#D97706",
        danger: "#DC2626"
      };

  let statusColor = props.barColor || themeColors.onTrack;
  let statusText = defaultStatusLabels.onTrack;

  if (isUncapped) {
    statusColor = props.barColor || themeColors.onTrack;
    statusText = defaultStatusLabels.uncapped;
  } else if (ratio >= 1.0) {
    statusColor = props.dangerColor || themeColors.danger;
    statusText = defaultStatusLabels.capReached;
  } else if (ratio >= warningThreshold) {
    statusColor = props.warningColor || themeColors.warning;
    statusText = defaultStatusLabels.warning;
  }

  const renderData: SpendCapRenderData = {
    current: numCurrent,
    currentFormatted: format(numCurrent, currency),
    limit: numLimit,
    limitFormatted: numLimit !== null ? format(numLimit, currency) : null,
    remainingBalance: autoSpend.remainingBalance,
    remainingBalanceFormatted: autoSpend.remainingBalanceFormatted,
    percentage,
    period,
    currency,
    isUncapped,
    statusText,
    statusColor,
    spendData: autoSpend
  };

  if (props.renderCustom) {
    return <>{props.renderCustom(renderData)}</>;
  }

  const containerStyle: React.CSSProperties = props.unstyled
    ? {}
    : {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
        fontFamily: tokens.fonts.sans,
        ...props.style
      };

  const headerStyle: React.CSSProperties = props.unstyled
    ? {}
    : {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
        color: themeColors.textSecondary
      };

  const trackStyle: React.CSSProperties = props.unstyled
    ? {}
    : {
        width: "100%",
        height: "6px",
        backgroundColor: props.trackColor || themeColors.track,
        borderRadius: tokens.radii.full,
        overflow: "hidden",
        position: "relative"
      };

  const fillStyle: React.CSSProperties = props.unstyled
    ? { width: `${percentage}%` }
    : {
        width: `${percentage}%`,
        height: "100%",
        backgroundColor: statusColor,
        borderRadius: tokens.radii.full,
        transition: "width 300ms ease, background-color 300ms ease"
      };

  const valueText = isUncapped
    ? `${renderData.currentFormatted} spent (${period}, uncapped)`
    : `${renderData.currentFormatted} of ${renderData.limitFormatted} spent (${percentage.toFixed(0)}%)`;

  return (
    <div
      className={props.className}
      style={containerStyle}
      role="progressbar"
      aria-valuenow={isUncapped ? undefined : Number(percentage.toFixed(0))}
      aria-valuemin={isUncapped ? undefined : 0}
      aria-valuemax={isUncapped ? undefined : 100}
      aria-valuetext={valueText}
      aria-label={`Spending Cap (${period})`}
    >
      {showDetails && (
        <div className={props.headerClassName} style={headerStyle}>
          <span className={props.labelClassName}>
            {period.charAt(0).toUpperCase() + period.slice(1)} Spend:{" "}
            <strong style={{ color: themeColors.textPrimary, fontFamily: tokens.fonts.mono, fontWeight: 700 }}>
              {renderData.currentFormatted}
            </strong>{" "}
            {!isUncapped && renderData.limitFormatted && (
              <span>/ {renderData.limitFormatted}</span>
            )}
          </span>
          <span className={props.statusClassName} style={{ color: statusColor, fontWeight: 600 }}>
            {isUncapped ? statusText : `${statusText} (${percentage.toFixed(0)}%)`}
          </span>
        </div>
      )}

      <div className={props.trackClassName} style={trackStyle}>
        <div className={props.fillClassName} style={fillStyle} />
      </div>
    </div>
  );
}
