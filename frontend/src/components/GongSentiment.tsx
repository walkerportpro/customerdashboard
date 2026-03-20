import type { GongData } from "../types";

function sentimentStyle(s: string) {
  if (s === "positive") return "badge-green";
  if (s === "neutral") return "badge-yellow";
  return "badge-red";
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
            {data.bad_calls.map((call) => (
              <div
                key={call.call_id}
                className="border border-red-500/20 rounded-lg p-3 bg-red-500/5"
              >
                <div className="text-sm text-gray-300">{call.summary}</div>
                <div className="text-xs text-dark-500 mt-1">
                  {call.date} &middot; Sentiment: {call.sentiment_score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.bad_calls.length === 0 && (
        <p className="text-sm text-emerald-400">No flagged calls - looking good!</p>
      )}
    </div>
  );
}
