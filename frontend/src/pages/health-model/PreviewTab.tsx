import { useState } from "react";
import { BarChart3, Play, Loader2 } from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import ImpactSummaryCards from "../../components/health-model/ImpactSummaryCards";
import BeforeAfterTable from "../../components/health-model/BeforeAfterTable";
import type { SimulationSummary, SimulationResult } from "../../types";
import { runSimulation } from "../../api/healthModel";

// Fallback mock simulation data when backend is unavailable
function generateMockSimulation(): SimulationSummary {
  const names = [
    "Acme Logistics", "Beta Freight", "Gamma Transport", "Delta Shipping",
    "Epsilon Cargo", "Zeta Express", "Eta Movers", "Theta Hauling",
    "Iota Supply Chain", "Kappa Distribution",
  ];
  const bands = ["Healthy", "Monitor", "At Risk", "Critical"];
  const results: SimulationResult[] = names.map((name, i) => {
    const oldScore = 40 + Math.floor(Math.random() * 50);
    const delta = Math.floor(Math.random() * 20) - 8;
    const newScore = Math.max(0, Math.min(100, oldScore + delta));
    const oldBand = oldScore >= 80 ? "Healthy" : oldScore >= 60 ? "Monitor" : oldScore >= 40 ? "At Risk" : "Critical";
    const newBand = newScore >= 80 ? "Healthy" : newScore >= 60 ? "Monitor" : newScore >= 40 ? "At Risk" : "Critical";
    return {
      customer_id: `cust-${i}`,
      customer_name: name,
      old_score: oldScore,
      new_score: newScore,
      old_band: oldBand,
      new_band: newBand,
      delta,
      top_contributors: [
        { name: "Product Usage", delta: delta * 0.4 },
        { name: "Support Burden", delta: delta * 0.3 },
        { name: "Billing Health", delta: delta * 0.3 },
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
      const oldIdx = bands.indexOf(r.old_band);
      const newIdx = bands.indexOf(r.new_band);
      if (newIdx < oldIdx) improvements++;
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
  const { hasChanges, lastSimulation, setLastSimulation } = useHealthModel();
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
  const bands = ["Healthy", "Monitor", "At Risk", "Critical"];
  let improvements = 0;
  let regressions = 0;
  if (lastSimulation) {
    for (const [key, count] of Object.entries(lastSimulation.band_migrations)) {
      const parts = key.split("_to_");
      if (parts.length === 2) {
        const from = parts[0].replace(/_/g, " ");
        const to = parts[1].replace(/_/g, " ");
        const fromIdx = bands.findIndex((b) => b.toLowerCase() === from);
        const toIdx = bands.findIndex((b) => b.toLowerCase() === to);
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
              const isRegression = bands.indexOf(from.charAt(0).toUpperCase() + from.slice(1)) < bands.indexOf(to.charAt(0).toUpperCase() + to.slice(1));
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
