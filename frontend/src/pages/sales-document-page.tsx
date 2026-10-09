import { useEffect, useState, useMemo } from "react";
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
  const [match, params] = useRoute("/sales-document/:id");
  const [, setLocation] = useLocation();
  const id = (params as any)?.id || "";
  const isNew = id === "new";
  const documentId = isNew ? undefined : Number(id);

  const { document, isLoading: isLoadingDocument } = useDocument(
    "sales",
    documentId!,
  );
  const {
    create,
    update,
    post,
    unpost,
    delete: deleteDocument,
  } = useDocumentMutations();

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
      setFormData(document);
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

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isNew) {
        const result = await create.execute("sales", {
          date: formData.date,
          partner_id: formData.partner_id,
          items: formData.items?.map((item) => ({
            product_id: item.product_id,
            price: item.price,
            quantity: item.quantity,
          })),
        });
        setLocation(`/sales-document/${result.id}`);
      } else {
        await update.execute("sales", formData.id, {
          date: formData.date,
          partner_id: formData.partner_id,
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

  const handleDelete = async () => {
    if (window.confirm("Delete this document?")) {
      try {
        await deleteDocument.execute("sales", formData.id);
        setLocation("/list/sales-document");
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const itemColumns = useMemo(
    () => [
      itemColumnHelper.accessor("product_id", {
        header: "Product ID",
      }),
      itemColumnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (info) => (
          <input
            type="number"
            value={info.getValue()}
            onChange={(e) =>
              handleUpdateItem(
                (info.row as any).index,
                "quantity",
                Number(e.target.value),
              )
            }
            className="w-20 border px-1"
          />
        ),
      }),
      itemColumnHelper.accessor("price", {
        header: "Price",
        cell: (info) => (
          <input
            type="number"
            value={info.getValue()}
            onChange={(e) =>
              handleUpdateItem(
                (info.row as any).index,
                "price",
                Number(e.target.value),
              )
            }
            className="w-20 border px-1"
            step="0.01"
          />
        ),
      }),
      itemColumnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <button
            onClick={() => handleRemoveItem((info.row as any).index)}
            className="text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        ),
      }),
    ],
    [],
  );

  if (!isNew && isLoadingDocument) return <div>Loading...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">
          {isNew ? "New Sales Document" : `Sales Document #${formData.id}`}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              type="datetime-local"
              label="Date"
              value={toDatetimeLocal(formData.date)}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <select
              value={formData.partner_id || ""}
              onChange={handlePartnerChange}
              className="border px-2 py-2 rounded"
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
            <MyTable columns={itemColumns} data={formData.items || []} />
            <div className="mt-4">
              <ProductSelectionToDocumentDialog
                addNewItem={handleAddItem}
                disabled={isNew && formData.partner_id === 0}
                type="sales"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              onClick={() => setLocation("/list/sales-document")}
              variant="outlined"
            >
              Cancel
            </Button>
            {!isNew && (
              <>
                <Button
                  onClick={handleDelete}
                  variant="outlined"
                  color="error"
                  disabled={isLoading}
                >
                  Delete
                </Button>
                {!formData.posted && (
                  <Button
                    onClick={handlePost}
                    variant="contained"
                    color="warning"
                    disabled={isLoading || post.isLoading}
                  >
                    Post
                  </Button>
                )}
                {formData.posted && (
                  <Button
                    onClick={handleUnpost}
                    variant="contained"
                    color="info"
                    disabled={isLoading || unpost.isLoading}
                  >
                    Unpost
                  </Button>
                )}
              </>
            )}
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isNew ? "Create" : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default SalesDocumentPage;
