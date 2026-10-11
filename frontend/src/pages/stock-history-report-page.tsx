import { NavBar } from "../components/nav-bar";
import { StockHistoryReport } from "../components/stock-history-report";

export default function StockHistoryReportPage() {
  return (
    <main>
      <NavBar />
      <div className="p-4">
        <StockHistoryReport />
      </div>
    </main>
  );
}
