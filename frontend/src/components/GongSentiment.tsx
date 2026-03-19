import type { GongData } from "../types";

function sentimentStyle(s: string) {
  if (s === "positive") return "bg-green-100 text-green-800";
  if (s === "neutral") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export default function GongSentimentCard({ data }: { data: GongData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${sentimentStyle(data.overall_sentiment)}`}
        >
          {data.overall_sentiment}
        </span>
        <span className="text-sm text-gray-500">
          Score: {data.sentiment_score} | {data.recent_calls} recent calls
        </span>
      </div>

      {data.bad_calls.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-700 uppercase mb-2">
            Flagged Calls ({data.bad_calls.length})
          </h4>
          <div className="space-y-2">
            {data.bad_calls.map((call) => (
              <div
                key={call.call_id}
                className="border border-red-100 rounded-lg p-3 bg-red-50"
              >
                <div className="text-sm text-gray-800">{call.summary}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {call.date} &middot; Sentiment: {call.sentiment_score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.bad_calls.length === 0 && (
        <p className="text-sm text-green-600">No flagged calls - looking good!</p>
      )}
    </div>
  );
}
