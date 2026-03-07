import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique id for cart item
  itemId: string;
  name: string;
  priceCents: number;
  type: 'base' | 'addon';
  quantity: number;
  maxPages?: number;
  maxSlides?: number;
  includedRevisions: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotalCents: () => number;
  addonsTotalCents: () => number;
  totalCents: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        // Check if item already exists
        const existingItemIndex = state.items.findIndex(i => i.itemId === item.itemId);
        if (existingItemIndex > -1) {
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity += item.quantity;
          return { items: newItems };
        }
        
        return {
          items: [...state.items, { ...item, id: Math.random().toString(36).substring(7) }]
        };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(item => item.id === id ? { ...item, quantity } : item)
      })),
      clearCart: () => set({ items: [] }),
      subtotalCents: () => {
        const { items } = get();
        return items.filter(i => i.type === 'base').reduce((total, item) => total + (item.priceCents * item.quantity), 0);
      },
      addonsTotalCents: () => {
        const { items } = get();
        return items.filter(i => i.type === 'addon').reduce((total, item) => total + (item.priceCents * item.quantity), 0);
      },
      totalCents: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
      }
    }),
    {
      name: 'studyworks-cart',
    }
  )
);
