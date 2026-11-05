
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Failed to fetch students:", error);

    return NextResponse.json(
      { message: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, rollNo, department, year } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof rollNo !== "string" ||
      !rollNo.trim() ||
      typeof department !== "string" ||
      !department.trim() ||
      !Number.isInteger(year) ||
      year < 1 ||
      year > 6
    ) {
      return NextResponse.json(
        { message: "Please provide valid student details." },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rollNo: rollNo.trim(),
        department: department.trim(),
        year,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Student email or roll number already exists." },
        { status: 409 }
      );
    }

    console.error("Failed to create student:", error);

    return NextResponse.json(
      { message: "Failed to create student" },
      { status: 500 }
    );
  }
}
