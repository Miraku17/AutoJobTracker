import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";
import { renderTemplate, generateAICoverLetter } from "@/lib/cover-letter";

const schema = z.object({
  templateId: z.string().optional(),
  jobId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  useAI: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { templateId, jobId, useAI } = parsed.data;
  const variables = parsed.data.variables ?? {};

  let template = templateId
    ? await prisma.template.findFirst({ where: { id: templateId, userId: user.id } })
    : await prisma.template.findFirst({ where: { userId: user.id, isDefault: true } });
  if (!template) {
    template = await prisma.template.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!template && !useAI) {
    return jsonError("No template available — create one first", 404);
  }

  let job = null;
  if (jobId) {
    job = await prisma.job.findFirst({ where: { id: jobId, userId: user.id } });
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { resume: true, freelanceProjects: true },
  });

  const ctx = {
    job_title: variables.job_title || job?.title || "",
    company: variables.company || job?.company || "",
    skills: variables.skills || "",
    name: variables.name || user.name || user.email.split("@")[0],
    description: variables.description || job?.description || "",
    resume: fullUser?.resume || "",
    freelance_projects: fullUser?.freelanceProjects || "",
    ...variables,
  };

  let body_text = template ? renderTemplate(template.body, ctx) : "";
  const subject = template?.subject ? renderTemplate(template.subject, ctx) : null;

  if (useAI) {
    body_text = await generateAICoverLetter(ctx, body_text || undefined);
  }

  return jsonOk({
    subject,
    body: body_text,
    template: template ? { id: template.id, name: template.name } : null,
  });
}
