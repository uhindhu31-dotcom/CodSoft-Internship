
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const examIdParam = searchParams.get("examId");

    const where: {
      studentId?: number;
      examId?: number;
    } = {};

    if (studentIdParam !== null) {
      const studentId = Number(studentIdParam);

      if (!Number.isInteger(studentId) || studentId < 1) {
        return NextResponse.json(
          { message: "Invalid student ID." },
          { status: 400 }
        );
      }

      where.studentId = studentId;
    }

    if (examIdParam !== null) {
      const examId = Number(examIdParam);

      if (!Number.isInteger(examId) || examId < 1) {
        return NextResponse.json(
          { message: "Invalid exam ID." },
          { status: 400 }
        );
      }

      where.examId = examId;
    }

    const results = await prisma.mark.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            department: true,
            year: true,
          },
        },
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch results:", error);

    return NextResponse.json(
      { message: "Failed to fetch results." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
        (typeof grade !== "string" || grade.trim().length > 10))
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

    const result = await prisma.mark.create({
      data: {
        studentId,
        examId,
        marksObtained,
        ...(typeof grade === "string" && grade.trim()
          ? { grade: grade.trim().toUpperCase() }
          : {}),
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "A result already exists for this student and exam." },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Student or exam not found." },
          { status: 404 }
        );
      }
    }

    console.error("Failed to save result:", error);

    return NextResponse.json(
      { message: "Failed to save result." },
      { status: 500 }
    );
  }
}
