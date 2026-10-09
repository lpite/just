import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as productService from "../api/services/productService";
import * as partnerService from "../api/services/partnerService";

interface EntitySelectProps {
  collection: "products" | "partners";
  value?: number;
  onChange: (id: number, name: string) => void;
  disabled?: boolean;
}

export default function EntitySelect({
  collection,
  value,
  onChange,
  disabled,
}: EntitySelectProps) {
  const [currentName, setCurrentName] = useState<string>("");

  useEffect(() => {
    const loadEntity = async () => {
      if (value) {
        try {
          let name = "";
          if (collection === "products") {
            const product = await productService.getProduct(value);
            name = product.name;
          } else {
            const partner = await partnerService.getPartner(value);
            name = partner.name;
          }
          setCurrentName(name);
        } catch (error) {
          console.error("Error loading entity:", error);
        }
      }
    };
    loadEntity();
  }, [value, collection]);

  return (
    <div className="min-w-36 flex justify-between min-h-6">
      <span className="pr-0.5 w-full">
        {currentName || (value ? "loading" : "")}
        {!value ? (
          <span className="border-dotted border-t-transparent border-x-transparent border-2 w-full h-full block"></span>
        ) : (
          "no id"
        )}
      </span>
      {!disabled && (
        <EntityDialog collection={collection} onChange={onChange} />
      )}
    </div>
  );
}

function EntityDialog({
  collection,
  onChange,
}: {
  collection: "products" | "partners";
  onChange: (id: number, name: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [entities, setEntities] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadEntities = async () => {
        setIsLoading(true);
        try {
          if (collection === "products") {
            const products = await productService.listProducts();
            setEntities(products);
          } else {
            const partners = await partnerService.listPartners();
            setEntities(partners);
          }
        } catch (error) {
          console.error("Error loading entities:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadEntities();
    }
  }, [isOpen, collection]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger
        onClick={(e) => e.stopPropagation()}
        className="border rounded-sm px-1 hover:bg-gray-200 cursor-pointer"
      >
        ...
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/25 backdrop-opacity-50 fixed inset-0 z-10" />
        <Dialog.Content className="fixed z-10 bg-white top-1/2 left-1/2 -translate-1/2 w-96 h-96 rounded-2xl p-3">
          <Dialog.Title>{collection}</Dialog.Title>
          <div className="overflow-y-auto h-full">
            {entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => {
                  onChange(entity.id, entity.name);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100"
              >
                {entity.name}
              </button>
            ))}
            {isLoading && <div>loading...</div>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
