
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, email } = body;

    const id = Number(orderId);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof email !== "string" ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { message: "Please enter a valid Order ID and email." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        email: {
          equals: email.trim().toLowerCase(),
        },
      },
      select: {
        id: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            foodName: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "No order found with those details." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Track order error:", error);

    return NextResponse.json(
      { message: "Unable to track the order right now." },
      { status: 500 }
    );
  }
}
