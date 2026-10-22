"use client";

import { useEffect } from "react";
import { useCart, type CartItem } from "@/context/cart";

export const PENDING_ADD_KEY = "noghlijan_pending_add_to_cart";

export type PendingAdd = { item: Omit<CartItem, "quantity">; quantity: number; createdAt: number };

export function PendingCartRestore() {
  const { addItem } = useCart();
  useEffect(() => {
    const restore = async () => {
      const raw = sessionStorage.getItem(PENDING_ADD_KEY);
      if (!raw) return;
      let pending: PendingAdd;
      try { pending = JSON.parse(raw) as PendingAdd; } catch {
        sessionStorage.removeItem(PENDING_ADD_KEY);
        return;
      }
      if (!pending?.item?.productId || !pending.item.slug ||
          !Number.isInteger(pending.quantity) || pending.quantity < 1 ||
          Date.now() - pending.createdAt > 30 * 60 * 1000) {
        sessionStorage.removeItem(PENDING_ADD_KEY);
        return;
      }
      const res = await fetch("/api/customer/me", { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      sessionStorage.removeItem(PENDING_ADD_KEY);
      addItem(pending.item, pending.quantity);
    };
    void restore();
    window.addEventListener("customer-session-changed", restore);
    return () => window.removeEventListener("customer-session-changed", restore);
  }, [addItem]);
  return null;
}
