"use client";

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = ButtonBaseProps & {
  href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps | "href">;

type ButtonAsLink = ButtonBaseProps & {
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps | "href">;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-border-default bg-surface text-text-primary hover:border-border-strong hover:bg-surface-secondary",
  ghost: "text-text-secondary hover:bg-primary/8 hover:text-text-primary",
  danger: "bg-error text-white hover:bg-error/90",
  link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    className,
    children,
    href,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center rounded-control font-medium transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variant !== "link" && SIZE_STYLES[size],
    VARIANT_STYLES[variant],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {loading && (
        <Icon
          icon={Loader2}
          size={size === "lg" ? "md" : "sm"}
          className="animate-spin"
          aria-label="Loading"
        />
      )}
      {children}
    </>
  );

  if (href) {
    const anchorProps = rest as Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof ButtonBaseProps
    >;
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={loading || undefined}
        {...anchorProps}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = rest as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ButtonBaseProps
  >;
  return (
    <button
      type={buttonProps.type ?? "button"}
      disabled={buttonProps.disabled || loading}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
