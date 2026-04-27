import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400, { issues: parsed.error.flatten() });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError("Email already registered", 409);

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: parsed.data.name?.trim() || null },
  });

  // Seed a default template for new user
  await prisma.template.create({
    data: {
      userId: user.id,
      name: "Default Cover Letter",
      isDefault: true,
      subject: "Application for {{job_title}} at {{company}}",
      body: `Hi {{company}} team,

I'm excited to apply for the {{job_title}} role. With experience in {{skills}}, I can hit the ground running.

I'd love to chat about how I can help. Available for an interview at your convenience.

Best,
{{name}}`,
    },
  });

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return jsonOk({ user: { id: user.id, email: user.email, name: user.name } });
}
