
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

async function getDepartmentId(context: RouteContext) {
  const { id } = await context.params;
  const departmentId = Number(id);

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    return null;
  }

  return departmentId;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const id = await getDepartmentId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid department ID." },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { message: "Department not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to fetch department:", error);

    return NextResponse.json(
      { message: "Failed to fetch department." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const id = await getDepartmentId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid department ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return NextResponse.json(
        { message: "A valid department name and code are required." },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim(),
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Department not found." },
        { status: 404 }
      );
    }

    if (code === "P2002") {
      return NextResponse.json(
        { message: "That department name or code already exists." },
        { status: 409 }
      );
    }

    console.error("Failed to update department:", error);

    return NextResponse.json(
      { message: "Failed to update department." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const id = await getDepartmentId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid department ID." },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Department deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Department not found." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        {
          message:
            "This department is linked to other records and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to delete department:", error);

    return NextResponse.json(
      { message: "Failed to delete department." },
      { status: 500 }
    );
  }
}
