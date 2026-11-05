
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        subject: {
          include: {
            department: true,
          },
        },
        _count: {
          select: {
            marks: true,
          },
        },
      },
      orderBy: {
        examDate: "asc",
      },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Failed to fetch exams:", error);

    return NextResponse.json(
      { message: "Failed to fetch exams." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, subjectId, examDate, maxMarks } = body;

    const validTypes = ["INTERNAL", "MIDTERM", "FINAL"];

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !validTypes.includes(type) ||
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

    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        type,
        subjectId,
        examDate: new Date(examDate),
        maxMarks,
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { message: "The selected subject does not exist." },
        { status: 404 }
      );
    }

    console.error("Failed to create exam:", error);

    return NextResponse.json(
      { message: "Failed to create exam." },
      { status: 500 }
    );
  }
}
