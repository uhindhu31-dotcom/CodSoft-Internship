
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FeeStatus } from "@prisma/client";

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
  const feeId = Number(id);

  return Number.isInteger(feeId) && feeId > 0 ? feeId : null;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid fee ID." },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!fee) {
      return NextResponse.json(
        { message: "Fee record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(fee);
  } catch (error) {
    console.error("Failed to fetch fee:", error);

    return NextResponse.json(
      { message: "Failed to fetch fee." },
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
        { message: "Invalid fee ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      description,
      totalAmount,
      paidAmount,
      dueDate,
    } = body;

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
          paidAmount > totalAmount)) ||
      (dueDate !== undefined &&
        dueDate !== null &&
        (typeof dueDate !== "string" ||
          Number.isNaN(Date.parse(dueDate))))
    ) {
      return NextResponse.json(
        { message: "Please provide valid fee details." },
        { status: 400 }
      );
    }

    const existingFee = await prisma.fee.findUnique({
      where: { id },
      select: { paidAmount: true },
    });

    if (!existingFee) {
      return NextResponse.json(
        { message: "Fee record not found." },
        { status: 404 }
      );
    }

    const finalPaidAmount = paidAmount ?? existingFee.paidAmount;

    if (finalPaidAmount > totalAmount) {
      return NextResponse.json(
        { message: "Paid amount cannot exceed total amount." },
        { status: 400 }
      );
    }

    const status =
      finalPaidAmount === 0
        ? FeeStatus.PENDING
        : finalPaidAmount >= totalAmount
          ? FeeStatus.PAID
          : FeeStatus.PARTIAL;

    const fee = await prisma.fee.update({
      where: { id },
      data: {
        studentId,
        description: description.trim(),
        totalAmount,
        paidAmount: finalPaidAmount,
        status,
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
      },
    });

    return NextResponse.json(fee);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Fee record or student not found." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected student does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update fee:", error);

    return NextResponse.json(
      { message: "Failed to update fee." },
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
        { message: "Invalid fee ID." },
        { status: 400 }
      );
    }

    await prisma.fee.delete({ where: { id } });

    return NextResponse.json({
      message: "Fee record deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Fee record not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete fee:", error);

    return NextResponse.json(
      { message: "Failed to delete fee record." },
      { status: 500 }
    );
  }
}
