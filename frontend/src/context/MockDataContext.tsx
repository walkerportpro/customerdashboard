import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Customer } from "../types";

interface MockDataState {
  customers: Customer[];
  isLoaded: boolean;
  loadMockData: () => void;
}

const MockDataContext = createContext<MockDataState>({
  customers: [],
  isLoaded: false,
  loadMockData: () => {},
});

export function useMockData() {
  return useContext(MockDataContext);
}

// Real customer data derived from Stripe
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

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadMockData = useCallback(() => {
    setCustomers(SAMPLE_CUSTOMERS);
    setIsLoaded(true);
  }, []);

  return (
    <MockDataContext.Provider value={{ customers, isLoaded, loadMockData }}>
      {children}
    </MockDataContext.Provider>
  );
}
