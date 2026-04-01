import { useState } from "react";
import { BarChart3, Play, Loader2 } from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import ImpactSummaryCards from "../../components/health-model/ImpactSummaryCards";
import BeforeAfterTable from "../../components/health-model/BeforeAfterTable";
import type { SimulationSummary, SimulationResult } from "../../types";
import { runSimulation } from "../../api/healthModel";

// Deterministic mock simulation data when backend is unavailable
function generateMockSimulation(): SimulationSummary {
  const customers = [
    { id: "cust-001", name: "Acme Logistics", oldScore: 85, delta: -8 },
    { id: "cust-002", name: "Beta Freight", oldScore: 72, delta: 5 },
    { id: "cust-003", name: "Gamma Transport", oldScore: 58, delta: -12 },
    { id: "cust-004", name: "Delta Shipping", oldScore: 91, delta: -3 },
    { id: "cust-005", name: "Epsilon Cargo", oldScore: 45, delta: 8 },
    { id: "cust-006", name: "Zeta Express", oldScore: 67, delta: -2 },
    { id: "cust-007", name: "Eta Movers", oldScore: 78, delta: 4 },
    { id: "cust-008", name: "Theta Hauling", oldScore: 33, delta: 6 },
    { id: "cust-009", name: "Iota Supply Chain", oldScore: 62, delta: -15 },
    { id: "cust-010", name: "Kappa Distribution", oldScore: 88, delta: 1 },
  ];

  function scoreToBand(score: number): string {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "Monitor";
    if (score >= 40) return "At Risk";
    return "Critical";
  }

  const bandOrder = ["Healthy", "Monitor", "At Risk", "Critical"];
  const results: SimulationResult[] = customers.map((c) => {
    const newScore = Math.max(0, Math.min(100, c.oldScore + c.delta));
    return {
      customer_id: c.id,
      customer_name: c.name,
      old_score: c.oldScore,
      new_score: newScore,
      old_band: scoreToBand(c.oldScore),
      new_band: scoreToBand(newScore),
      delta: c.delta,
      top_contributors: [
        { name: "Product Usage", delta: c.delta * 0.45 },
        { name: "Support Burden", delta: c.delta * 0.3 },
        { name: "Relationship Sentiment", delta: c.delta * 0.25 },
      ],
    };
  });

  const migrations: Record<string, number> = {};
  let improvements = 0;
  let regressions = 0;
  for (const r of results) {
    if (r.old_band !== r.new_band) {
      const key = `${r.old_band.toLowerCase().replace(/ /g, "_")}_to_${r.new_band.toLowerCase().replace(/ /g, "_")}`;
      migrations[key] = (migrations[key] || 0) + 1;
      if (bandOrder.indexOf(r.new_band) < bandOrder.indexOf(r.old_band)) improvements++;
      else regressions++;
    }
  }

  const avgDelta = results.reduce((s, r) => s + r.delta, 0) / results.length;

  return {
    total_customers: results.length,
    avg_score_delta: Math.round(avgDelta * 10) / 10,
    band_migrations: migrations,
    most_affected: [...results].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 10),
    warnings: regressions > 0 ? [`${regressions} customer(s) would regress to a worse band`] : [],
  };
}

export default function PreviewTab() {
  const { draft, hasChanges, lastSimulation, setLastSimulation } = useHealthModel();
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runSimulation();
      setLastSimulation(result);
    } catch {
      // Backend unavailable — use mock simulation
      const mock = generateMockSimulation();
      setLastSimulation(mock);
    } finally {
      setRunning(false);
    }
  };

  // Compute improvements/regressions from band migrations
  // Band order from best to worst — used for directional comparison
  const bandLabels = draft?.bands
    ? [...draft.bands].sort((a, b) => b.min_score - a.min_score).map((b) => b.label)
    : ["Healthy", "Monitor", "At Risk", "Critical"];
  let improvements = 0;
  let regressions = 0;
  if (lastSimulation) {
    for (const [key, count] of Object.entries(lastSimulation.band_migrations)) {
      const parts = key.split("_to_");
      if (parts.length === 2) {
        const from = parts[0].replace(/_/g, " ");
        const to = parts[1].replace(/_/g, " ");
        const fromIdx = bandLabels.findIndex((b) => b.toLowerCase() === from);
        const toIdx = bandLabels.findIndex((b) => b.toLowerCase() === to);
        if (toIdx < fromIdx) improvements += count;
        else if (toIdx > fromIdx) regressions += count;
      }
    }
  }

  if (!lastSimulation) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Compare Draft vs Published</h2>
          <p className="text-sm text-dark-400 max-w-md mx-auto mb-6">
            Run a simulation to see how your draft changes would affect every customer&apos;s health score before publishing.
          </p>
          <button
            onClick={handleRun}
            disabled={running}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {running ? "Running Simulation..." : "Run Simulation"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Re-run button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Simulation Results</h3>
        <button onClick={handleRun} disabled={running} className="btn-secondary flex items-center gap-2 text-sm">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Re-run
        </button>
      </div>

      {/* Impact cards */}
      <ImpactSummaryCards
        totalCustomers={lastSimulation.total_customers}
        avgDelta={lastSimulation.avg_score_delta}
        regressions={regressions}
        improvements={improvements}
        warnings={lastSimulation.warnings.length}
      />

      {/* Band migrations */}
      {Object.keys(lastSimulation.band_migrations).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Band Migrations</h3>
          <div className="space-y-2">
            {Object.entries(lastSimulation.band_migrations).map(([key, count]) => {
              const parts = key.split("_to_");
              const from = parts[0]?.replace(/_/g, " ") ?? key;
              const to = parts[1]?.replace(/_/g, " ") ?? "";
              const isRegression = bandLabels.indexOf(from.charAt(0).toUpperCase() + from.slice(1)) < bandLabels.indexOf(to.charAt(0).toUpperCase() + to.slice(1));
              return (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-800/40">
                  <span className="text-sm text-gray-300 capitalize">{from} → {to}</span>
                  <span className={`text-sm font-medium ${isRegression ? "text-red-400" : "text-emerald-400"}`}>
                    {count} {count === 1 ? "customer" : "customers"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {lastSimulation.warnings.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          {lastSimulation.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-400">⚠ {w}</p>
          ))}
        </div>
      )}

      {/* Most affected table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Most Affected Customers</h3>
        <BeforeAfterTable results={lastSimulation.most_affected} expandable />
      </div>
    </div>
  );
}
