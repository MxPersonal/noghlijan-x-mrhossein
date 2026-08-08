import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(orders);
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "داده ناقص" }, { status: 400 });
  }

  const allowed = ["PENDING", "PAID", "FAILED", "SHIPPED"] as const;
  if (!allowed.includes(body.status as (typeof allowed)[number])) {
    return NextResponse.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: body.id },
    data: { status: body.status as (typeof allowed)[number] },
  });

  return NextResponse.json(order);
}
