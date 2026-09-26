"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { DefaultDark, DefaultLight } from "survey-core/themes";

const themes = {
  light: DefaultLight,
  dark: DefaultDark,
};

type ThemeTarget = {
  applyTheme?: (theme: typeof DefaultLight) => void;
  applyCreatorTheme?: (theme: typeof DefaultLight) => void;
} | null;

export function useSurveyTheme(target: ThemeTarget) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!target || (resolvedTheme !== "dark" && resolvedTheme !== "light")) {
      return;
    }
    const theme = themes[resolvedTheme];
    target.applyTheme?.(theme);
    target.applyCreatorTheme?.(theme);
  }, [resolvedTheme, target]);
}
