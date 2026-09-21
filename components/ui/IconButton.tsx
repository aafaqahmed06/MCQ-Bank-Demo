"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "./cn";
import { Icon, type IconSize } from "./Icon";

type IconButtonVariant = "ghost" | "solid" | "danger";
type IconButtonSize = "sm" | "md" | "lg";

type IconButtonBaseProps = {
  icon: LucideIcon;
  /** Required — icon-only buttons have no visible text, so this is what
   * screen readers announce (also shown as the native title tooltip). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
  /** Active/selected visual state, e.g. the current nav route. */
  active?: boolean;
};

type IconButtonAsButton = IconButtonBaseProps & {
  href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof IconButtonBaseProps | "href">;

type IconButtonAsLink = IconButtonBaseProps & {
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof IconButtonBaseProps | "href">;

export type IconButtonProps = IconButtonAsButton | IconButtonAsLink;

// h-11 = 44px, the accessibility-spec minimum touch target.
const SIZE_STYLES: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

const ICON_SIZE: Record<IconButtonSize, IconSize> = {
  sm: "sm",
  md: "md",
  lg: "md",
};

const VARIANT_STYLES: Record<IconButtonVariant, string> = {
  ghost: "text-text-secondary hover:bg-primary/8 hover:text-text-primary",
  solid: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  danger: "text-error hover:bg-error/10",
};

const ACTIVE_STYLES: Record<IconButtonVariant, string> = {
  ghost: "bg-primary/12 text-primary",
  solid: "bg-primary-active text-white",
  danger: "bg-error/15 text-error",
};

export function IconButton(props: IconButtonProps) {
  const {
    icon,
    label,
    variant = "ghost",
    size = "md",
    active = false,
    className,
    href,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center rounded-control transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    SIZE_STYLES[size],
    active ? ACTIVE_STYLES[variant] : VARIANT_STYLES[variant],
    className
  );

  const content = <Icon icon={icon} size={ICON_SIZE[size]} />;

  if (href) {
    const anchorProps = rest as Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof IconButtonBaseProps
    >;
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        title={label}
        className={classes}
        {...anchorProps}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = rest as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof IconButtonBaseProps
  >;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
