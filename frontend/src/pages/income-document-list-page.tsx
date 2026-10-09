import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocation } from "wouter";
import { IncomeDocument } from "../api/types";
import { useDocuments } from "../api/hooks/useDocuments";
import { MyTable } from "../components/table";
import Button from "@mui/material/Button";
import { NavBar } from "../components/nav-bar";

const columnHelper = createColumnHelper<IncomeDocument>();

export function IncomeDocumentListPage() {
  const [, setLocation] = useLocation();
  const { documents, isLoading } = useDocuments("income");

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
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
    [setLocation],
  );

  if (isLoading) return <div>Loading documents...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4">
        <div className="">
          <h1 className="text-2xl font-bold">Income Documents</h1>
          <Button
            variant="contained"
            onClick={() => setLocation("/income-document/new")}
          >
            New Document
          </Button>
        </div>

        <MyTable
          columns={columns}
          data={documents as IncomeDocument[]}
          onRowDoubleClick={(row) =>
            setLocation(`/income-document/${row.getAllCells()[0].getValue()}`)
          }
        />
      </div>
    </main>
  );
}

export default IncomeDocumentListPage;
