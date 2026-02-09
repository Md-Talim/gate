import { type SubmitEvent, useEffect, useState } from "react";
import { apiFetch } from "~/lib/api";
import { useAuth } from "~/lib/auth";

interface UrlMapping {
  id: number;
  originalUrl: string;
  shortUrl: string;
  clickCount: number;
  createdDate: string;
  username: string;
}

export default function App() {
  const { logout } = useAuth();
  const [urls, setUrls] = useState<UrlMapping[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUrls = async () => {
    try {
      const data = await apiFetch<UrlMapping[]>("/api/urls/myurls");
      setUrls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load URLs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleShorten = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setError("");

    try {
      const created = await apiFetch<UrlMapping>("/api/urls/shorten", {
        method: "POST",
        body: JSON.stringify({ originalUrl: newUrl }),
      });
      setUrls((prev) => [created, ...prev]);
      setNewUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to shorten URL");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold text-neutral-900">Gate</h1>
          <button
            onClick={logout}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Shorten form */}
        <form onSubmit={handleShorten} className="flex gap-2">
          <input
            type="url"
            required
            placeholder="Paste a long URL..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Shorten
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* URL list */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Your Links
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-neutral-500">Loading...</p>
          ) : urls.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No shortened URLs yet. Create your first one above.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100">
              {urls.map((url) => (
                <li key={url.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <a
                        href={`http://localhost:8080/${url.shortUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-neutral-900 hover:underline"
                      >
                        /{url.shortUrl}
                      </a>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {url.originalUrl}
                      </p>
                    </div>
                    <span className="ml-4 text-xs text-neutral-400">
                      {url.clickCount} click{url.clickCount !== 1 && "s"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
