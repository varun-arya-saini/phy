"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { PHYS_ANIM } from "@/lib/animations";

/** Highlight every case-insensitive occurrence of `q` inside `text`. */
function highlight(text, q) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safe})`, "gi");
  return text.split(re).map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i}>{part}</mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

/**
 * A searchable grid of topic cards. Each card lazily starts its canvas
 * animation when it scrolls into view. Used for Physics, Chemistry & Maths.
 *
 * When `connectSearch` is set (the Physics library) it also reads an
 * incoming ?q= and listens for the sidebar's live-search events.
 */
export default function Library({
  topics,
  noun = "topics",
  sectionId,
  title,
  sub,
  placeholder,
  connectSearch = false,
}) {
  const [query, setQuery] = useState("");
  const refs = useRef([]);
  const started = useRef(new Set());

  const startAnim = (i) => {
    if (started.current.has(i)) return;
    const topic = topics[i];
    const runner = PHYS_ANIM[topic.anim];
    const canvas = refs.current[i]?.canvas;
    if (!runner || !canvas) return;
    const P = {};
    (topic.controls || []).forEach((c) => (P[c.id] = c.value));
    runner(canvas, { textContent: "" }, P, null);
    started.current.add(i);
  };

  // Start each card's animation only when it first scrolls into view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            startAnim(Number(en.target.dataset.idx));
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "120px" }
    );
    refs.current.forEach((r) => r?.el && io.observe(r.el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Physics library: honour an incoming ?q= carried over from another page.
  // Read it from the URL in an effect (client-only) rather than via
  // useSearchParams, so this library still renders on the server.
  useEffect(() => {
    if (!connectSearch) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      document.getElementById(sectionId)?.scrollIntoView();
    }
  }, [connectSearch, sectionId]);

  // Physics library: honour the sidebar's live search.
  useEffect(() => {
    if (!connectSearch) return;
    const onSide = (e) => setQuery(e.detail || "");
    window.addEventListener("physlab-sidesearch", onSide);
    return () => window.removeEventListener("physlab-sidesearch", onSide);
  }, [connectSearch]);

  const q = query.trim().toLowerCase();
  let shown = 0;
  const hits = topics.map((l) => {
    const hit = (l.name + " " + l.by + " " + l.short + " " + l.eq)
      .toLowerCase()
      .includes(q);
    if (hit) shown++;
    return hit;
  });

  const countText = q
    ? `${shown} of ${topics.length} ${noun} match “${query.trim()}”`
    : `${topics.length} ${noun} in the library`;

  return (
    <section id={sectionId} className="library">
      <h2 className="section-title">{title}</h2>
      <p className="section-sub">{sub}</p>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.length > 0 && (
          <button
            className="search-clear"
            title="Clear"
            onClick={() => setQuery("")}
          >
            ✕
          </button>
        )}
      </div>
      <p className="search-count">{countText}</p>

      <div className="law-grid">
        {topics.map((l, i) => (
          <Link
            key={l.slug}
            href={`/law/${l.slug}`}
            className="law-card"
            data-idx={i}
            hidden={!hits[i]}
            ref={(node) => {
              refs.current[i] = {
                el: node,
                canvas: node ? node.querySelector("canvas") : null,
              };
            }}
          >
            <span className="card-preview">
              <canvas width={720} height={420} />
            </span>
            <h3>{highlight(l.name, query.trim())}</h3>
            <div className="by">{highlight(l.by, query.trim())}</div>
            <p>{highlight(l.short, query.trim())}</p>
            <div className="eq">
              <code>{highlight(l.eq, query.trim())}</code>
            </div>
            <span className="card-cta">Open lesson →</span>
          </Link>
        ))}
      </div>

      {shown === 0 && (
        <p className="no-results">
          No {noun} match your search. Try another keyword.
        </p>
      )}
    </section>
  );
}
