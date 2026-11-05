
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

async function readId(context: RouteContext) {
  const { id } = await context.params;
  const announcementId = Number(id);

  return Number.isInteger(announcementId) && announcementId > 0
    ? announcementId
    : null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid announcement ID." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { message: "Announcement not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Failed to fetch announcement:", error);
    return NextResponse.json(
      { message: "Failed to fetch announcement." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid announcement ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, message, createdById } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof message !== "string" ||
      !message.trim() ||
      (createdById !== undefined &&
        createdById !== null &&
        (!Number.isInteger(createdById) || createdById < 1))
    ) {
      return NextResponse.json(
        { message: "Please provide a valid title, message, and creator ID." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: title.trim(),
        message: message.trim(),
        ...(createdById !== undefined
          ? { createdById: createdById ?? null }
          : {}),
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Announcement or creator not found." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "The selected creator does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to update announcement:", error);
    return NextResponse.json(
      { message: "Failed to update announcement." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = await readId(context);

    if (id === null) {
      return NextResponse.json(
        { message: "Invalid announcement ID." },
        { status: 400 }
      );
    }

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Announcement not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete announcement:", error);
    return NextResponse.json(
      { message: "Failed to delete announcement." },
      { status: 500 }
    );
  }
}
