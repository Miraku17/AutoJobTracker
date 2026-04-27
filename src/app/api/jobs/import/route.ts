import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, hashUrl } from "@/lib/utils";
import { scrapeJob, autoTags } from "@/lib/scraper";

const schema = z.object({
  url: z.string().url(),
  saveImmediately: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const url = parsed.data.url;
  const h = hashUrl(url);

  const dupe = await prisma.job.findFirst({
    where: { userId: user.id, urlHash: h },
  });
  if (dupe) {
    return jsonError("Duplicate job (already saved)", 409, { existingId: dupe.id });
  }

  const scraped = await scrapeJob(url);
  const tagsArr = autoTags(`${scraped.title ?? ""} ${scraped.description ?? ""}`);

  if (parsed.data.saveImmediately) {
    if (!scraped.title || !scraped.company) {
      return jsonError(
        "Could not auto-extract enough info; please fill in the form.",
        422,
        { scraped }
      );
    }
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        title: scraped.title,
        company: scraped.company,
        description: scraped.description,
        location: scraped.location,
        source: scraped.source,
        url,
        urlHash: h,
        status: "saved",
        tags: JSON.stringify(tagsArr),
      },
    });
    await prisma.event.create({
      data: { userId: user.id, jobId: job.id, type: "job_created" },
    });
    return jsonOk({ job: { ...job, tags: tagsArr }, scraped });
  }

  return jsonOk({ scraped: { ...scraped, suggestedTags: tagsArr, url } });
}
