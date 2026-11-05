
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

const validStatuses = ["PRESENT", "ABSENT", "LATE"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const dateParam = searchParams.get("date");

    const where: {
      studentId?: number;
      date?: { gte: Date; lt: Date };
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

    if (dateParam !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json(
          { message: "Date must use YYYY-MM-DD format." },
          { status: 400 }
        );
      }

      const start = new Date(`${dateParam}T00:00:00.000Z`);

      if (
        Number.isNaN(start.getTime()) ||
        start.toISOString().slice(0, 10) !== dateParam
      ) {
        return NextResponse.json(
          { message: "Invalid date." },
          { status: 400 }
        );
      }

      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      where.date = { gte: start, lt: end };
    }

    const attendance = await prisma.attendance.findMany({
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);

    return NextResponse.json(
      { message: "Failed to fetch attendance." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, date, status } = body;

    if (
      !Number.isInteger(studentId) ||
      studentId < 1 ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof status !== "string" ||
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        { message: "Provide a valid student ID, date, and attendance status." },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(attendanceDate.getTime()) ||
      attendanceDate.toISOString().slice(0, 10) !== date
    ) {
      return NextResponse.json(
        { message: "Invalid date." },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        date: attendanceDate,
        status: status as AttendanceStatus,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Attendance is already recorded for this student on this date." },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Student not found." },
          { status: 404 }
        );
      }
    }

    console.error("Failed to record attendance:", error);

    return NextResponse.json(
      { message: "Failed to record attendance." },
      { status: 500 }
    );
  }
}
