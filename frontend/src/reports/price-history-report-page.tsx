import { NavBar } from "../components/nav-bar";
import { PriceHistoryReport } from "./price-history-report";

export default function PriceHistoryReportPage() {
  return (
    <main>
      <NavBar />
      <div className="p-4">
        <PriceHistoryReport />
      </div>
    </main>
  );
}