import { type SubmitEvent, useEffect, useState } from "react";
import { Link } from "react-router";
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
  const [copied, setCopied] = useState<number | null>(null);

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

  const copyToClipboard = (url: UrlMapping) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/s/${url.shortUrl}`,
    );
    setCopied(url.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (urlMapping: UrlMapping) => {
    const shortUrl = urlMapping.shortUrl;
    if (!shortUrl.trim()) return;
    setError("");

    try {
      await apiFetch<UrlMapping>(`/api/urls/${shortUrl}`, {
        method: "DELETE",
      });

      // Remove deleted url from urls array
      setUrls((prev) => prev.filter((u) => u.id !== urlMapping.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete URL");
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Gate
          </Link>
          <button
            onClick={logout}
            className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Shorten form */}
        <form onSubmit={handleShorten} className="flex gap-2">
          <input
            type="url"
            required
            placeholder="Paste a long URL..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Shorten
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {/* Links section */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Your Links
          </h2>

          {loading ? (
            <p className="mt-6 text-sm text-neutral-400">Loading...</p>
          ) : urls.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-lg font-medium text-neutral-900">
                No links yet
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Shorten your first URL to get started
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {urls.map((url) => (
                <li
                  key={url.id}
                  className="rounded-lg border border-neutral-100 bg-neutral-50/50 px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {window.location.origin}/s/{url.shortUrl}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-400">
                        {url.originalUrl}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {url.clickCount} click{url.clickCount !== 1 && "s"}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <Link
                      to={`/analytics/${url.shortUrl}`}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      View Analytics
                    </Link>
                    <button
                      onClick={() => copyToClipboard(url)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      {copied === url.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleDelete(url)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      Delete
                    </button>
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
