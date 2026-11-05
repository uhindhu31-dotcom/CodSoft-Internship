
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");

    const where: { studentId?: number } = {};

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

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Failed to fetch fees:", error);

    return NextResponse.json(
      { message: "Failed to fetch fees." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, description, totalAmount, paidAmount, dueDate } = body;

    if (
      !Number.isInteger(studentId) ||
      studentId < 1 ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof totalAmount !== "number" ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      (paidAmount !== undefined &&
        (typeof paidAmount !== "number" ||
          !Number.isFinite(paidAmount) ||
          paidAmount < 0 ||
          paidAmount > totalAmount))
    ) {
      return NextResponse.json(
        { message: "Please provide valid fee details." },
        { status: 400 }
      );
    }

    let parsedDueDate: Date | undefined;

    if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
      if (
        typeof dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
      ) {
        return NextResponse.json(
          { message: "Due date must use YYYY-MM-DD format." },
          { status: 400 }
        );
      }

      parsedDueDate = new Date(`${dueDate}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDueDate.getTime()) ||
        parsedDueDate.toISOString().slice(0, 10) !== dueDate
      ) {
        return NextResponse.json(
          { message: "Invalid due date." },
          { status: 400 }
        );
      }
    }

    const paid = paidAmount ?? 0;

    const fee = await prisma.fee.create({
      data: {
        studentId,
        description: description.trim(),
        totalAmount,
        paidAmount: paid,
        status:
          paid === 0
            ? "PENDING"
            : paid === totalAmount
              ? "PAID"
              : "PARTIAL",
        ...(parsedDueDate ? { dueDate: parsedDueDate } : {}),
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { message: "Student not found." },
        { status: 404 }
      );
    }

    console.error("Failed to create fee:", error);

    return NextResponse.json(
      { message: "Failed to create fee." },
      { status: 500 }
    );
  }
}
