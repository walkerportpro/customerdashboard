import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Building2, User } from "lucide-react";
import { useApiData } from "../hooks/useCustomerData";
import Card from "../components/Card";
import VolumeChart from "../components/VolumeChart";
import GainsightMetricsCard from "../components/GainsightMetrics";
import GongSentimentCard from "../components/GongSentiment";
import OnboardingStatusCard from "../components/OnboardingStatus";
import TicketSummaryCard from "../components/TicketSummary";
import type {
  Customer,
  VolumeTrend,
  GainsightMetrics,
  GongData,
  OnboardingProject,
  TicketSummary,
} from "../types";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const prefix = `/customers/${id}`;

  const customer = useApiData<Customer>(prefix);
  const gainsight = useApiData<GainsightMetrics>(`${prefix}/gainsight`);
  const loadVolumes = useApiData<VolumeTrend>(`${prefix}/load-volumes`);
  const invoicingVolumes = useApiData<VolumeTrend>(`${prefix}/invoicing-volumes`);
  const gong = useApiData<GongData>(`${prefix}/gong`);
  const onboarding = useApiData<OnboardingProject[]>(`${prefix}/onboarding`);
  const tickets = useApiData<TicketSummary>(`${prefix}/tickets`);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb & Customer Header */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Customers
        </Link>
        {customer.data && (
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-gray-100">
              {customer.data.name}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-dark-400">
                <Building2 className="w-3.5 h-3.5" />
                {customer.data.industry}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-dark-400">
                <User className="w-3.5 h-3.5" />
                {customer.data.account_manager}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Health & Adoption"
          source="Gainsight"
          loading={gainsight.loading}
          error={gainsight.error}
        >
          {gainsight.data && <GainsightMetricsCard data={gainsight.data} />}
        </Card>

        <Card
          title="Customer Sentiment"
          source="Gong"
          loading={gong.loading}
          error={gong.error}
        >
          {gong.data && <GongSentimentCard data={gong.data} />}
        </Card>

        <Card
          title="Load Volumes"
          source="Salesforce"
          loading={loadVolumes.loading}
          error={loadVolumes.error}
        >
          {loadVolumes.data && (
            <VolumeChart data={loadVolumes.data} color="#3b82f6" />
          )}
        </Card>

        <Card
          title="Invoicing Volumes"
          source="Salesforce"
          loading={invoicingVolumes.loading}
          error={invoicingVolumes.error}
        >
          {invoicingVolumes.data && (
            <VolumeChart data={invoicingVolumes.data} color="#8b5cf6" />
          )}
        </Card>

        <Card
          title="Onboarding"
          source="RocketLane"
          loading={onboarding.loading}
          error={onboarding.error}
        >
          {onboarding.data && <OnboardingStatusCard data={onboarding.data} />}
        </Card>

        <Card
          title="Support Tickets"
          source="Freshdesk"
          loading={tickets.loading}
          error={tickets.error}
        >
          {tickets.data && <TicketSummaryCard data={tickets.data} />}
        </Card>
      </div>
    </div>
  );
}
