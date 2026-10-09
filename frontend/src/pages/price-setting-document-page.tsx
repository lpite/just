import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { createColumnHelper } from "@tanstack/react-table";
import { PriceSettingDocument, PriceSettingDocumentItem } from "../api/types";
import * as priceSettingDocumentService from "../api/services/priceSettingDocumentService";
import { MyTable } from "../components/table";
import { ProductSelectionToDocumentDialog } from "../components/product-selection-to-document-dialog";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { CartItem } from "../hooks/useCart";
import { NavBar } from "../components/nav-bar";
import { toDatetimeLocal } from "../utils/toDatetimeLocal";

type PriceSettingItem = PriceSettingDocumentItem & {
  product?: { name?: string; article?: string };
};

const itemColumnHelper = createColumnHelper<PriceSettingItem>();

export function PriceSettingDocumentPage() {
  const [, params] = useRoute("/price-setting-document/:id");
  const [, setLocation] = useLocation();

  const id = (params as { id?: string } | null)?.id || "";
  const isNew = id === "new";
  const documentId = isNew ? undefined : Number(id);

  const [formData, setFormData] = useState<PriceSettingDocument>({
    id: 0,
    date: new Date().toISOString().split("T")[0],
    posted: false,
    items: [],
  });

  const [isLoadingDocument, setIsLoadingDocument] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  const editable = !formData.posted;

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    setIsLoadingDocument(true);
    priceSettingDocumentService
      .getPriceSettingDocument(documentId!)
      .then((document) => {
        if (!cancelled) setFormData(document);
      })
      .catch((error) =>
        console.error("Error loading price setting document:", error),
      )
      .finally(() => {
        if (!cancelled) setIsLoadingDocument(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, isNew]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      date: e.target.value,
    }));
  };

  const handleAddItem = (item: CartItem) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: 0,
          document_id: prev.id,
          product_id: Number(item.id),
          product: { name: item.name, article: "" },
          price: item.price,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItem = (index: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).map((item, i) =>
        i === index ? { ...item, price: value } : item,
      ),
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const items = (formData.items || []).map((item) => ({
        product_id: item.product_id,
        price: item.price,
      }));

      if (isNew) {
        const result =
          await priceSettingDocumentService.createPriceSettingDocument({
            date: formData.date,
            items,
          });
        setLocation(`/price-setting-document/${result.id}`);
      } else {
        await priceSettingDocumentService.updatePriceSettingDocument(
          formData.id,
          { date: formData.date, items },
        );
      }
    } catch (error) {
      console.error("Error saving price setting document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePost = async () => {
    try {
      await priceSettingDocumentService.postPriceSettingDocument(formData.id);
      setFormData((prev) => ({ ...prev, posted: true }));
    } catch (error) {
      console.error("Error posting price setting document:", error);
    }
  };

  const handleUnpost = async () => {
    if (window.confirm("Unpost this document?")) {
      try {
        await priceSettingDocumentService.unpostPriceSettingDocument(
          formData.id,
        );
        setFormData((prev) => ({ ...prev, posted: false }));
      } catch (error) {
        console.error("Error unposting price setting document:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this document?")) {
      try {
        await priceSettingDocumentService.deletePriceSettingDocument(
          formData.id,
        );
        setLocation("/list/price-setting-document");
      } catch (error) {
        console.error("Error deleting price setting document:", error);
      }
    }
  };

  const itemColumns = [
    itemColumnHelper.display({
      header: "#",
      cell: ({ row }) => row.index + 1,
    }),
    itemColumnHelper.accessor("product_id", {
      header: "Product ID",
    }),
    itemColumnHelper.accessor("product.name", {
      header: "Name",
      cell: (info) => info.getValue() ?? "-",
    }),
    itemColumnHelper.accessor("price", {
      header: "Price",
      meta: {
        editable: true,
        onChange: (rowIndex: number, value: string) =>
          handleUpdateItem(rowIndex, Number(value)),
      },
    }),
    itemColumnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <button
          onClick={() => handleRemoveItem(info.row.index)}
          disabled={!editable}
          className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove
        </button>
      ),
    }),
  ];

  if (!isNew && isLoadingDocument) return <div>Loading...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">
          {isNew ? "Нове встановлення цін" : `Встановлення цін #${formData.id}`}
        </h1>

        <div className="space-y-4">
          <div className="flex gap-2 justify-start pt-4">
            <Button
              type="button"
              variant="contained"
              disabled={isSaving || !editable}
              onClick={handleSubmit}
            >
              Зберегти
            </Button>
            {!isNew && (
              <>
                {!formData.posted ? (
                  <Button
                    onClick={handlePost}
                    variant="contained"
                    color="success"
                    disabled={isSaving}
                  >
                    Провести
                  </Button>
                ) : (
                  <Button
                    onClick={handleUnpost}
                    variant="contained"
                    color="warning"
                    disabled={isSaving}
                  >
                    Розпровести
                  </Button>
                )}
                <Button
                  onClick={handleDelete}
                  variant="outlined"
                  color="error"
                  disabled={isSaving}
                >
                  Видалити
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              type="datetime-local"
              label="Date"
              value={toDatetimeLocal(formData.date)}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={!editable}
            />
          </div>

          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-4">Товари</h2>
            <div className="mt-4">
              <ProductSelectionToDocumentDialog
                addNewItem={handleAddItem}
                disabled={!editable}
                type="price-setting"
              />
            </div>
            <MyTable
              columns={itemColumns}
              data={formData.items || []}
              disabled={!editable}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default PriceSettingDocumentPage;
