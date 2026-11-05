
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function readId(context: RouteContext) {
  const { id } = await context.params;
  const teacherId = Number(id);

  return Number.isInteger(teacherId) && teacherId > 0
    ? teacherId
    : null;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid teacher ID." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        department: true,
        subjects: true,
        timetable: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: "Teacher not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("Failed to fetch teacher:", error);

    return NextResponse.json(
      { message: "Failed to fetch teacher." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid teacher ID." },
        { status: 400 }
      );
    }

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

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim(),
        employeeId: employeeId.trim(),
        ...(departmentId !== undefined
          ? { departmentId }
          : {}),
      },
    });

    return NextResponse.json(teacher);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Teacher not found." },
        { status: 404 }
      );
    }

    if (code === "P2002") {
      return NextResponse.json(
        { message: "Email or employee ID already exists." },
        { status: 409 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected department does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update teacher:", error);

    return NextResponse.json(
      { message: "Failed to update teacher." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid teacher ID." },
        { status: 400 }
      );
    }

    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Teacher deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Teacher not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete teacher:", error);

    return NextResponse.json(
      { message: "Failed to delete teacher." },
      { status: 500 }
    );
  }
}
