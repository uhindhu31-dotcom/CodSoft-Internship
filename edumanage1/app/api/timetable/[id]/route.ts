
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

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function validTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

async function readId(context: RouteContext) {
  const { id } = await context.params;
  const timetableId = Number(id);

  return Number.isInteger(timetableId) && timetableId > 0
    ? timetableId
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
        { message: "Invalid timetable ID." },
        { status: 400 }
      );
    }

    const entry = await prisma.timetable.findUnique({
      where: { id },
      include: {
        department: true,
        subject: true,
        teacher: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { message: "Timetable entry not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to fetch timetable entry:", error);

    return NextResponse.json(
      { message: "Failed to fetch timetable entry." },
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
        { message: "Invalid timetable ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      departmentId,
      subjectId,
      teacherId,
      year,
      dayOfWeek,
      startTime,
      endTime,
    } = body;

    const matchingDay =
      typeof dayOfWeek === "string"
        ? validDays.find(
            (day) => day.toLowerCase() === dayOfWeek.toLowerCase()
          )
        : undefined;

    if (
      !Number.isInteger(departmentId) ||
      departmentId < 1 ||
      !Number.isInteger(subjectId) ||
      subjectId < 1 ||
      (teacherId !== undefined &&
        teacherId !== null &&
        (!Number.isInteger(teacherId) || teacherId < 1)) ||
      !Number.isInteger(year) ||
      year < 1 ||
      year > 6 ||
      !matchingDay ||
      !validTime(startTime) ||
      !validTime(endTime) ||
      startTime >= endTime
    ) {
      return NextResponse.json(
        { message: "Please provide valid timetable details and times." },
        { status: 400 }
      );
    }

    const entry = await prisma.timetable.update({
      where: { id },
      data: {
        departmentId,
        subjectId,
        teacherId: teacherId ?? null,
        year,
        dayOfWeek: matchingDay,
        startTime,
        endTime,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Timetable entry, department, subject, or teacher not found." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected department, subject, or teacher does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update timetable entry:", error);

    return NextResponse.json(
      { message: "Failed to update timetable entry." },
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
        { message: "Invalid timetable ID." },
        { status: 400 }
      );
    }

    await prisma.timetable.delete({ where: { id } });

    return NextResponse.json({
      message: "Timetable entry deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Timetable entry not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete timetable entry:", error);

    return NextResponse.json(
      { message: "Failed to delete timetable entry." },
      { status: 500 }
    );
  }
}
