import { Link } from "react-router";
import type { Route } from "./+types/landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gate - URL Shortener" },
    {
      name: "description",
      content:
        "Shorten your URLs and track analytics with Gate. Create short, shareable links in seconds.",
    },
  ];
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Gate</h1>
        <p className="mt-4 text-lg text-neutral-500 max-w-md">
          A simple URL shortener with analytics.
        </p>

        {/* Why */}
        <div className="mt-16 max-w-lg text-left">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Why I Built This
          </h2>
          <p className="mt-3 text-neutral-600 leading-relaxed">
            Built to explore clean API design and full-stack architecture. This
            project demonstrates RESTful principles, efficient data modeling,
            and thoughtful user experience.
          </p>
        </div>

        {/* Features */}
        <ul className="mt-12 flex gap-8 text-sm text-neutral-500">
          <li>🔗 Shorten links</li>
          <li>📊 Track clicks</li>
          <li>View analytics</li>
        </ul>

        {/* CTA */}
        <Link
          to="/app"
          className="mt-12 inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Go to App →
        </Link>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-neutral-400 space-x-4">
        <span>Built by MD Talim</span>
        <a
          href="https://github.com/Md-Talim"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-neutral-600 transition-colors"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
