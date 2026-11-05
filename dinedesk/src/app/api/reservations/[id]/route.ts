
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check the logged-in user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    // Allow only the configured admin email
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = session.user.email.trim().toLowerCase();

    if (!adminEmail || userEmail !== adminEmail) {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Read reservation ID and requested status
    const { id } = await context.params;
    const reservationId = Number(id);

    if (!Number.isInteger(reservationId) || reservationId < 1) {
      return NextResponse.json(
        { message: "Invalid reservation ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (
      typeof status !== "string" ||
      !["PENDING", "CONFIRMED", "CANCELLED"].includes(status)
    ) {
      return NextResponse.json(
        { message: "Invalid reservation status." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
    });

    return NextResponse.json({
      message: "Reservation status updated successfully.",
      reservation,
    });
  } catch (error) {
    console.error("Status update error:", error);

    return NextResponse.json(
      { message: "Unable to update reservation status." },
      { status: 500 }
    );
  }
}
