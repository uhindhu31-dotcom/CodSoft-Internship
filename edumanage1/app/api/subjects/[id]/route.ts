
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
  const subjectId = Number(id);

  return Number.isInteger(subjectId) && subjectId > 0
    ? subjectId
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
        { message: "Invalid subject ID." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: true,
        teacher: true,
        exams: true,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Failed to fetch subject:", error);

    return NextResponse.json(
      { message: "Failed to fetch subject." },
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
        { message: "Invalid subject ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code, departmentId, teacherId } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof code !== "string" ||
      !code.trim() ||
      !Number.isInteger(departmentId) ||
      departmentId < 1 ||
      (teacherId !== undefined &&
        teacherId !== null &&
        (!Number.isInteger(teacherId) || teacherId < 1))
    ) {
      return NextResponse.json(
        { message: "Please provide valid subject details." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim(),
        departmentId,
        ...(teacherId !== undefined ? { teacherId } : {}),
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Subject not found." },
        { status: 404 }
      );
    }

    if (code === "P2002") {
      return NextResponse.json(
        { message: "That subject code already exists." },
        { status: 409 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected department or teacher does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update subject:", error);

    return NextResponse.json(
      { message: "Failed to update subject." },
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
        { message: "Invalid subject ID." },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Subject deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Subject not found." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "This subject is linked to other records and cannot be deleted." },
        { status: 409 }
      );
    }

    console.error("Failed to delete subject:", error);

    return NextResponse.json(
      { message: "Failed to delete subject." },
      { status: 500 }
    );
  }
}
