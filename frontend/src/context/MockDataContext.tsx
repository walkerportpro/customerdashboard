import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiFetch, apiPost } from "../api/client";
import type {
  Customer,
  DashboardData,
  VolumeTrend,
  GainsightMetrics,
  GongData,
  TicketSummary,
} from "../types";

interface MockDataState {
  customers: Customer[];
  isLoaded: boolean;
  loadMockData: () => void;
  refreshDashboard: () => void;
  loadVolumes: VolumeTrend | null;
  invoiceVolumes: VolumeTrend | null;
  gainsightAggregate: GainsightMetrics | null;
  gongAggregate: GongData | null;
  ticketAggregate: TicketSummary | null;
  connectedIntegrations: string[];
}

const MockDataContext = createContext<MockDataState>({
  customers: [],
  isLoaded: false,
  loadMockData: () => {},
  refreshDashboard: () => {},
  loadVolumes: null,
  invoiceVolumes: null,
  gainsightAggregate: null,
  gongAggregate: null,
  ticketAggregate: null,
  connectedIntegrations: [],
});

export function useMockData() {
  return useContext(MockDataContext);
}

// ─── Mock data (used by "Load Mock Data" button as demo fallback) ───

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: "cus_U8tp0yG5ggcq0V", name: "International Express Trucking, Inc.", industry: "Trucking", health_score: 92, account_manager: "Terrell Cherisier" },
  { id: "cus_U8YiyI14nvqvNe", name: "Ground Force Freight", industry: "Freight", health_score: 78, account_manager: "Vinny Paz" },
  { id: "cus_U5Wf8ISUpkzsxl", name: "Locher Evers International", industry: "Logistics", health_score: 85, account_manager: "Katie Grundl" },
  { id: "cus_U4lwL7k7VIsHJZ", name: "Omega Port Logistics Inc.", industry: "Port Services", health_score: 71, account_manager: "Annie Edholm" },
  { id: "cus_U4jyo3htuOLLaK", name: "Medlog Canada Inc.", industry: "Logistics", health_score: 88, account_manager: "Benjamin Wible" },
  { id: "cus_U3KQoDaUposr5m", name: "TexSpace Freight Corporation", industry: "Freight", health_score: 91, account_manager: "Nikki Driskill" },
  { id: "cus_U3H7c8Z7qtRkGD", name: "Priority Express", industry: "Express Delivery", health_score: 34, account_manager: "Joseph Greenwell" },
  { id: "cus_U2ubfO6THdtol4", name: "The Ace Group, Inc.", industry: "Logistics", health_score: 48, account_manager: "Terrell Cherisier" },
  { id: "cus_U2ZkQFySEZEdnL", name: "RS Rush Transfer Xpress Inc", industry: "Transport", health_score: 83, account_manager: "Vinny Paz" },
  { id: "cus_U2UcMQurR1yQi9", name: "USA Cargo Logistics Inc.", industry: "Logistics", health_score: 42, account_manager: "Katie Grundl" },
  { id: "cus_TvRwTTkmc6USka", name: "Together Trade and Commerce", industry: "Trade", health_score: 87, account_manager: "Annie Edholm" },
  { id: "cus_TvLMcJHC1hBvme", name: "Preferred Transportation Services", industry: "Transport", health_score: 90, account_manager: "Eric Shure" },
  { id: "cus_TvL74uG7U9JFz3", name: "WorldCraft Logistics", industry: "Logistics", health_score: 86, account_manager: "Terrell Cherisier" },
  { id: "cus_TtBk1JdBuSgYw3", name: "AFP Transport, LLC", industry: "Transport", health_score: 82, account_manager: "Vinny Paz" },
  { id: "cus_Tt927het6i2Moe", name: "CAC International LLC", industry: "Intermodal", health_score: 45, account_manager: "Katie Grundl" },
  { id: "cus_Ts4Ih5uRJaCbvK", name: "Kimberly Transport LLC", industry: "Transport", health_score: 51, account_manager: "Annie Edholm" },
  { id: "cus_TpioOwgpo5T2pZ", name: "X-Press Container Freight Inc", industry: "Drayage", health_score: 89, account_manager: "Joseph Greenwell" },
  { id: "cus_TpiVYmjkEJVhdZ", name: "Nica Container Freight Line Inc.", industry: "Drayage", health_score: 84, account_manager: "Nikki Driskill" },
  { id: "cus_TibqoeAtvx2aEB", name: "Sunrise Trucking Inc.", industry: "Trucking", health_score: 29, account_manager: "Terrell Cherisier" },
  { id: "cus_ThYdrfLQckobi1", name: "Coast to Coast Logistics LLC", industry: "Logistics", health_score: 93, account_manager: "Vinny Paz" },
  { id: "cus_ThDIZBMnJLO0ar", name: "AI Trans Inc", industry: "Transport", health_score: 81, account_manager: "Katie Grundl" },
  { id: "cus_Tg29hYSuZdFm2A", name: "Kentucky Container Service Inc.", industry: "Warehousing", health_score: 88, account_manager: "Annie Edholm" },
  { id: "cus_TdOWVSdIZIjmRn", name: "All City Leasing & Warehousing", industry: "Warehousing", health_score: 76, account_manager: "Eric Shure" },
  { id: "cus_TdLzIN8kWVHGwI", name: "Troy Logistical Transport Inc.", industry: "Logistics", health_score: 53, account_manager: "Joseph Greenwell" },
  { id: "cus_TaqJTwiAc7CdS6", name: "CNCF Transportation Inc.", industry: "Trucking", health_score: 80, account_manager: "Nikki Driskill" },
  { id: "cus_TaUEygSwevikdw", name: "SS Trucking, Inc.", industry: "Trucking", health_score: 36, account_manager: "Terrell Cherisier" },
  { id: "cus_Ta0zShkWjM34SK", name: "Nevoya", industry: "Logistics", health_score: 94, account_manager: "Vinny Paz" },
  { id: "cus_Ta0Eb5zcse8Hme", name: "LOE/LOH (Evans Delivery)", industry: "Freight", health_score: 77, account_manager: "Katie Grundl" },
  { id: "cus_TWjb0R9KFSFu2w", name: "3 PL Global Group Inc", industry: "Logistics", health_score: 85, account_manager: "Annie Edholm" },
  { id: "cus_TUnBIymG76wfpN", name: "Asset Based Intermodal Inc.", industry: "Intermodal", health_score: 87, account_manager: "Eric Shure" },
  { id: "cus_TROWm5cQdIh3cm", name: "Ice Transportation, Inc", industry: "Transport", health_score: 79, account_manager: "Joseph Greenwell" },
  { id: "cus_TROFPgj5vMzRwe", name: "UQI Express Inc.", industry: "Express Delivery", health_score: 83, account_manager: "Nikki Driskill" },
  { id: "cus_TOr1eXRSxoGRx2", name: "Polaris Inc.", industry: "Logistics", health_score: 55, account_manager: "Terrell Cherisier" },
  { id: "cus_TOkMBnJi22GIJ7", name: "CargoLink Miami", industry: "Freight", health_score: 90, account_manager: "Vinny Paz" },
  { id: "cus_TKkAursnkbOwjI", name: "W.M. Stone", industry: "Logistics", health_score: 86, account_manager: "Katie Grundl" },
  { id: "cus_TJXgVycInRKj3f", name: "Engleman Transportation Inc.", industry: "Trucking", health_score: 82, account_manager: "Annie Edholm" },
  { id: "cus_TGwUcmWCA9ipFc", name: "Bridges Freight Services Inc", industry: "Freight", health_score: 81, account_manager: "Eric Shure" },
  { id: "cus_TFn09cxOAHIyuY", name: "SC Express Logistics", industry: "Logistics", health_score: 84, account_manager: "Joseph Greenwell" },
  { id: "cus_SpDrK5aT83BsSB", name: "Midwest Cargo Systems, Inc.", industry: "Intermodal", health_score: 91, account_manager: "Vinny Paz" },
  { id: "cus_SLFvsLwoSQZkvV", name: "Cena Freight Solutions", industry: "Freight", health_score: 75, account_manager: "Nikki Driskill" },
  { id: "cus_SJ2b9DxT9dEMLE", name: "Rushmore Transportation Ltd", industry: "Transport", health_score: 88, account_manager: "Terrell Cherisier" },
  { id: "cus_SIadVpfrYIzmtW", name: "R2R Intermodal Inc", industry: "Intermodal", health_score: 67, account_manager: "Katie Grundl" },
  { id: "cus_Srp55Ti0xsWrwJ", name: "J L Green Trucking Company, Inc.", industry: "Trucking", health_score: 73, account_manager: "Annie Edholm" },
  { id: "cus_SXGPLQTTH6gMsh", name: "Forward Air Corporation", industry: "Freight", health_score: 95, account_manager: "Vinny Paz" },
  { id: "cus_STtdW1qli8EQ4N", name: "Year-Round Enterprises", industry: "Logistics", health_score: 62, account_manager: "Eric Shure" },
];

const SAMPLE_LOAD_VOLUMES: VolumeTrend = {
  data: [
    { date: "2025-04", value: 12450 },
    { date: "2025-05", value: 13200 },
    { date: "2025-06", value: 14800 },
    { date: "2025-07", value: 14100 },
    { date: "2025-08", value: 15600 },
    { date: "2025-09", value: 16200 },
    { date: "2025-10", value: 17800 },
    { date: "2025-11", value: 16900 },
    { date: "2025-12", value: 15400 },
    { date: "2026-01", value: 18200 },
    { date: "2026-02", value: 19500 },
    { date: "2026-03", value: 21300 },
  ],
  trend: "up",
  change_pct: 14.2,
};

const SAMPLE_INVOICE_VOLUMES: VolumeTrend = {
  data: [
    { date: "2025-04", value: 845 },
    { date: "2025-05", value: 920 },
    { date: "2025-06", value: 1050 },
    { date: "2025-07", value: 980 },
    { date: "2025-08", value: 1120 },
    { date: "2025-09", value: 1180 },
    { date: "2025-10", value: 1340 },
    { date: "2025-11", value: 1260 },
    { date: "2025-12", value: 1150 },
    { date: "2026-01", value: 1420 },
    { date: "2026-02", value: 1580 },
    { date: "2026-03", value: 1690 },
  ],
  trend: "up",
  change_pct: 11.8,
};

const SAMPLE_GAINSIGHT: GainsightMetrics = {
  health_score: 76,
  mobile_app_usage_pct: 64.3,
  tariffs_automation_pct: 47.8,
};

const SAMPLE_GONG: GongData = {
  overall_sentiment: "neutral",
  sentiment_score: 0.58,
  recent_calls: 142,
  bad_calls: [
    {
      call_id: "call-agg-001",
      date: "2026-03-18",
      summary: "Sunrise Trucking escalated about delayed EDI integration; customer threatened to cancel contract",
      participants: ["Terrell Cherisier", "Sam Gill (Sunrise Trucking)", "Katie Grundl"],
      sentiment_score: 0.15,
    },
    {
      call_id: "call-agg-002",
      date: "2026-03-15",
      summary: "USA Cargo Logistics frustrated with recurring invoice discrepancies and past-due subscription status",
      participants: ["Katie Grundl", "VP Operations (USA Cargo)"],
      sentiment_score: 0.22,
    },
    {
      call_id: "call-agg-003",
      date: "2026-03-12",
      summary: "SS Trucking expressed dissatisfaction with mobile app crashes during peak dispatch hours",
      participants: ["Terrell Cherisier", "Sandhu (SS Trucking)"],
      sentiment_score: 0.18,
    },
    {
      call_id: "call-agg-004",
      date: "2026-03-10",
      summary: "CAC International unhappy with slow support response times on P1 billing issue",
      participants: ["Katie Grundl", "Dispatch (CAC International)", "Joseph Greenwell"],
      sentiment_score: 0.25,
    },
    {
      call_id: "call-agg-005",
      date: "2026-03-07",
      summary: "The Ace Group raised concerns about tariff automation accuracy for cross-border shipments",
      participants: ["Terrell Cherisier", "Payables (The Ace Group)"],
      sentiment_score: 0.30,
    },
  ],
};

const SAMPLE_TICKETS: TicketSummary = {
  total_open: 47,
  by_priority: { P1: 3, P2: 12, P3: 18, P4: 10, P5: 4 },
  tickets: [
    { id: "FD-40112", subject: "API gateway returning 502 errors intermittently", status: "Escalated", priority: "P1", created_at: "2026-03-18", updated_at: "2026-03-20" },
    { id: "FD-40098", subject: "SSO login broken after latest update for Forward Air", status: "In Progress", priority: "P1", created_at: "2026-03-17", updated_at: "2026-03-19" },
    { id: "FD-40087", subject: "Mobile app push notifications not working on Android", status: "Open", priority: "P1", created_at: "2026-03-15", updated_at: "2026-03-18" },
    { id: "FD-40075", subject: "Invoice PDF generation fails for multi-currency accounts", status: "In Progress", priority: "P2", created_at: "2026-03-14", updated_at: "2026-03-19" },
    { id: "FD-40062", subject: "Tariff calculation incorrect for cross-border CA shipments", status: "Escalated", priority: "P2", created_at: "2026-03-13", updated_at: "2026-03-20" },
    { id: "FD-40051", subject: "Tracking page showing stale data for Medlog loads", status: "In Progress", priority: "P2", created_at: "2026-03-12", updated_at: "2026-03-18" },
    { id: "FD-40044", subject: "Bulk import timing out for files over 10MB", status: "Open", priority: "P2", created_at: "2026-03-11", updated_at: "2026-03-17" },
    { id: "FD-40033", subject: "Webhook delivery failures to customer endpoint (Ace Group)", status: "Waiting on Customer", priority: "P2", created_at: "2026-03-10", updated_at: "2026-03-16" },
    { id: "FD-40028", subject: "Dashboard loading slowly for large datasets", status: "In Progress", priority: "P3", created_at: "2026-03-09", updated_at: "2026-03-18" },
    { id: "FD-40019", subject: "Report export missing columns for custom fields", status: "Open", priority: "P3", created_at: "2026-03-08", updated_at: "2026-03-15" },
    { id: "FD-40011", subject: "Email notifications delayed by 2+ hours", status: "In Progress", priority: "P3", created_at: "2026-03-07", updated_at: "2026-03-14" },
    { id: "FD-40005", subject: "Rate limiting too aggressive on search API", status: "Waiting on Customer", priority: "P3", created_at: "2026-03-06", updated_at: "2026-03-12" },
    { id: "FD-39998", subject: "Custom field mapping lost after Salesforce sync", status: "Open", priority: "P3", created_at: "2026-03-05", updated_at: "2026-03-11" },
    { id: "FD-39990", subject: "Data discrepancy between dashboard and API response", status: "Open", priority: "P4", created_at: "2026-03-04", updated_at: "2026-03-10" },
    { id: "FD-39982", subject: "User permissions not inherited from parent org", status: "Open", priority: "P4", created_at: "2026-03-03", updated_at: "2026-03-09" },
  ],
};

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadVolumes, setLoadVolumes] = useState<VolumeTrend | null>(null);
  const [invoiceVolumes, setInvoiceVolumes] = useState<VolumeTrend | null>(null);
  const [gainsightAggregate, setGainsightAggregate] = useState<GainsightMetrics | null>(null);
  const [gongAggregate, setGongAggregate] = useState<GongData | null>(null);
  const [ticketAggregate, setTicketAggregate] = useState<TicketSummary | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);

  // Load mock data (demo mode — used when no integrations are connected)
  const loadMockData = useCallback(() => {
    setCustomers(SAMPLE_CUSTOMERS);
    setLoadVolumes(SAMPLE_LOAD_VOLUMES);
    setInvoiceVolumes(SAMPLE_INVOICE_VOLUMES);
    setGainsightAggregate(SAMPLE_GAINSIGHT);
    setGongAggregate(SAMPLE_GONG);
    setTicketAggregate(SAMPLE_TICKETS);
    setIsLoaded(true);
  }, []);

  // Fetch real data from connected integrations via the dashboard API
  const refreshDashboard = useCallback(() => {
    apiFetch<DashboardData>("/dashboard")
      .then((data) => {
        setConnectedIntegrations(data.connected_integrations);

        // Always load customers from backend when available
        if (data.customers.length > 0) {
          setCustomers(data.customers);
          setIsLoaded(true);
        }

        // Set integration-specific data (real data from connected APIs)
        if (data.gong) setGongAggregate(data.gong);
        if (data.gainsight) setGainsightAggregate(data.gainsight);
        if (data.load_volumes) setLoadVolumes(data.load_volumes);
        if (data.invoice_volumes) setInvoiceVolumes(data.invoice_volumes);
        if (data.tickets) setTicketAggregate(data.tickets);
      })
      .catch(() => {
        // Dashboard API not available — no-op, user can still use mock data
      });
  }, []);

  // On mount, re-sync any saved integration credentials to the backend
  // (handles server restarts where in-memory store is cleared) then fetch data
  useEffect(() => {
    async function syncAndLoad() {
      try {
        const raw = localStorage.getItem("integration_configs");
        if (raw) {
          const configs = JSON.parse(raw) as Record<string, Record<string, string>>;
          // Re-register all saved integrations with the backend
          await Promise.all(
            Object.entries(configs).map(([id, credentials]) =>
              apiPost(`/integrations/${id}/connect`, { credentials }).catch(() => {})
            )
          );
        }
      } catch {
        // ignore
      }
      // Now fetch dashboard data with integrations restored
      refreshDashboard();
    }
    syncAndLoad();
  }, [refreshDashboard]);

  return (
    <MockDataContext.Provider
      value={{
        customers,
        isLoaded,
        loadMockData,
        refreshDashboard,
        loadVolumes,
        invoiceVolumes,
        gainsightAggregate,
        gongAggregate,
        ticketAggregate,
        connectedIntegrations,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}
