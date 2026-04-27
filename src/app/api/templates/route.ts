import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120),
  subject: z.string().max(300).optional().nullable(),
  body: z.string().min(1).max(20000),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return jsonOk({ templates });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  if (parsed.data.isDefault) {
    await prisma.template.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const t = await prisma.template.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
      isDefault: parsed.data.isDefault ?? false,
    },
  });
  return jsonOk({ template: t });
}
