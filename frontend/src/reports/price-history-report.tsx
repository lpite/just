import { FormEvent, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocation } from "wouter";
import { ProductPrice, SearchResult } from "../api/types";
import { useProductSearch } from "../api/hooks/useProducts";
import * as priceService from "../api/services/priceService";
import { MyTable } from "../components/table";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

type PriceHistoryRow = ProductPrice & { change: number | null };

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

const historyColumnHelper = createColumnHelper<PriceHistoryRow>();

export function PriceHistoryReport() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<ProductPrice[]>([]);
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

    priceService
      .getProductPriceHistory(Number(selected.id))
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
    let previous: number | null = null;
    return history.map((entry) => {
      const change = previous === null ? null : entry.price - previous;
      previous = entry.price;
      return { ...entry, change };
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
          return (
            <button
              onClick={() =>
                setLocation(`/price-setting-document/${row.document_id}`)
              }
              className="text-blue-600 hover:underline"
            >
              Ціни #{row.document_id}
            </button>
          );
        },
      }),
      historyColumnHelper.accessor("price", {
        header: "Ціна",
        cell: (info) => info.getValue(),
      }),
      historyColumnHelper.accessor("change", {
        header: "Зміна",
        cell: (info) => {
          const value = info.getValue();
          if (value === null) return "-";
          const className =
            value > 0
              ? "text-green-600"
              : value < 0
                ? "text-red-600"
                : "text-gray-500";
          return (
            <span className={className}>
              {value > 0 ? `+${value}` : `${value}`}
            </span>
          );
        },
      }),
    ],
    [setLocation],
  );

  if (selected) {
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">
            Історія цін: {selected.name}
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
      <h2 className="text-lg font-bold mb-2">Історія цін</h2>
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