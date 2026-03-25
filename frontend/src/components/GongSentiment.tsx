import { ExternalLink } from "lucide-react";
import type { GongData } from "../types";

function sentimentStyle(s: string) {
  if (s === "positive") return "badge-green";
  if (s === "neutral") return "badge-yellow";
  return "badge-red";
}

/** Returns true only if the URL points to a real Gong call (not a fake/sample ID). */
function isRealGongUrl(call: { url?: string; call_id: string }): boolean {
  // Sample call IDs use patterns like "call-agg-001" or "call-cust-001-000"
  if (call.call_id.startsWith("call-agg-") || call.call_id.startsWith("call-cust-")) {
    return false;
  }
  // Must have a url that looks like a real Gong link
  return !!call.url && call.url.includes("app.gong.io");
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
              const hasRealLink = isRealGongUrl(call);
              const content = (
                <>
                  <div className={`text-sm text-gray-300 ${hasRealLink ? "group-hover:text-gray-200" : ""}`}>
                    {call.summary}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-dark-500">
                      {call.date} &middot; Sentiment: {call.sentiment_score}
                    </span>
                    {hasRealLink && (
                      <span className="text-xs text-dark-500 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                        Open in Gong <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </>
              );

              if (hasRealLink) {
                return (
                  <a
                    key={call.call_id}
                    href={call.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-red-500/20 rounded-lg p-3 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 transition-colors group"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={call.call_id}
                  className="border border-red-500/20 rounded-lg p-3 bg-red-500/5"
                >
                  {content}
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
