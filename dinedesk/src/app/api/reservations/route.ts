
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MAX_GUESTS_PER_SLOT = 50;

// Check whether the logged-in user is the admin
async function isAdmin(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) return false;

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = session.user.email.trim().toLowerCase();

    return Boolean(adminEmail && userEmail === adminEmail);
  } catch (error) {
    console.error("Admin authentication error:", error);
    return false;
  }
}

// GET: Fetch all reservations for the admin dashboard
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json(
      { message: "Unauthorized. Admin login required." },
      { status: 401 }
    );
  }

  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Fetch reservations error:", error);

    return NextResponse.json(
      { message: "Unable to load reservations." },
      { status: 500 }
    );
  }
}

// POST: Save a reservation if capacity is available
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { restaurant, date, time, guests, customerName, email } = body;

    if (
      typeof restaurant !== "string" ||
      !restaurant.trim() ||
      typeof date !== "string" ||
      !date.trim() ||
      typeof time !== "string" ||
      !time.trim() ||
      guests === undefined ||
      guests === null ||
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1 ||
      Number(guests) > MAX_GUESTS_PER_SLOT ||
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return NextResponse.json(
        { message: "Please enter valid reservation details." },
        { status: 400 }
      );
    }

    const restaurantName = restaurant.trim();
    const bookingDate = date.trim();
    const bookingTime = time.trim();
    const guestCount = Number(guests);

    // Count guests already booked for this restaurant, date and time.
    // Cancelled reservations do not consume capacity.
    const existing = await prisma.reservation.aggregate({
      where: {
        restaurant: restaurantName,
        date: bookingDate,
        time: bookingTime,
        status: { not: "CANCELLED" },
      },
      _sum: { guests: true },
    });

    const bookedGuests = existing._sum.guests ?? 0;
    const remainingGuests = MAX_GUESTS_PER_SLOT - bookedGuests;

    if (guestCount > remainingGuests) {
      return NextResponse.json(
        {
          message: `Only ${remainingGuests} guest(s) remaining for this restaurant and time slot. Capacity is ${MAX_GUESTS_PER_SLOT}.`,
        },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        restaurant: restaurantName,
        date: bookingDate,
        time: bookingTime,
        guests: guestCount,
        customerName: customerName.trim(),
        email: email.trim(),
      },
    });

    return NextResponse.json(
      {
        message: "Reservation saved successfully!",
        reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reservation error:", error);

    return NextResponse.json(
      { message: "Unable to save reservation." },
      { status: 500 }
    );
  }
}
