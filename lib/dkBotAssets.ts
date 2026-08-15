/**
 * D.K. Bot — centralized asset registry.
 *
 * Maps semantic character states to the actual PNG files in public/dk-bot/.
 * To add a new state: add an entry here and drop the PNG into public/dk-bot/.
 * No UI components need to change.
 */

import neutral from "@/public/dk-bot/DK Neutral.png";
import happy from "@/public/dk-bot/DK Happy.png";
import excited from "@/public/dk-bot/DK Excited.png";
import thinking from "@/public/dk-bot/DK Thinking.png";
import concerned from "@/public/dk-bot/DK Concerned.png";
import celebrating from "@/public/dk-bot/DK Celebrating.png";
import thumbsUp from "@/public/dk-bot/DK Thumbs Up.png";
import waving from "@/public/dk-bot/DK Waving.png";
import pointingLeft from "@/public/dk-bot/DK Pointing Left.png";
import pointingRight from "@/public/dk-bot/DK Pointing Right.png";
import presenting from "@/public/dk-bot/DK Presenting.png";

export const DK_BOT_ASSETS = {
  neutral,
  happy,
  excited,
  thinking,
  concerned,
  celebrating,
  thumbsUp,
  waving,
  pointingLeft,
  pointingRight,
  presenting,
} as const;

export type DkBotState = keyof typeof DK_BOT_ASSETS;

/** Fallback for invalid states. */
export const DK_BOT_DEFAULT: DkBotState = "neutral";
