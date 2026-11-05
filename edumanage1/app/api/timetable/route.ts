
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentIdParam = searchParams.get("departmentId");
    const yearParam = searchParams.get("year");
    const day = searchParams.get("day");

    const where: {
      departmentId?: number;
      year?: number;
      dayOfWeek?: string;
    } = {};

    if (departmentIdParam !== null) {
      const departmentId = Number(departmentIdParam);

      if (!Number.isInteger(departmentId) || departmentId < 1) {
        return NextResponse.json(
          { message: "Invalid department ID." },
          { status: 400 }
        );
      }

      where.departmentId = departmentId;
    }

    if (yearParam !== null) {
      const year = Number(yearParam);

      if (!Number.isInteger(year) || year < 1 || year > 6) {
        return NextResponse.json(
          { message: "Invalid academic year." },
          { status: 400 }
        );
      }

      where.year = year;
    }

    if (day !== null) {
      const matchingDay = validDays.find(
        (validDay) => validDay.toLowerCase() === day.toLowerCase()
      );

      if (!matchingDay) {
        return NextResponse.json(
          { message: "Invalid day of the week." },
          { status: 400 }
        );
      }

      where.dayOfWeek = matchingDay;
    }

    const entries = await prisma.timetable.findMany({
      where,
      include: {
        department: true,
        subject: true,
        teacher: true,
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch timetable:", error);

    return NextResponse.json(
      { message: "Failed to fetch timetable." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const entry = await prisma.timetable.create({
      data: {
        departmentId,
        subjectId,
        ...(teacherId != null ? { teacherId } : {}),
        year,
        dayOfWeek: matchingDay,
        startTime,
        endTime,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { message: "The selected department, subject, or teacher does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to create timetable entry:", error);

    return NextResponse.json(
      { message: "Failed to create timetable entry." },
      { status: 500 }
    );
  }
}
