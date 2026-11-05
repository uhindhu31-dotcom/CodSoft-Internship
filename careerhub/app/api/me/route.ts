import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      candidateProfile: true,
      company: { select: { id: true, name: true, verified: true } },
    },
  });
  if (!user || user.status !== "active") {
    return Response.json({ error: "This account is unavailable." }, {
      status: 403,
    });
  }

  return Response.json({ user });
}
