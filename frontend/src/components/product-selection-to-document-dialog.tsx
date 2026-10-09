import {
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  useRef,
  useState,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { createColumnHelper } from "@tanstack/react-table";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { SearchResult } from "../api/types";
import { useProductSearch } from "../api/hooks/useProducts";
import { MyTable } from "./table";
import { CartItem, useCart } from "../hooks/useCart";

const columnHelper = createColumnHelper<SearchResult>();
const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (r) => r.getValue(),
  }),
  columnHelper.accessor("article", {
    header: "Article",
    cell: (r) => r.getValue(),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (r) => r.getValue(),
  }),
  columnHelper.accessor("brand", {
    header: "Brand",
    cell: (r) => r.getValue(),
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: (r) => r.getValue(),
  }),
  columnHelper.accessor("quantity", {
    header: "Stock",
    cell: (r) => r.getValue(),
  }),
];

interface ProductSelectionDialogProps {
  addNewItem: (item: CartItem) => void;
  disabled: boolean;
  type: "income" | "sales" | "price-setting";
}

export function ProductSelectionToDocumentDialog({
  addNewItem,
  disabled,
}: ProductSelectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(
    null,
  );
  const {
    items: cartItems,
    addItem: addToCart,
    removeItem,
    clearCart,
  } = useCart();

  const { results, isLoading } = useProductSearch(query);

  function search(e: FormEvent) {
    e.preventDefault();
    // the dialog is rendered inside the page form, so keep the submit local
    e.stopPropagation();
    setQuery(searchInput.trim());
  }

  function saveCart() {
    cartItems.forEach((item) => {
      addNewItem(item);
    });
    clearCart();
    setIsOpen(false);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" disabled={disabled}>
          Додати товари
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 z-30" />
        <Dialog.Content className="fixed inset-0 z-30 bg-white px-3 pb-3 flex flex-col">
          <Dialog.Title className="text-xl pt-2 pb-3">
            Select Products
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Search for a product, then set its price and quantity to add it to
            the document.
          </Dialog.Description>
          <div className="flex flex-col gap-2">
            <Button
              variant="contained"
              onClick={saveCart}
              className="grow-0"
            >
              Add to Document
            </Button>
            <form onSubmit={search} className="flex gap-2 flex-1 min-w-64">
              <TextField
                label="Search products"
                placeholder="Search products..."
                size="small"
                name="searchValue"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                fullWidth
              />
              <Button type="submit" variant="outlined">
                Search
              </Button>
            </form>
          </div>
          <div className="flex-1 overflow-auto">
            <MyTable
              columns={columns}
              data={results}
              onRowDoubleClick={(row) => setSelectedProduct(row.original)}
            />
            {isLoading && <div className="text-center py-4">Loading...</div>}
            {!isLoading && query && results.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No products found
              </div>
            )}
          </div>
          <CartPanel
            cartItems={cartItems}
            total={cartItems.reduce((acc, c) => acc + c.price * c.quantity, 0)}
            removeItem={removeItem}
            onClose={() => setIsOpen(false)}
          />
          {selectedProduct && (
            <PriceAndQuantityDialog
              product={selectedProduct}
              addToCart={addToCart}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const CART_MIN_HEIGHT = 64;
const CART_DEFAULT_HEIGHT = 128;
const CART_RESIZE_STEP = 24;

type CartPanelProps = {
  cartItems: CartItem[];
  total: number;
  removeItem: (id: string) => void;
  onClose: () => void;
};

function CartPanel({ cartItems, total, removeItem, onClose }: CartPanelProps) {
  const [height, setHeight] = useState(CART_DEFAULT_HEIGHT);
  const dragRef = useRef<{ pointerY: number; height: number } | null>(null);

  const maxHeight = Math.max(CART_MIN_HEIGHT, window.innerHeight * 0.6);

  function clampHeight(next: number) {
    return Math.min(Math.max(next, CART_MIN_HEIGHT), maxHeight);
  }

  function onResizeStart(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    dragRef.current = { pointerY: e.clientY, height };

    function onPointerMove(ev: globalThis.PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      // the handle sits above the list, so dragging up grows it
      setHeight(clampHeight(drag.height + (drag.pointerY - ev.clientY)));
    }

    function onPointerUp() {
      dragRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onResizeKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    // the handle sits above the list, so growing means growing upwards
    const delta = e.key === "ArrowUp" ? CART_RESIZE_STEP : -CART_RESIZE_STEP;
    setHeight((current) => clampHeight(current + delta));
  }

  return (
    <div className="shrink-0">
      <div
        onPointerDown={onResizeStart}
        onKeyDown={onResizeKeyDown}
        role="separator"
        aria-label="Resize cart"
        aria-orientation="horizontal"
        aria-valuenow={height}
        aria-valuemin={CART_MIN_HEIGHT}
        aria-valuemax={maxHeight}
        tabIndex={0}
        className="h-1.5 mt-2 cursor-ns-resize touch-none select-none rounded-full bg-gray-200 hover:bg-gray-300"
      />
      <div className="flex justify-between items-center pb-2">
        Кошик ({cartItems.length}): ₴{total.toFixed(2)}
      </div>
      <div
        className="overflow-auto border-t pt-2"
        style={{ height: `${height}px` }}
      >
        {cartItems.map((item) => (
          <ContextMenu.Root key={item.id}>
            <ContextMenu.Trigger asChild>
              <div className="text-sm py-1 flex justify-between cursor-context-menu">
                <span>{item.name}</span>
                <span>
                  {item.quantity}x₴{item.price.toFixed(2)}
                </span>
              </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className="z-50 min-w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <ContextMenu.Item
                  onSelect={() => removeItem(item.id)}
                  className="px-3 py-1.5 text-sm cursor-pointer outline-none data-[highlighted]:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  Remove from cart
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ))}
      </div>
    </div>
  );
}

type PriceAndQuantityDialogProps = {
  product: SearchResult;
  addToCart: (cartItem: CartItem) => void;
  onClose: () => void;
};

function focusOnEnter(
  e: KeyboardEvent<HTMLElement>,
  target: React.RefObject<HTMLElement | null>,
) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  // the dialog sits inside the page form, don't let Enter reach it
  e.stopPropagation();
  target.current?.focus();
}

function PriceAndQuantityDialog({
  product,
  addToCart,
  onClose,
}: PriceAndQuantityDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(product.price);
  const priceRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  function addToCartAndClose() {
    addToCart({
      id: product.id,
      name: product.name,
      quantity,
      price,
    });
    onClose();
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 start-1/2 -translate-1/2 z-40 bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-4">
            {product.name}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Set the quantity and price for {product.name}
          </Dialog.Description>
          <div className="space-y-4">
            <TextField
              label="Quantity"
              type="number"
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              onKeyDown={(e) => focusOnEnter(e, priceRef)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              fullWidth
            />
            <TextField
              label="Price"
              type="number"
              inputRef={priceRef}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              onKeyDown={(e) => focusOnEnter(e, addButtonRef)}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              fullWidth
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              ref={addButtonRef}
              onClick={addToCartAndClose}
              variant="contained"
            >
              Add
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
