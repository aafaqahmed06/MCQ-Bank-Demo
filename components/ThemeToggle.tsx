"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { IconButton } from "@/components/ui";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <IconButton
      icon={theme === "dark" ? Sun : Moon}
      label={`Switch to ${theme === "dark" ? "Clinical Light" : "Deep Medical Dark"}`}
      size="sm"
      onClick={toggle}
      onTouchEnd={(e) => {
        e.preventDefault();
        toggle();
      }}
    />
  );
}
