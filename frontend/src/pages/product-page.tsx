import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Product } from "../api/types";
import { useProduct } from "../api/hooks/useProducts";
import { useProductMutations } from "../api/hooks/useProductMutations";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { NavBar } from "../components/nav-bar";

export function ProductPage() {
  const [match, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const id = (params as any)?.id || "";
  const isNew = id === "new";
  const productId = isNew ? undefined : Number(id);

  const { product, isLoading: isLoadingProduct } = useProduct(productId!);
  const { create, update, delete: deleteProduct } = useProductMutations();

  const [formData, setFormData] = useState<Product>({
    id: 0,
    name: "",
    nameAlt: "",
    oem: "",
    article: "",
    description: "",
    brand: "",
    units: "",
    places: "",
    photos: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      console.log(product);
      setFormData(product);
    }
  }, [product]);

  const handleChange =
    (field: keyof Product) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isNew) {
        const result = await create.execute({
          name: formData.name,
          nameAlt: formData.nameAlt,
          oem: formData.oem,
          article: formData.article,
          description: formData.description,
          brand: formData.brand,
          units: formData.units,
          places: formData.places,
          photos: formData.photos,
        });
        setLocation(`/product/${result.id}`);
      } else {
        await update.execute(formData.id, formData);
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete product "${formData.name}"?`)) {
      try {
        await deleteProduct.execute(formData.id);
        setLocation("/");
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  if (!isNew && isLoadingProduct) return <div>Loading...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4 w-full">
        <form onSubmit={handleSubmit} className="flex gap-4 flex-col">
          <div className="flex gap-2 justify-start py-4">
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isNew ? "Створити" : "Зберегти"}
            </Button>
          </div>
          <div className="flex gap-6">
            <div className="flex flex-col gap-4 grow">
              <div className="flex gap-2">
                <TextField
                  label="Article"
                  value={formData.article || ""}
                  onChange={handleChange("article")}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="OEM"
                  value={formData.oem || ""}
                  onChange={handleChange("oem")}
                  fullWidth
                  size="small"
                />
              </div>
              <TextField
                label="Name"
                value={formData.name || ""}
                onChange={handleChange("name")}
                fullWidth
                required
              />
              <TextField
                label="Alternative Name"
                value={formData.nameAlt || ""}
                onChange={handleChange("nameAlt")}
                fullWidth
              />

              <TextField
                label="Brand"
                value={formData.brand || ""}
                onChange={handleChange("brand")}
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description || ""}
                onChange={handleChange("description")}
                fullWidth
                multiline
                rows={4}
              />
              <TextField
                label="Units"
                value={formData.units || ""}
                onChange={handleChange("units")}
                fullWidth
              />
              <TextField
                label="Places (JSON array)"
                value={formData.places || ""}
                onChange={handleChange("places")}
                fullWidth
                multiline
                rows={2}
              />
            </div>
            <div className="w-96">
              <TextField
                label="Photos (JSON array)"
                value={formData.photos || ""}
                onChange={handleChange("photos")}
                fullWidth
                multiline
                rows={2}
              />
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default ProductPage;
