import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل مدیریت",
};

type SearchParams = Promise<{ tab?: string }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const authed = await isAdminAuthenticated();
  const params = await searchParams;
  const tab = params.tab === "orders" ? "orders" : "products";

  if (!authed) {
    return (
      <div className="admin-page mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <AdminLoginForm />
      </div>
    );
  }

  if (tab === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return (
      <div className="admin-page mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <AdminNav tab="orders" />
        <AdminOrders
          initial={orders.map((o) => ({
            ...o,
            createdAt: o.createdAt.toISOString(),
          }))}
        />
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      tags: { orderBy: { name: "asc" } },
      labels: { orderBy: { name: "asc" } },
    },
  });

  return (
    <div className="admin-page mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AdminNav tab="products" />
      <AdminProducts initial={products} />
    </div>
  );
}
