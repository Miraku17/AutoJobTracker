import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/utils";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return jsonError("Unauthorized", 401);
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      freelanceProjects: true,
    },
  });
  if (!user) return jsonError("Unauthorized", 401);
  return jsonOk({ user });
}

export async function PATCH(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) return jsonError("Unauthorized", 401);
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    freelanceProjects?: string;
  };

  const data: Record<string, string | null> = {};
  if (body.name !== undefined) {
    data.name = body.name.trim() || null;
  }
  if (body.freelanceProjects !== undefined) {
    const trimmed = body.freelanceProjects.trim();
    data.freelanceProjects = trimmed.length > 0 ? trimmed.slice(0, 8000) : null;
  }

  const user = await prisma.user.update({
    where: { id: session.sub },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      freelanceProjects: true,
    },
  });
  return jsonOk({ user });
}
