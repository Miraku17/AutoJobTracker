import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, hashUrl, safeJsonArray } from "@/lib/utils";
import { scrapeOljSearch, autoTags, detectSource } from "@/lib/scraper";

const schema = z.object({
  url: z.string().url(),
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { url } = parsed.data;
  const limit = parsed.data.limit ?? 25;

  const items = (await scrapeOljSearch(url)).slice(0, limit);
  if (items.length === 0) {
    return jsonError(
      "No jobs found on that page (the search page may be empty or behind a login).",
      404
    );
  }

  const created: unknown[] = [];
  let skipped = 0;
  let duplicates = 0;

  for (const item of items) {
    if (!item.title || !item.url) {
      skipped++;
      continue;
    }
    const h = hashUrl(item.url);
    const dupe = await prisma.job.findFirst({
      where: { userId: user.id, urlHash: h },
    });
    if (dupe) {
      duplicates++;
      continue;
    }

    const tagsArr = autoTags(item.title);

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        title: item.title,
        company: item.company || "—",
        url: item.url,
        urlHash: h,
        location: item.location,
        source: detectSource(item.url),
        status: "saved",
        tags: JSON.stringify(tagsArr),
      },
    });
    await prisma.event.create({
      data: { userId: user.id, jobId: job.id, type: "job_created" },
    });
    created.push({ ...job, tags: tagsArr });
  }

  return jsonOk({
    found: items.length,
    saved: created.length,
    duplicates,
    skipped,
    jobs: created,
  });
}
