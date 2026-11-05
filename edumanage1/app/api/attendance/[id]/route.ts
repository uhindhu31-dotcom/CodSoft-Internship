
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

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
  const attendanceId = Number(id);

  return Number.isInteger(attendanceId) && attendanceId > 0
    ? attendanceId
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
        { message: "Invalid attendance ID." },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Attendance record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);

    return NextResponse.json(
      { message: "Failed to fetch attendance." },
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
        { message: "Invalid attendance ID." },
        { status: 400 }
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Attendance record deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Attendance record not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete attendance:", error);

    return NextResponse.json(
      { message: "Failed to delete attendance record." },
      { status: 500 }
    );
  }
}



export async function PUT(request: Request, context: RouteContext) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid attendance ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PRESENT", "ABSENT", "LATE"];

    if (typeof status !== "string" || !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Status must be PRESENT, ABSENT, or LATE." },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status: status as AttendanceStatus },
      include: { student: true },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Attendance record not found." },
        { status: 404 }
      );
    }

    console.error("Failed to update attendance:", error);

    return NextResponse.json(
      { message: "Failed to update attendance." },
      { status: 500 }
    );
  }
}
