import { NavBar } from "../components/nav-bar";
import { StockHistoryReport } from "../components/stock-history-report";

export default function StockHistoryReportPage() {
  return (
    <main className="p-4">
      <NavBar />
      <StockHistoryReport />
    </main>
  );
}