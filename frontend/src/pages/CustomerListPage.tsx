import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, Activity } from "lucide-react";
import { apiFetch } from "../api/client";
import type { Customer } from "../types";

function healthBadge(score: number): string {
  if (score >= 80) return "badge-green";
  if (score >= 60) return "badge-yellow";
  return "badge-red";
}

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    setLoading(true);
    apiFetch<Customer[]>(`/customers${params}`)
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-400" />
            Customers
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            {customers.length} accounts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          type="text"
          placeholder="Search by name or industry..."
          className="input-dark pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-dark-400">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading customers...</span>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-dark-400 py-16 text-center glass-card">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No customers found.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Health Score
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Account Manager
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-dark-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/customers/${c.id}`}
                      className="text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                    {c.industry}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={healthBadge(c.health_score)}>
                      {c.health_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                    {c.account_manager}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
