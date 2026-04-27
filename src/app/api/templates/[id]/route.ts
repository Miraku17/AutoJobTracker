import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  subject: z.string().max(300).nullable().optional(),
  body: z.string().min(1).max(20000).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const t = await prisma.template.findFirst({ where: { id, userId: user.id } });
  if (!t) return jsonError("Not found", 404);
  return jsonOk({ template: t });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const t = await prisma.template.findFirst({ where: { id, userId: user.id } });
  if (!t) return jsonError("Not found", 404);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);
  if (parsed.data.isDefault) {
    await prisma.template.updateMany({
      where: { userId: user.id, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }
  const updated = await prisma.template.update({
    where: { id },
    data: parsed.data,
  });
  return jsonOk({ template: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const t = await prisma.template.findFirst({ where: { id, userId: user.id } });
  if (!t) return jsonError("Not found", 404);
  await prisma.template.delete({ where: { id } });
  return jsonOk({ ok: true });
}
