"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/#projectile", id: "projectile", label: "🎯 Projectile Motion" },
  { href: "/#pendulum", id: "pendulum", label: "⏱ Simple Pendulum" },
  { href: "/#newton", id: "newton", label: "🛒 Newton's Second Law" },
  { href: "/#ohm", id: "ohm", label: "💡 Ohm's Law" },
  { href: "/#hooke", id: "hooke", label: "🔧 Hooke's Law" },
  { href: "/#laws", id: "laws", label: "📚 Physics Library" },
  { href: "/#chemistry", id: "chemistry", label: "🧪 Chemistry Library" },
  { href: "/#maths", id: "maths", label: "📐 Maths Library" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");

  const asideRef = useRef(null);
  const toggleRef = useRef(null);
  const jumped = useRef(false);

  // Close the mobile drawer on outside click or Escape.
  useEffect(() => {
    const onClick = (e) => {
      if (
        asideRef.current &&
        !asideRef.current.contains(e.target) &&
        e.target !== toggleRef.current
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Highlight whichever section is currently in view (home page only).
  useEffect(() => {
    if (!isHome) {
      setActive(null);
      return;
    }
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      Boolean
    );
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(en.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
    return () => spy.disconnect();
  }, [isHome]);

  // Sidebar search: on home it filters the Physics library live (via a
  // window event the library listens for) and jumps to it once; elsewhere
  // pressing Enter navigates home carrying the query.
  const onSearchChange = (val) => {
    setQuery(val);
    if (!isHome) return;
    window.dispatchEvent(new CustomEvent("physlab-sidesearch", { detail: val }));
    if (val && !jumped.current) {
      document
        .getElementById("laws")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      jumped.current = true;
    }
    if (!val) jumped.current = false;
  };

  const onSearchKeyDown = (e) => {
    if (isHome || e.key !== "Enter") return;
    const q = query.trim();
    router.push("/" + (q ? `?q=${encodeURIComponent(q)}` : "") + "#laws");
  };

  return (
    <>
      <button
        ref={toggleRef}
        className="sidebar-toggle"
        title="Menu"
        aria-label="Toggle menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        ☰
      </button>

      <aside ref={asideRef} className={`sidebar${open ? " open" : ""}`} id="sidebar">
        <Link href="/" className="brand">
          <span className="logo">⚛</span>
          <span>
            Physics<strong>Lab</strong>
          </span>
        </Link>

        <div className="side-search">
          <span className="side-search-icon">🔍</span>
          <input
            type="text"
            className="side-search-input"
            value={query}
            placeholder={isHome ? "Search laws…" : "Search laws… (Enter)"}
            autoComplete="off"
            aria-label="Search laws"
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>

        <span className="nav-heading">Explore</span>
        <nav className="nav">
          {NAV.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={active === n.id ? "active" : undefined}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </aside>
    </>
  );
}
