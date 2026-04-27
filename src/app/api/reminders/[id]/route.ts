import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1).max(300).optional(),
  remindAt: z.string().datetime().optional(),
  done: z.boolean().optional(),
  notify: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const r = await prisma.reminder.findFirst({ where: { id, userId: user.id } });
  if (!r) return jsonError("Not found", 404);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);
  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.remindAt !== undefined) data.remindAt = new Date(parsed.data.remindAt);
  if (parsed.data.done !== undefined) data.done = parsed.data.done;
  if (parsed.data.notify !== undefined) data.notify = parsed.data.notify;
  const updated = await prisma.reminder.update({ where: { id }, data });
  return jsonOk({ reminder: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const r = await prisma.reminder.findFirst({ where: { id, userId: user.id } });
  if (!r) return jsonError("Not found", 404);
  await prisma.reminder.delete({ where: { id } });
  return jsonOk({ ok: true });
}
