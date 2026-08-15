"use client";

import Image from "next/image";
import { DK_BOT_ASSETS, DK_BOT_DEFAULT, type DkBotState } from "@/lib/dkBotAssets";

/**
 * D.K. Bot — reusable character component.
 *
 * Usage:
 *   <DkBot state="happy" />
 *   <DkBot state="thinking" size="large" />
 *   <DkBot state="celebrating" alt="D.K. celebrating your score" />
 *
 * Assets live in public/dk-bot/ and are mapped via lib/dkBotAssets.ts.
 * To add a new bot state, add the PNG and update the registry — no UI changes needed.
 */

const HEIGHTS = {
  small: 80,
  medium: 140,
  large: 220,
  hero: 320,
} as const;

type DkBotProps = {
  /** Semantic character state — determines which PNG is displayed. */
  state: DkBotState | string;
  /** Visual size tier. Defaults to "medium". */
  size?: keyof typeof HEIGHTS;
  /** Accessible label. Set to null for decorative use (gets aria-hidden). */
  alt?: string | null;
  /** Additional CSS classes. */
  className?: string;
};

export default function DkBot({
  state,
  size = "medium",
  alt = "",
  className,
}: DkBotProps) {
  const resolved = (state in DK_BOT_ASSETS ? state : DK_BOT_DEFAULT) as DkBotState;
  const src = DK_BOT_ASSETS[resolved];
  const height = HEIGHTS[size];
  const isDecorative = alt === null;

  return (
    <span
      className={`inline-block ${className ?? ""}`}
      style={{ height, lineHeight: 0 }}
    >
      <Image
        src={src}
        alt={isDecorative ? "" : `D.K. ${resolved}`}
        {...(isDecorative ? { "aria-hidden": true } : {})}
        height={height}
        style={{ width: "auto", height: "100%", objectFit: "contain" }}
        sizes={`${height}px`}
      />
    </span>
  );
}
