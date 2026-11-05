"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    const preferenceKey = "careerhub-preferences";
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    function syncTheme() {
      const stored = localStorage.getItem(preferenceKey);
      if (!stored) {
        document.documentElement.dataset.theme = colorScheme.matches ? "dark" : "light";
        return;
      }

      const preferences: unknown = JSON.parse(stored);
      if (
        typeof preferences !== "object" ||
        preferences === null ||
        !("theme" in preferences) ||
        (preferences.theme !== "light" && preferences.theme !== "dark")
      ) {
        throw new Error("CareerHub theme preferences contain invalid data.");
      }
      document.documentElement.dataset.theme = preferences.theme;
    }

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("careerhub-preferences-change", syncTheme);
    colorScheme.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("careerhub-preferences-change", syncTheme);
      colorScheme.removeEventListener("change", syncTheme);
    };
  }, []);

  return null;
}
