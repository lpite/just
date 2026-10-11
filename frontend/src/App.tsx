import { Route, Switch } from "wouter";
import { Toaster } from "sonner";

import ProductPage from "./pages/product-page";
import ProductListPage from "./pages/product-list-page";

import IncomeDocumentListPage from "./pages/income-document-list-page";
import IncomeDocumentPage from "./pages/income-document-page";

import PriceSettingDocumentListPage from "./pages/price-setting-document-list-page";
import PriceSettingDocumentPage from "./pages/price-setting-document-page";

import ReportsPage from "./pages/reports-page";
import StockHistoryReportPage from "./pages/stock-history-report-page";
import SalesDocumentListPage from "./pages/sales-document-list-page";
import SalesDocumentPage from "./pages/sales-document-page";
import { MobilePosPage } from "./pages/mobile-pos-page";

function App() {
  return (
    <>
      <Toaster richColors={true} position="top-right" />
      <Switch>
        <Route path="/" component={ProductListPage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route
          path="/list/income-document"
          component={IncomeDocumentListPage}
        />
        <Route path="/income-document/:id" component={IncomeDocumentPage} />
        <Route path="/list/sales-document" component={SalesDocumentListPage} />
        <Route path="/sales-document/:id" component={SalesDocumentPage} />
        <Route
          path="/list/price-setting-document"
          component={PriceSettingDocumentListPage}
        />
        <Route
          path="/price-setting-document/:id"
          component={PriceSettingDocumentPage}
        />
        <Route path="/reports" component={ReportsPage} />
        <Route
          path="/reports/stock-history"
          component={StockHistoryReportPage}
        />
        <Route path="/mobile-pos" component={MobilePosPage} />
      </Switch>
    </>
  );
}

export default App;
