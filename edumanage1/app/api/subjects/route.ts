
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        department: true,
        teacher: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Failed to fetch subjects:", error);

    return NextResponse.json(
      { message: "Failed to fetch subjects." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, departmentId, teacherId } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof code !== "string" ||
      !code.trim() ||
      !Number.isInteger(departmentId) ||
      departmentId < 1 ||
      (teacherId !== undefined &&
        teacherId !== null &&
        (!Number.isInteger(teacherId) || teacherId < 1))
    ) {
      return NextResponse.json(
        { message: "Please provide valid subject details." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        departmentId,
        ...(teacherId != null ? { teacherId } : {}),
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Subject code already exists." },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "The selected department or teacher does not exist." },
          { status: 400 }
        );
      }
    }

    console.error("Failed to create subject:", error);

    return NextResponse.json(
      { message: "Failed to create subject." },
      { status: 500 }
    );
  }
}
