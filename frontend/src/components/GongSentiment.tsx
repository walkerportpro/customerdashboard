import { ExternalLink, PhoneOff } from "lucide-react";
import type { GongData } from "../types";

function sentimentStyle(s: string) {
  if (s === "positive") return "badge-green";
  if (s === "neutral") return "badge-yellow";
  return "badge-red";
}

/**
 * Validate whether a Gong URL is likely to resolve.
 * Accepts real Gong app URLs (app.gong.io with a path or numeric id param).
 * Rejects empty strings, placeholder IDs, and non-Gong domains.
 */
function isValidGongUrl(url: string | undefined): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("gong.io")) return false;
    // Reject URLs whose only content is a synthetic/mock call_id
    // Real Gong call IDs are numeric (e.g., "8734210653109...")
    const idParam = parsed.searchParams.get("id");
    if (idParam && /^call-/.test(idParam)) return false;
    return true;
  } catch {
    return false;
  }
}

export default function GongSentimentCard({ data }: { data: GongData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className={`${sentimentStyle(data.overall_sentiment)} capitalize`}
        >
          {data.overall_sentiment}
        </span>
        <span className="text-sm text-dark-400">
          Score: {data.sentiment_score} | {data.recent_calls} recent calls
        </span>
      </div>

      {data.bad_calls.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">
            Flagged Calls ({data.bad_calls.length})
          </h4>
          <div className="space-y-2">
            {data.bad_calls.map((call) => {
              const hasValidLink = isValidGongUrl(call.url);

              return (
                <div
                  key={call.call_id}
                  className="block border border-red-500/20 rounded-lg p-3 bg-red-500/5"
                >
                  <div className="text-sm text-gray-300">
                    {call.summary}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-dark-500">
                      {call.date} &middot; Sentiment: {call.sentiment_score}
                    </span>
                    {hasValidLink ? (
                      <a
                        href={call.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-dark-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                      >
                        Open in Gong <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-dark-600 flex items-center gap-1 cursor-default" title="Gong link unavailable — call ID is from demo data">
                        <PhoneOff className="w-3 h-3" />
                        Call details unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.bad_calls.length === 0 && (
        <p className="text-sm text-emerald-400">No flagged calls - looking good!</p>
      )}
    </div>
  );
}
