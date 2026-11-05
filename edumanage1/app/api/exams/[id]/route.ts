
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
  const examId = Number(id);

  return Number.isInteger(examId) && examId > 0 ? examId : null;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid exam ID." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: { include: { department: true } },
        marks: { include: { student: true } },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Failed to fetch exam:", error);

    return NextResponse.json(
      { message: "Failed to fetch exam." },
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
        { message: "Invalid exam ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, type, subjectId, examDate, maxMarks } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !["INTERNAL", "MIDTERM", "FINAL"].includes(type) ||
      !Number.isInteger(subjectId) ||
      subjectId < 1 ||
      typeof examDate !== "string" ||
      Number.isNaN(Date.parse(examDate)) ||
      typeof maxMarks !== "number" ||
      !Number.isFinite(maxMarks) ||
      maxMarks <= 0
    ) {
      return NextResponse.json(
        { message: "Please provide valid exam details." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title: title.trim(),
        type,
        subjectId,
        examDate: new Date(examDate),
        maxMarks,
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Exam not found." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected subject does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update exam:", error);

    return NextResponse.json(
      { message: "Failed to update exam." },
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
        { message: "Invalid exam ID." },
        { status: 400 }
      );
    }

    await prisma.exam.delete({ where: { id } });

    return NextResponse.json({
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Exam not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete exam:", error);

    return NextResponse.json(
      {
        message:
          "Failed to delete exam. Check whether related records prevent deletion.",
      },
      { status: 409 }
    );
  }
}
