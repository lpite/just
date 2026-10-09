import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  changeItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()((set) => ({
  items: [],
  addItem: (newItem) =>
    set((state) => {
      const existingIndex = state.items.findIndex(
        (el) => el.id === newItem.id
      );
      
      if (existingIndex === -1) {
        return {
          items: [...state.items, newItem],
        };
      }
      
      return {
        items: state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        ),
      };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  changeItemQuantity: (id, newQuantity) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: newQuantity,
          };
        }
        return item;
      }),
    })),
  clearCart: () => set(() => ({ items: [] })),
}));
