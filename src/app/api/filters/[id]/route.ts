import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const f = await prisma.searchFilter.findFirst({ where: { id, userId: user.id } });
  if (!f) return jsonError("Not found", 404);
  await prisma.searchFilter.delete({ where: { id } });
  return jsonOk({ ok: true });
}
