"use client";

import { useEffect, useState } from "react";

/** Dark/light toggle. The chosen theme persists in localStorage and is
    applied to <html data-theme> (the no-flash init script in layout.js
    sets it before first paint). */
export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  const toggle = () => {
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("physlab-theme", "dark");
      setLight(false);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("physlab-theme", "light");
      setLight(true);
    }
  };

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle theme">
      {light ? "☀️ Theme" : "🌙 Theme"}
    </button>
  );
}
