import React from "react";

export interface ZorveusIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: "mark" | "iconOnly";
  ariaHidden?: boolean;
}

/**
 * Official Zorveus Logo Mark component.
 */
export function ZorveusIcon({
  size = 20,
  className,
  style,
  variant = "mark",
  ariaHidden = true
}: ZorveusIconProps): React.JSX.Element {
  if (variant === "iconOnly") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
        aria-hidden={ariaHidden}
      >
        <path d="M13 11.5H27" stroke="#4DFFB4" strokeWidth="4.25" strokeLinecap="round" />
        <path d="M27 11.5L10 28.5H27" stroke="#4DFFB4" strokeWidth="4.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      aria-hidden={ariaHidden}
    >
      <rect x="4" y="4" width="32" height="32" rx="10" fill="#171717" />
      <path d="M13 11.5H27" stroke="#4DFFB4" strokeWidth="4.25" strokeLinecap="round" />
      <path d="M27 11.5L10 28.5H27" stroke="#4DFFB4" strokeWidth="4.25" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4.75" y="4.75" width="30.5" height="30.5" rx="9.25" stroke="#4DFFB4" strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
}
