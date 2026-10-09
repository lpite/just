import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocation } from "wouter";
import { PriceSettingDocument } from "../api/types";
import * as priceSettingDocumentService from "../api/services/priceSettingDocumentService";
import { MyTable } from "../components/table";
import Button from "@mui/material/Button";
import { NavBar } from "../components/nav-bar";

const columnHelper = createColumnHelper<PriceSettingDocument>();

export function PriceSettingDocumentListPage() {
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<PriceSettingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    priceSettingDocumentService
      .listPriceSettingDocuments()
      .then((data) => {
        if (!cancelled) setDocuments(data);
      })
      .catch((error) =>
        console.error("Error loading price setting documents:", error),
      )
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString()
            : "-",
      }),
      columnHelper.accessor("posted", {
        header: "Posted",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
      }),
    ],
    [],
  );

  if (isLoading) return <div>Loading documents...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4">
        <div className="">
          <h1 className="text-2xl font-bold">Встановлення цін</h1>
          <Button
            variant="contained"
            onClick={() => setLocation("/price-setting-document/new")}
          >
            New Document
          </Button>
        </div>

        <MyTable
          columns={columns}
          data={documents}
          onRowDoubleClick={(row) =>
            setLocation(
              `/price-setting-document/${row.getAllCells()[0].getValue()}`,
            )
          }
        />
      </div>
    </main>
  );
}

export default PriceSettingDocumentListPage;
