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
      landing page
    </div>
  );
}
