import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocation } from "wouter";
import { SalesDocument } from "../api/types";
import { useDocuments } from "../api/hooks/useDocuments";
import { MyTable } from "../components/table";
import Button from "@mui/material/Button";
import { NavBar } from "../components/nav-bar";

const columnHelper = createColumnHelper<SalesDocument>();

export function SalesDocumentListPage() {
  const [, setLocation] = useLocation();
  const { documents, isLoading } = useDocuments("sales");

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => (
          <button
            onClick={() => setLocation(`/sales-document/${info.getValue()}`)}
            className="text-blue-600 hover:underline"
          >
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor("partner_id", {
        header: "Partner ID",
      }),
      columnHelper.accessor("posted", {
        header: "Posted",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
      }),
    ],
    [setLocation]
  );

  if (isLoading) return <div>Loading documents...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Sales Documents</h1>
          <Button
            variant="contained"
            onClick={() => setLocation("/sales-document/new")}
          >
            New Document
          </Button>
        </div>

        <MyTable columns={columns} data={documents as SalesDocument[]} />
      </div>
    </main>
  );
}

export default SalesDocumentListPage;
