import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { createColumnHelper } from "@tanstack/react-table";
import { SalesDocument, SalesDocumentItem, Partner } from "../api/types";
import { useDocument } from "../api/hooks/useDocument";
import { useDocumentMutations } from "../api/hooks/useDocumentMutations";
import * as partnerService from "../api/services/partnerService";
import { MyTable } from "../components/table";
import { ProductSelectionToDocumentDialog } from "../components/product-selection-to-document-dialog";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { CartItem } from "../hooks/useCart";
import { NavBar } from "../components/nav-bar";
import { toDatetimeLocal } from "../utils/toDatetimeLocal";

const itemColumnHelper = createColumnHelper<SalesDocumentItem>();

export function SalesDocumentPage() {
  const [, params] = useRoute("/sales-document/:id");
  const [, setLocation] = useLocation();

  const [editable, setEditable] = useState(true);

  const id = (params as { id?: string } | null)?.id || "";
  const isNew = id === "new";
  const documentId = isNew ? undefined : Number(id);

  const { document, isLoading: isLoadingDocument } = useDocument(
    "sales",
    documentId!,
  );
  const { create, update, post, unpost } = useDocumentMutations();

  const [formData, setFormData] = useState<SalesDocument>({
    id: 0,
    date: new Date().toISOString().split("T")[0],
    partner_id: 0,
    posted: false,
    items: [],
  });

  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const data = await partnerService.listPartners();
        setPartners(data);
      } catch (error) {
        console.error("Error loading partners:", error);
      }
    };
    loadPartners();
  }, []);

  useEffect(() => {
    if (document) {
      if (document.posted) {
        setEditable(false);
      }

      setFormData(document as SalesDocument);
    }
  }, [document]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      date: e.target.value,
    }));
  };

  const handlePartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      partner_id: Number(e.target.value),
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
          product: {
            name: item.name,
            article: "",
          },
          price: item.price,
          quantity: item.quantity,
          created_at: new Date().toISOString(),
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

  const handleUpdateItem = (
    index: number,
    field: "quantity" | "price",
    value: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).map((item, i) =>
        i === index
          ? field === "quantity"
            ? { ...item, quantity: value }
            : { ...item, price: value }
          : item,
      ),
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const items = formData.items?.map((item) => ({
        product_id: item.product_id,
        price: item.price,
        quantity: item.quantity,
      }));

      if (isNew) {
        const result = await create.execute("sales", {
          date: formData.date,
          partner_id: formData.partner_id,
          items,
        });
        setLocation(`/sales-document/${result.id}`);
      } else {
        await update.execute("sales", formData.id, {
          date: formData.date,
          partner_id: formData.partner_id,
          items,
        });
      }
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async () => {
    try {
      await post.execute("sales", formData.id);
      setFormData((prev) => ({ ...prev, posted: true }));
    } catch (error) {
      console.error("Error posting document:", error);
    }
  };

  const handleUnpost = async () => {
    if (window.confirm("Unpost this document?")) {
      try {
        await unpost.execute("sales", formData.id);
        setFormData((prev) => ({ ...prev, posted: false }));
      } catch (error) {
        console.error("Error unposting document:", error);
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
    itemColumnHelper.accessor("product.article", {
      header: "article",
      cell: (info) => info.getValue() ?? "-",
    }),
    itemColumnHelper.accessor("product.name", {
      header: "name",
      cell: (info) => info.getValue() ?? "-",
    }),
    itemColumnHelper.accessor("quantity", {
      header: "Quantity",
      meta: {
        editable: true,
        onChange: (rowIndex: number, value: string) =>
          handleUpdateItem(rowIndex, "quantity", Number(value)),
      },
    }),
    itemColumnHelper.accessor("price", {
      header: "Price",
      meta: {
        editable: true,
        onChange: (rowIndex: number, value: string) =>
          handleUpdateItem(rowIndex, "price", Number(value)),
      },
    }),
    itemColumnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <button
          onClick={() => handleRemoveItem(info.row.index)}
          className="text-red-600 hover:text-red-800"
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
          {isNew ? "Новий продаж" : `Продаж #${formData.id}`}
        </h1>

        <div className="space-y-4">
          <div className="flex gap-2 justify-start pt-4">
            <Button
              type="button"
              variant="contained"
              disabled={isLoading}
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
                    disabled={isLoading || post.isLoading}
                  >
                    Провести
                  </Button>
                ) : (
                  <Button
                    onClick={handleUnpost}
                    variant="contained"
                    color="warning"
                    disabled={isLoading || unpost.isLoading}
                  >
                    Розпровести
                  </Button>
                )}
              </>
            )}
            <Button
              type="button"
              variant="outlined"
              disabled={isLoading}
              onClick={() => setEditable(true)}
            >
              Редагувати
            </Button>
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
            <select
              value={formData.partner_id || ""}
              onChange={handlePartnerChange}
              className="border px-2 py-2 rounded"
              disabled={!editable}
            >
              <option value="">Select Partner</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-4">Items</h2>
            <div className="mt-4">
              <ProductSelectionToDocumentDialog
                addNewItem={handleAddItem}
                disabled={(isNew && formData.partner_id === 0) || !editable}
                type="sales"
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

export default SalesDocumentPage;