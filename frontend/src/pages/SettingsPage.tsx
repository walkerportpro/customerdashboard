import { useState } from "react";
import {
  Settings,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  Plug,
  AlertCircle,
} from "lucide-react";
import { apiPost, apiDelete } from "../api/client";
import { useMockData } from "../context/MockDataContext";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "crm" | "communication" | "billing" | "support" | "onboarding" | "analytics";
  icon: string;
  fields: { key: string; label: string; type: "text" | "password"; placeholder: string }[];
  docUrl: string;
}

const integrations: Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing, subscriptions, and billing management",
    category: "billing",
    icon: "S",
    fields: [
      { key: "api_key", label: "Secret Key", type: "password", placeholder: "sk_live_..." },
      { key: "webhook_secret", label: "Webhook Secret", type: "password", placeholder: "whsec_..." },
    ],
    docUrl: "https://stripe.com/docs/api",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team communication and customer notifications",
    category: "communication",
    icon: "#",
    fields: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "xoxb-..." },
      { key: "signing_secret", label: "Signing Secret", type: "password", placeholder: "Enter signing secret" },
      { key: "default_channel", label: "Default Channel", type: "text", placeholder: "#customer-alerts" },
    ],
    docUrl: "https://api.slack.com/docs",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Email communication and customer correspondence tracking",
    category: "communication",
    icon: "M",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Enter Google OAuth client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Enter client secret" },
      { key: "refresh_token", label: "Refresh Token", type: "password", placeholder: "Enter refresh token" },
    ],
    docUrl: "https://developers.google.com/gmail/api",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM data, load volumes, and invoicing trends",
    category: "crm",
    icon: "SF",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Enter Salesforce client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Enter client secret" },
      { key: "instance_url", label: "Instance URL", type: "text", placeholder: "https://yourorg.salesforce.com" },
    ],
    docUrl: "https://developer.salesforce.com/docs",
  },
  {
    id: "gainsight",
    name: "Gainsight",
    description: "Customer health scores and product adoption metrics",
    category: "analytics",
    icon: "GS",
    fields: [
      { key: "api_url", label: "API URL", type: "text", placeholder: "https://yourorg.gainsight.com/v1" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "Enter Gainsight API key" },
    ],
    docUrl: "https://support.gainsight.com/",
  },
  {
    id: "gong",
    name: "Gong",
    description: "Call recording analysis and customer sentiment tracking",
    category: "analytics",
    icon: "G",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Enter Gong API key" },
      { key: "api_secret", label: "API Secret", type: "password", placeholder: "Enter API secret" },
    ],
    docUrl: "https://gong.app.gong.io/settings/api",
  },
  {
    id: "rocketlane",
    name: "RocketLane",
    description: "Customer onboarding project tracking and management",
    category: "onboarding",
    icon: "RL",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Enter RocketLane API key" },
    ],
    docUrl: "https://docs.rocketlane.com/",
  },
  {
    id: "freshdesk",
    name: "Freshdesk",
    description: "Customer support ticket management and tracking",
    category: "support",
    icon: "FD",
    fields: [
      { key: "domain", label: "Domain", type: "text", placeholder: "yourcompany.freshdesk.com" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "Enter Freshdesk API key" },
    ],
    docUrl: "https://developers.freshdesk.com/",
  },
];

const categoryLabels: Record<string, string> = {
  billing: "Billing & Payments",
  communication: "Communication",
  crm: "CRM",
  analytics: "Analytics & Intelligence",
  onboarding: "Onboarding",
  support: "Support",
};

const categoryOrder = ["crm", "analytics", "billing", "communication", "onboarding", "support"];

const iconColors: Record<string, string> = {
  stripe: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  slack: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  gmail: "bg-red-500/15 text-red-400 border-red-500/20",
  salesforce: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  gainsight: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  gong: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  rocketlane: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  freshdesk: "bg-green-500/15 text-green-400 border-green-500/20",
};

const STORAGE_KEY = "integration_configs";

function loadSavedConfigs(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistConfigs(configs: Record<string, Record<string, string>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export default function SettingsPage() {
  const { refreshDashboard } = useMockData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<Record<string, Record<string, string>>>(loadSavedConfigs);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>(loadSavedConfigs);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function getFieldValue(integrationId: string, fieldKey: string): string {
    return formData[integrationId]?.[fieldKey] || "";
  }

  function setFieldValue(integrationId: string, fieldKey: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] || {}), [fieldKey]: value },
    }));
  }

  function isConnected(integrationId: string): boolean {
    return !!savedConfigs[integrationId];
  }

  async function handleSave(integration: Integration) {
    const fields = formData[integration.id] || {};
    const hasValues = integration.fields.some((f) => fields[f.key]?.trim());
    if (!hasValues) return;

    setSaving(integration.id);
    setSaveError(null);

    try {
      // Send credentials to backend
      await apiPost(`/integrations/${integration.id}/connect`, {
        credentials: fields,
      });

      // Persist locally for UI state
      setSavedConfigs((prev) => {
        const next = { ...prev, [integration.id]: { ...fields } };
        persistConfigs(next);
        return next;
      });
      setSaveSuccess(integration.id);
      setTimeout(() => setSaveSuccess(null), 2000);

      // Refresh dashboard to pull real data from newly connected integration
      refreshDashboard();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to connect integration"
      );
    } finally {
      setSaving(null);
    }
  }

  async function handleDisconnect(integrationId: string) {
    try {
      await apiDelete(`/integrations/${integrationId}/disconnect`);
    } catch {
      // Continue with local cleanup even if backend call fails
    }

    setSavedConfigs((prev) => {
      const next = { ...prev };
      delete next[integrationId];
      persistConfigs(next);
      return next;
    });
    setFormData((prev) => {
      const next = { ...prev };
      delete next[integrationId];
      return next;
    });
    setExpandedId(null);
    refreshDashboard();
  }

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: integrations.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-dark-800 border border-dark-700/50">
            <Settings className="w-5 h-5 text-dark-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
            <p className="text-sm text-dark-400">
              Manage your integrations and connections
            </p>
          </div>
        </div>
      </div>

      {/* Connection Summary */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <Plug className="w-5 h-5 text-dark-400" />
          <div>
            <span className="text-sm text-gray-200 font-medium">
              {Object.keys(savedConfigs).length} of {integrations.length} integrations connected
            </span>
            <div className="flex gap-1.5 mt-2">
              {integrations.map((i) => (
                <div
                  key={i.id}
                  className={`w-8 h-1.5 rounded-full transition-colors ${
                    isConnected(i.id)
                      ? "bg-emerald-400"
                      : "bg-dark-700"
                  }`}
                  title={i.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integration Groups */}
      {grouped.map((group) => (
        <div key={group.category}>
          <h2 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 px-1">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.items.map((integration) => {
              const expanded = expandedId === integration.id;
              const connected = isConnected(integration.id);

              return (
                <div
                  key={integration.id}
                  className={`glass-card overflow-hidden transition-all duration-200 ${
                    expanded ? "border-accent-500/30" : ""
                  }`}
                >
                  {/* Integration Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : integration.id)
                    }
                    className="relative z-10 w-full flex items-center gap-4 p-4 hover:bg-dark-800/40 transition-colors text-left cursor-pointer"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-bold flex-shrink-0 ${
                        iconColors[integration.id] || "bg-dark-700 text-dark-300 border-dark-600"
                      }`}
                    >
                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-200">
                          {integration.name}
                        </span>
                        {connected ? (
                          <span className="badge-green text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Connected
                          </span>
                        ) : (
                          <span className="badge text-[10px] bg-dark-700/60 text-dark-400 border border-dark-600/50">
                            Not connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5 truncate">
                        {integration.description}
                      </p>
                    </div>
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-dark-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded Configuration */}
                  {expanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-dark-700/30 animate-fade-in">
                      <div className="space-y-4 mt-4">
                        {integration.fields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-dark-300 mb-1.5">
                              {field.label}
                            </label>
                            <div className="relative">
                              {field.type === "password" && (
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                              )}
                              <input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={getFieldValue(integration.id, field.key)}
                                onChange={(e) =>
                                  setFieldValue(
                                    integration.id,
                                    field.key,
                                    e.target.value
                                  )
                                }
                                className={`input-dark ${field.type === "password" ? "pl-10" : ""}`}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSave(integration)}
                            disabled={saving === integration.id}
                            className="btn-primary disabled:opacity-50 cursor-pointer"
                          >
                            {saving === integration.id
                              ? "Saving..."
                              : connected
                              ? "Update Connection"
                              : "Connect"}
                          </button>
                          {connected && (
                            <button
                              type="button"
                              onClick={() => handleDisconnect(integration.id)}
                              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 inline mr-1" />
                              Disconnect
                            </button>
                          )}
                          {saveSuccess === integration.id && (
                            <span className="text-sm text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Connected successfully
                            </span>
                          )}
                          {saveError && saving === null && (
                            <span className="text-sm text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {saveError}
                            </span>
                          )}
                          <a
                            href={integration.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-dark-400 hover:text-dark-300 flex items-center gap-1 transition-colors"
                          >
                            Docs <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
