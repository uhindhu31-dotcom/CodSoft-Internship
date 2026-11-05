
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getStudentId(context: RouteContext) {
  const { id } = await context.params;
  const studentId = Number(id);

  if (!Number.isInteger(studentId) || studentId < 1) {
    return null;
  }

  return studentId;
}

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

// GET: Fetch one student
export async function GET(
  request: Request,
  context: RouteContext
) {
  const id = await getStudentId(context);

  if (id === null) {
    return NextResponse.json(
      { message: "Invalid student ID." },
      { status: 400 }
    );
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Failed to fetch student:", error);

    return NextResponse.json(
      { message: "Failed to fetch student." },
      { status: 500 }
    );
  }
}

// PUT: Update a student
export async function PUT(
  request: Request,
  context: RouteContext
) {
  const id = await getStudentId(context);

  if (id === null) {
    return NextResponse.json(
      { message: "Invalid student ID." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

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

    const student = await prisma.student.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rollNo: rollNo.trim(),
        department: department.trim(),
        year,
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Student not found." },
        { status: 404 }
      );
    }

    if (code === "P2002") {
      return NextResponse.json(
        { message: "Student email or roll number already exists." },
        { status: 409 }
      );
    }

    console.error("Failed to update student:", error);

    return NextResponse.json(
      { message: "Failed to update student." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a student
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const id = await getStudentId(context);

  if (id === null) {
    return NextResponse.json(
      { message: "Invalid student ID." },
      { status: 400 }
    );
  }

  try {
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Student deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Student not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete student:", error);

    return NextResponse.json(
      { message: "Failed to delete student." },
      { status: 500 }
    );
  }
}
