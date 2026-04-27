import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120),
  query: z.object({
    q: z.string().optional(),
    status: z.string().optional(),
    tag: z.string().optional(),
  }),
});

export async function GET() {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const filters = await prisma.searchFilter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({
    filters: filters.map((f) => ({ ...f, query: JSON.parse(f.query) })),
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);
  const f = await prisma.searchFilter.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      query: JSON.stringify(parsed.data.query),
    },
  });
  return jsonOk({ filter: { ...f, query: parsed.data.query } });
}
