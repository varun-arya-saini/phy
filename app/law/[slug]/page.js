import Link from "next/link";
import LawDemo from "@/components/LawDemo";
import { ALL_TOPICS, findTopic } from "@/lib/data";

export function generateStaticParams() {
  return ALL_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = findTopic(slug);
  return {
    title: found ? `PhysicsLab — ${found.topic.name}` : "PhysicsLab — Law",
  };
}

export default async function LawPage({ params }) {
  const { slug } = await params;
  const found = findTopic(slug);

  if (!found) {
    return (
      <main className="detail-main">
        <div className="not-found">
          <h1>Law not found</h1>
          <p>
            We couldn&apos;t find that law. Head back to the library to pick one.
          </p>
          <Link className="btn btn-primary" href="/#laws">
            ← Back to the Law Library
          </Link>
        </div>
      </main>
    );
  }

  const { topic: law, collection } = found;
  const idx = collection.findIndex((l) => l.slug === slug);
  const prev = collection[(idx - 1 + collection.length) % collection.length];
  const next = collection[(idx + 1) % collection.length];

  return (
    <main className="detail-main">
      <article className="law-detail">
        <header className="law-hero">
          <span className="tag">{law.tag}</span>
          <h1>{law.name}</h1>
          <p className="discoverer">
            {law.by} · {law.year}
          </p>
          <p
            className="lead"
            dangerouslySetInnerHTML={{ __html: law.statement }}
          />
        </header>

        <LawDemo controls={law.controls || []} anim={law.anim} />

        <section className="formula-block">
          <h2>The formula</h2>
          <div className="formula big">
            <code dangerouslySetInnerHTML={{ __html: law.eq }} />
          </div>
          <ul className="var-list">
            {law.vars.map((v, i) => (
              <li key={i}>
                <code dangerouslySetInnerHTML={{ __html: v.sym }} />
                <span dangerouslySetInnerHTML={{ __html: v.meaning }} />
              </li>
            ))}
          </ul>
        </section>

        <section className="explain-block">
          <h2>In detail</h2>
          {law.details.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
          ))}
        </section>

        <section className="examples-block">
          <h2>Everyday examples</h2>
          <ul className="example-list">
            {law.examples.map((e, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: e }} />
            ))}
          </ul>
        </section>

        <nav className="law-pager">
          <Link href={`/law/${prev.slug}`} className="pager prev">
            <span>← Previous</span>
            <strong>{prev.name}</strong>
          </Link>
          <Link href={`/law/${next.slug}`} className="pager next">
            <span>Next →</span>
            <strong>{next.name}</strong>
          </Link>
        </nav>
      </article>
    </main>
  );
}
