import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_LENGTH = 30_000; // chars stored in DB

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      resume: true,
      resumeFilename: true,
      resumeUpdatedAt: true,
    },
  });

  return jsonOk({
    resume: u?.resume ?? null,
    filename: u?.resumeFilename ?? null,
    updatedAt: u?.resumeUpdatedAt ?? null,
  });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart/form-data", 400);

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("No file provided", 400);
  if (file.size === 0) return jsonError("File is empty", 400);
  if (file.size > MAX_BYTES) return jsonError("File too large (5 MB max)", 413);

  const filename = file.name || "resume";
  const lower = filename.toLowerCase();
  let text = "";

  try {
    if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(data);
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } else if (
      lower.endsWith(".txt") ||
      lower.endsWith(".md") ||
      file.type.startsWith("text/")
    ) {
      text = await file.text();
    } else {
      return jsonError(
        "Unsupported file type — upload a PDF, TXT, or MD file",
        415
      );
    }
  } catch (err) {
    console.error("Resume parse failed:", err);
    return jsonError("Could not parse the file", 422);
  }

  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return jsonError("No readable text in the file", 422);

  if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resume: text,
      resumeFilename: filename,
      resumeUpdatedAt: new Date(),
    },
  });

  return jsonOk({
    filename,
    length: text.length,
    preview: text.slice(0, 500),
  });
}

export async function DELETE() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { resume: null, resumeFilename: null, resumeUpdatedAt: null },
  });

  return jsonOk({ deleted: true });
}
