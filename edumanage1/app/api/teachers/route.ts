
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        department: true,
        subjects: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Failed to fetch teachers:", error);

    return NextResponse.json(
      { message: "Failed to fetch teachers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, employeeId, departmentId } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof employeeId !== "string" ||
      !employeeId.trim() ||
      (departmentId !== undefined &&
        departmentId !== null &&
        (!Number.isInteger(departmentId) || departmentId < 1))
    ) {
      return NextResponse.json(
        { message: "Please provide valid teacher details." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        employeeId: employeeId.trim(),
        ...(departmentId != null ? { departmentId } : {}),
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "P2002" || error.code === "P2003")
    ) {
      return NextResponse.json(
        {
          message:
            error.code === "P2002"
              ? "Teacher email or employee ID already exists."
              : "The selected department does not exist.",
        },
        { status: error.code === "P2002" ? 409 : 400 }
      );
    }

    console.error("Failed to create teacher:", error);

    return NextResponse.json(
      { message: "Failed to create teacher." },
      { status: 500 }
    );
  }
}
