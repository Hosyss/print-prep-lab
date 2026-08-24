import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested Print Prep Lab page could not be found.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="shell not-found-page">
      <span className="eyebrow">404 · Page not found</span>
      <h1>That print-preparation page is not here.</h1>
      <p>
        The address may be incomplete or the page may have moved. Choose a calculator,
        browse exact paper and photo dimensions, or read a production guide.
      </p>
      <nav aria-label="Page not found recovery links">
        <Link className="button button-primary" href="/tools">Open print tools</Link>
        <Link className="button button-secondary" href="/sizes">Browse print sizes</Link>
        <Link className="button button-secondary" href="/guides">Read print guides</Link>
      </nav>
    </main>
  );
}
