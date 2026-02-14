import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "~/lib/api";
import { useAuth } from "~/lib/auth";

interface ClickEvent {
  clickDate: string;
  count: number;
}

interface UrlMapping {
  id: number;
  originalUrl: string;
  shortUrl: string;
  clickCount: number;
  createdDate: string;
  username: string;
}

type DateRange = "7d" | "30d" | "90d";

function getDateRange(range: DateRange) {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
  }

  return {
    startDate: start.toISOString().slice(0, 19),
    endDate: end.toISOString().slice(0, 19),
  };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-neutral-900">{formatDate(label ?? "")}</p>
      <p className="text-neutral-500">
        {payload[0].value} click{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function Analytics() {
  const { shortUrl } = useParams();
  const { isAuthenticated, isAuthenticating } = useAuth();
  const [clicks, setClicks] = useState<ClickEvent[]>([]);
  const [urlInfo, setUrlInfo] = useState<UrlMapping | null>(null);
  const [range, setRange] = useState<DateRange>("7d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shortUrl || isAuthenticating || !isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const { startDate, endDate } = getDateRange(range);
        const [analyticsData, urlsData] = await Promise.all([
          apiFetch<ClickEvent[]>(
            `/api/urls/analytics/${shortUrl}?startDate=${startDate}&endDate=${endDate}`,
          ),
          apiFetch<UrlMapping[]>("/api/urls/myurls"),
        ]);

        // Fill in missing dates with zero counts
        const clickMap = new Map(
          analyticsData.map((c) => [c.clickDate, c.count]),
        );
        const filled: ClickEvent[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          filled.push({ clickDate: key, count: clickMap.get(key) ?? 0 });
        }

        setClicks(filled);

        const found = urlsData.find((u) => u.shortUrl === shortUrl);
        if (found) setUrlInfo(found);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shortUrl, range, isAuthenticated, isAuthenticating]);

  const totalClicks = clicks.reduce((sum, c) => sum + c.count, 0);

  const ranges: { key: DateRange; label: string }[] = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Gate
          </Link>
          <Link
            to="/app"
            className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            {"< Back to links"}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* URL info */}
        {urlInfo && (
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {window.location.origin}/{urlInfo.shortUrl}
            </p>
            <p className="mt-1 truncate text-xs text-neutral-400">
              {urlInfo.originalUrl}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-6 flex items-baseline gap-6">
          <div>
            <p className="text-3xl font-bold">{urlInfo?.clickCount ?? 0}</p>
            <p className="text-xs text-neutral-400">Total clicks</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalClicks}</p>
            <p className="text-xs text-neutral-400">
              Clicks in last {ranges.find((r) => r.key === range)?.label}
            </p>
          </div>
        </div>

        {/* Date range selector */}
        <div className="mt-8 flex gap-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.key
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-6">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : loading ? (
            <p className="text-sm text-neutral-400">Loading analytics...</p>
          ) : clicks.length === 0 ? (
            <p className="text-sm text-neutral-400">No click data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clicks}
                  margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f5f5f5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="clickDate"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#a3a3a3" }}
                    axisLine={{ stroke: "#e5e5e5" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#a3a3a3" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#fafafa" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#171717"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
