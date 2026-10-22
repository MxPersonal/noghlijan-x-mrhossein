"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  bump: boolean;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
export function cartItemKey(item: { productId: string; variantId?: string }) {
  return item.productId + ":" + (item.variantId || "");
}
const STORAGE_KEY = "clothe-store-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const clearOnLogout = () => {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("noghlijan_pending_add_to_cart");
    };
    window.addEventListener("customer-signed-out", clearOnLogout);
    return () => window.removeEventListener("customer-signed-out", clearOnLogout);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const triggerBump = useCallback(() => {
    setBump(true);
    const t = setTimeout(() => setBump(false), 220);
    return () => clearTimeout(t);
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((p) => cartItemKey(p) === cartItemKey(item));
        if (existing) {
          return prev.map((p) =>
            cartItemKey(p) === cartItemKey(item)
              ? { ...p, quantity: p.quantity + qty }
              : p,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
      triggerBump();
    },
    [triggerBump],
  );

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => prev.filter((p) => cartItemKey(p) !== cartItemKey({ productId, variantId })));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    setItems((prev) =>
      prev
        .map((p) =>
          cartItemKey(p) === cartItemKey({ productId, variantId }) ? { ...p, quantity: Math.max(0, quantity) } : p,
        )
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      itemCount,
      total,
      bump,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [items, bump, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
