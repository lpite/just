import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocation } from "wouter";
import { Product } from "../api/types";
import { useProducts } from "../api/hooks/useProducts";
import { useProductMutations } from "../api/hooks/useProductMutations";
import { MyTable } from "../components/table";
import Button from "@mui/material/Button";
import { NavBar } from "../components/nav-bar";

const columnHelper = createColumnHelper<Product>();

export function ProductListPage() {
  const [, setLocation] = useLocation();
  const { products, isLoading } = useProducts();
  const { delete: deleteProduct } = useProductMutations();

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => (
          <button
            onClick={() => setLocation(`/product/${info.getValue()}`)}
            className="text-blue-600 hover:underline"
          >
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Name",
      }),
      columnHelper.accessor("article", {
        header: "Article",
      }),
      columnHelper.accessor("oem", {
        header: "OEM",
      }),
      columnHelper.accessor("brand", {
        header: "Brand",
      }),
      columnHelper.accessor("description", {
        header: "Description",
      }),
    ],
    [setLocation],
  );

  if (isLoading) return <div>Loading products...</div>;

  return (
    <main>
      <NavBar />
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button
            variant="contained"
            onClick={() => setLocation("/product/new")}
          >
            New Product
          </Button>
        </div>

        <MyTable
          columns={columns}
          data={products.slice(0, 100)}
          onRowDoubleClick={(row) =>
            setLocation(`/product/${row.getAllCells()[0].getValue()}`)
          }
        />
      </div>
    </main>
  );
}

export default ProductListPage;
