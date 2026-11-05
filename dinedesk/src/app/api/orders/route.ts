
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Official menu prices stored on the server
const menuPrices: Record<string, number> = {
  "Classic Burger": 199,
  "Cheese Pizza": 299,
  "Creamy Pasta": 249,
  "French Fries": 99,
  "Veg Sandwich": 149,
  "Chocolate Cake": 129,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, email, items } = body;

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      customerName.trim().length > 100 ||
      typeof email !== "string" ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > Object.keys(menuPrices).length
    ) {
      return NextResponse.json(
        { message: "Please provide valid customer and order details." },
        { status: 400 }
      );
    }

    const validItems = items.every(
      (item: { foodName?: unknown; quantity?: unknown }) =>
        typeof item.foodName === "string" &&
        Object.prototype.hasOwnProperty.call(menuPrices, item.foodName) &&
        Number.isInteger(item.quantity) &&
        Number(item.quantity) > 0 &&
        Number(item.quantity) <= 50
    );

    if (!validItems) {
      return NextResponse.json(
        { message: "Invalid food items or quantities." },
        { status: 400 }
      );
    }

    // Reject duplicate entries for the same food item
    const names = items.map(
      (item: { foodName: string }) => item.foodName
    );

    if (new Set(names).size !== names.length) {
      return NextResponse.json(
        { message: "Duplicate food items are not allowed." },
        { status: 400 }
      );
    }

    // Always use trusted prices from the server
    const orderItems = items.map(
      (item: { foodName: string; quantity: number }) => ({
        foodName: item.foodName,
        price: menuPrices[item.foodName],
        quantity: item.quantity,
      })
    );

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      { message: "Order placed successfully!", order },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { message: "Unable to place order." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (
      !adminEmail ||
      session.user.email.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);

    return NextResponse.json(
      { message: "Unable to fetch orders." },
      { status: 500 }
    );
  }
}
