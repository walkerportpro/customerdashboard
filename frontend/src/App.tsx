import { Routes, Route, Link } from "react-router-dom";
import CustomerListPage from "./pages/CustomerListPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-xl font-bold text-gray-900">
                Customer Dashboard
              </h1>
            </Link>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Mock Data
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
