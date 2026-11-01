"use client";

import { MoonIcon, SunIcon } from "./Icons";

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing can block storage. The switch still works for this visit.
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch between light and dark mode"
    >
      <span className="show-light"><MoonIcon /></span>
      <span className="show-dark"><SunIcon /></span>
    </button>
  );
}
