import { Routes, Route } from "react-router-dom";
import { MockDataProvider } from "./context/MockDataContext";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import CustomerListPage from "./pages/CustomerListPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import SettingsPage from "./pages/SettingsPage";
import HealthModelPage from "./pages/HealthModelPage";

export default function App() {
  return (
    <MockDataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/health-model" element={<HealthModelPage />} />
        </Routes>
      </Layout>
    </MockDataProvider>
  );
}
