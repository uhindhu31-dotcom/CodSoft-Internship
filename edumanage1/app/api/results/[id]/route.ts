
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
  const resultId = Number(id);

  return Number.isInteger(resultId) && resultId > 0
    ? resultId
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
        { message: "Invalid result ID." },
        { status: 400 }
      );
    }

    const result = await prisma.mark.findUnique({
      where: { id },
      include: {
        student: true,
        exam: { include: { subject: true } },
      },
    });

    if (!result) {
      return NextResponse.json(
        { message: "Result not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch result:", error);

    return NextResponse.json(
      { message: "Failed to fetch result." },
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
        { message: "Invalid result ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { studentId, examId, marksObtained, grade } = body;

    if (
      !Number.isInteger(studentId) ||
      studentId < 1 ||
      !Number.isInteger(examId) ||
      examId < 1 ||
      typeof marksObtained !== "number" ||
      !Number.isFinite(marksObtained) ||
      marksObtained < 0 ||
      (grade !== undefined &&
        grade !== null &&
        typeof grade !== "string")
    ) {
      return NextResponse.json(
        { message: "Please provide valid result details." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { maxMarks: true },
    });

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found." },
        { status: 404 }
      );
    }

    if (marksObtained > exam.maxMarks) {
      return NextResponse.json(
        { message: "Marks cannot exceed the exam's maximum marks." },
        { status: 400 }
      );
    }

    const result = await prisma.mark.update({
      where: { id },
      data: {
        studentId,
        examId,
        marksObtained,
        grade: grade?.trim() || null,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Result, student, or exam not found." },
        { status: 404 }
      );
    }

    if (code === "P2002") {
      return NextResponse.json(
        { message: "A result already exists for this student and exam." },
        { status: 409 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected student or exam does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update result:", error);

    return NextResponse.json(
      { message: "Failed to update result." },
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
        { message: "Invalid result ID." },
        { status: 400 }
      );
    }

    await prisma.mark.delete({ where: { id } });

    return NextResponse.json({
      message: "Result deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Result not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete result:", error);

    return NextResponse.json(
      { message: "Failed to delete result." },
      { status: 500 }
    );
  }
}
