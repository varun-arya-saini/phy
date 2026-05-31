import Link from "next/link";

/** Fixed top-right shortcuts to each subject library. */
export default function QuickLinks() {
  return (
    <div className="quick-links">
      <Link href="/#laws" className="quick-link" title="Physics Library">
        <span className="ql-icon">⚛</span>
        <span className="ql-name">Physics</span>
      </Link>
      <Link href="/#chemistry" className="quick-link" title="Chemistry Library">
        <span className="ql-icon">🧪</span>
        <span className="ql-name">Chemistry</span>
      </Link>
      <Link href="/#maths" className="quick-link" title="Maths Library">
        <span className="ql-icon">📐</span>
        <span className="ql-name">Maths</span>
      </Link>
    </div>
  );
}
