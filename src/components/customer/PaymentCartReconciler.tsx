"use client";
import { useEffect } from "react";
import { cartItemKey, useCart } from "@/context/cart";

const KEY = "noghlijan_pending_checkout";

/**
 * Only the paid order's selected quantities are removed. New items added
 * during the external payment flow remain in the cart.
 */
export function PaymentCartReconciler({ orderId }: { orderId: string }) {
  const { items, updateQuantity } = useCart();
  useEffect(() => {
    const stored = sessionStorage.getItem(KEY);
    if (!stored) return;
    let parsed: unknown;
    try { parsed = JSON.parse(stored); }
    catch { sessionStorage.removeItem(KEY); return; }
    if (!parsed || typeof parsed !== "object") return;
    const marker = parsed as { orderId?: unknown; lines?: unknown };
    if (marker.orderId !== orderId || !Array.isArray(marker.lines)) return;
    sessionStorage.removeItem(KEY);
    for (const value of marker.lines) {
      if (!value || typeof value !== "object") continue;
      const line = value as { productId?: unknown; variantId?: unknown; quantity?: unknown };
      if (typeof line.productId !== "string" || !Number.isSafeInteger(line.quantity) ||
          typeof line.quantity !== "number" || line.quantity <= 0) continue;
      const variantId = typeof line.variantId === "string" ? line.variantId : undefined;
      const current = items.find(item =>
        cartItemKey(item) === cartItemKey({ productId: line.productId as string, variantId }));
      if (current) updateQuantity(current.productId, Math.max(0, current.quantity - line.quantity), variantId);
    }
  }, [items, orderId, updateQuantity]);
  return null;
}
