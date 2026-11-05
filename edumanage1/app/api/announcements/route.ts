
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Failed to fetch announcements:", error);

    return NextResponse.json(
      { message: "Failed to fetch announcements." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
        { message: "Please provide a valid title and message." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        ...(createdById != null ? { createdById } : {}),
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { message: "The selected creator does not exist." },
        { status: 400 }
      );
    }

    console.error("Failed to create announcement:", error);

    return NextResponse.json(
      { message: "Failed to create announcement." },
      { status: 500 }
    );
  }
}
