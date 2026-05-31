import Link from "next/link";

/** Landing hero with the spinning-atom orbit graphic. */
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>
          See the laws of physics <em>come alive</em>.
        </h1>
        <p>
          Interactive practicals you can play with, the exact statements behind
          them, and the formulas that make them work — all in one place.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="#projectile">
            Start experimenting →
          </Link>
          <Link className="btn btn-ghost" href="#laws">
            Browse the laws
          </Link>
        </div>
      </div>
      <div className="hero-orbit" aria-hidden="true">
        <div className="nucleus" />
        <div className="ring ring1">
          <span className="electron" />
        </div>
        <div className="ring ring2">
          <span className="electron" />
        </div>
        <div className="ring ring3">
          <span className="electron" />
        </div>
      </div>
    </section>
  );
}
