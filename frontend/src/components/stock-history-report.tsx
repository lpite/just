import { FormEvent, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocation } from "wouter";
import { SearchResult, StockEntry } from "../api/types";
import { useProductSearch } from "../api/hooks/useProducts";
import * as stockService from "../api/services/stockService";
import { MyTable } from "./table";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

type StockHistoryRow = StockEntry & { balance: number };

const searchColumnHelper = createColumnHelper<SearchResult>();
const searchColumns = [
  searchColumnHelper.accessor("id", {
    header: "ID",
    cell: (r) => r.getValue(),
  }),
  searchColumnHelper.accessor("article", {
    header: "Article",
    cell: (r) => r.getValue(),
  }),
  searchColumnHelper.accessor("name", {
    header: "Name",
    cell: (r) => r.getValue(),
  }),
  searchColumnHelper.accessor("brand", {
    header: "Brand",
    cell: (r) => r.getValue(),
  }),
  searchColumnHelper.accessor("price", {
    header: "Price",
    cell: (r) => r.getValue(),
  }),
  searchColumnHelper.accessor("quantity", {
    header: "Stock",
    cell: (r) => r.getValue(),
  }),
];

const historyColumnHelper = createColumnHelper<StockHistoryRow>();

export function StockHistoryReport() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { results, isLoading: isLoadingSearch } = useProductSearch(query);

  function search(e: FormEvent) {
    e.preventDefault();
    setQuery(searchInput.trim());
  }

  useEffect(() => {
    if (!selected) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    stockService
      .getProductStockHistory(Number(selected.id))
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const rows = useMemo(() => {
    let running = 0;
    return history.map((entry) => {
      running += entry.quantity;
      return { ...entry, balance: running };
    });
  }, [history]);

  const historyColumns = useMemo(
    () => [
      historyColumnHelper.accessor("timestamp", {
        header: "Дата",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      historyColumnHelper.accessor("document_id", {
        header: "Документ",
        cell: (info) => {
          const row = info.row.original;
          if (!row.document_id || !row.document_type) return "-";
          const label =
            row.document_type === "sales"
              ? `Продаж #${row.document_id}`
              : `Надходження #${row.document_id}`;
          return (
            <button
              onClick={() =>
                setLocation(
                  row.document_type === "sales"
                    ? `/sales-document/${row.document_id}`
                    : `/income-document/${row.document_id}`,
                )
              }
              className="text-blue-600 hover:underline"
            >
              {label}
            </button>
          );
        },
      }),
      historyColumnHelper.accessor("quantity", {
        header: "Зміна",
        cell: (info) => {
          const value = info.getValue();
          const className = value >= 0 ? "text-green-600" : "text-red-600";
          return (
            <span className={className}>
              {value >= 0 ? `+${value}` : `${value}`}
            </span>
          );
        },
      }),
      historyColumnHelper.accessor("balance", {
        header: "Залишок",
        cell: (info) => info.getValue(),
      }),
    ],
    [setLocation],
  );

  if (selected) {
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">
            Історія складу: {selected.name}
            {selected.article ? ` (${selected.article})` : ""}
          </h2>
          <Button variant="outlined" onClick={() => setSelected(null)}>
            Змінити продукт
          </Button>
        </div>

        {isLoading ? (
          <div>Завантаження історії...</div>
        ) : rows.length === 0 ? (
          <div>Історії для цього продукту немає</div>
        ) : (
          <MyTable columns={historyColumns} data={rows} />
        )}
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold mb-2">Історія складу</h2>
      <form onSubmit={search} className="flex gap-2 mb-2">
        <TextField
          label="Пошук продукту"
          placeholder="Search products..."
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          fullWidth
        />
        <Button type="submit" variant="outlined">
          Пошук
        </Button>
      </form>

      {isLoadingSearch ? (
        <div>Пошук...</div>
      ) : query && results.length === 0 ? (
        <div>Продукти не знайдено</div>
      ) : results.length > 0 ? (
        <MyTable
          columns={searchColumns}
          data={results}
          onRowClick={(row) => setSelected(row.original)}
        />
      ) : null}
    </section>
  );
}