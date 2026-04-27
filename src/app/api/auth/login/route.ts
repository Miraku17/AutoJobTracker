import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return jsonError("Invalid email or password", 401);

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return jsonError("Invalid email or password", 401);

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);
  return jsonOk({ user: { id: user.id, email: user.email, name: user.name } });
}
