import * as cheerio from "cheerio";

export type ScrapedJob = {
  title: string | null;
  company: string | null;
  description: string | null;
  location: string | null;
  source: string | null;
};

const FETCH_TIMEOUT_MS = 8000;

export async function scrapeJob(url: string): Promise<ScrapedJob> {
  const empty: ScrapedJob = {
    title: null,
    company: null,
    description: null,
    location: null,
    source: detectSource(url),
  };

  let html: string;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return empty;
    html = await res.text();
  } catch {
    return empty;
  }

  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const twTitle = $('meta[name="twitter:title"]').attr("content")?.trim();
  const docTitle = $("title").first().text().trim();
  const h1 = $("h1").first().text().trim();
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  const ogDesc =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim();

  const isOlj = /onlinejobs\.ph/i.test(url);

  let title = ogTitle || twTitle || h1 || docTitle || null;
  let company: string | null = null;
  let location: string | null = null;
  let description = ogDesc || null;

  if (isOlj) {
    // OnlineJobs.ph patterns: title in h1; "Hours per Week", "Date Posted",
    // company is sometimes in a sidebar; we try heuristics.
    const tableRows: Record<string, string> = {};
    $("table tr").each((_, el) => {
      const cells = $(el).find("td,th");
      if (cells.length >= 2) {
        const k = $(cells[0]).text().replace(/[:\s]+$/, "").trim().toLowerCase();
        const v = $(cells[1]).text().trim();
        if (k && v) tableRows[k] = v;
      }
    });

    company =
      tableRows["company"] ||
      tableRows["employer"] ||
      $('[itemprop="hiringOrganization"]').first().text().trim() ||
      null;

    location =
      tableRows["location"] ||
      tableRows["work hours"] ||
      $('[itemprop="jobLocation"]').first().text().trim() ||
      null;

    if (h1) title = h1;

    // OLJ titles often have " | OnlineJobs.ph " suffix
    if (title) {
      title = title.replace(/\s*[|·-]\s*OnlineJobs\.ph.*$/i, "").trim();
    }
  }

  if (!company && ogSiteName && !/onlinejobs\.ph/i.test(ogSiteName)) {
    company = ogSiteName;
  }

  return {
    title: title || null,
    company,
    location,
    description: description ? description.slice(0, 2000) : null,
    source: detectSource(url),
  };
}

export type ScrapedListItem = {
  url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  description: string | null;
};

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACTOR: "Contract",
  TEMPORARY: "Temporary",
  INTERN: "Intern",
  VOLUNTEER: "Volunteer",
  PER_DIEM: "Per Diem",
  GIG: "Gig",
  FREELANCE: "Freelance",
  OTHER: "Other",
};

function normalizeEmploymentType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // JSON-LD often returns array or comma-separated
  const first = s.split(/[,;]/)[0].trim().toUpperCase().replace(/[^A-Z_]/g, "_");
  if (EMPLOYMENT_TYPE_MAP[first]) return EMPLOYMENT_TYPE_MAP[first];
  // Fallback: text-form like "Full Time", "Part-time", "Gig"
  const lc = s.toLowerCase();
  if (/full[-\s]?time/.test(lc)) return "Full-time";
  if (/part[-\s]?time/.test(lc)) return "Part-time";
  if (/freelance/.test(lc)) return "Freelance";
  if (/contract(or)?/.test(lc)) return "Contract";
  if (/intern(ship)?/.test(lc)) return "Intern";
  if (/temporary/.test(lc)) return "Temporary";
  if (/^gig$|gig\s+work/.test(lc)) return "Gig";
  return null;
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fromJsonLd($: cheerio.CheerioAPI): {
  title: string | null;
  description: string | null;
  employmentType: string | null;
} {
  let title: string | null = null;
  let description: string | null = null;
  let employmentType: string | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (title && description && employmentType) return;
    const raw = $(el).contents().text();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const candidates: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    if (
      typeof parsed === "object" &&
      parsed &&
      "@graph" in parsed &&
      Array.isArray((parsed as { "@graph": unknown[] })["@graph"])
    ) {
      candidates.push(...(parsed as { "@graph": unknown[] })["@graph"]);
    }
    for (const c of candidates) {
      if (!c || typeof c !== "object") continue;
      const obj = c as Record<string, unknown>;
      const type = obj["@type"];
      const types = Array.isArray(type) ? type : [type];
      if (!types.includes("JobPosting")) continue;
      if (!title && typeof obj.title === "string") title = obj.title;
      if (!description && typeof obj.description === "string")
        description = obj.description;
      if (!employmentType) {
        const et = obj.employmentType;
        if (typeof et === "string") {
          employmentType = normalizeEmploymentType(et);
        } else if (Array.isArray(et) && et.length > 0) {
          employmentType = normalizeEmploymentType(String(et[0]));
        }
      }
    }
  });

  return { title, description, employmentType };
}

async function fetchJobDetail(url: string): Promise<{
  title: string | null;
  description: string | null;
  employmentType: string | null;
}> {
  const empty = { title: null, description: null, employmentType: null };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return empty;
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Prefer structured data — JobPosting schema usually carries the full
    //    description in HTML form, much richer than the meta description.
    const ld = fromJsonLd($);

    const rawTitle =
      ld.title ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      $("title").first().text().trim() ||
      "";
    const title =
      rawTitle
        .replace(/\s+/g, " ")
        .replace(/\s*[|·-]\s*OnlineJobs\.ph.*$/i, "")
        .trim()
        .slice(0, 200) || null;

    // Description: JSON-LD first (usually HTML, strip), then known selectors,
    // then a heuristic — the longest <div>/<section>/<article> text block on
    // the page that's clearly content (>200 chars). Meta description is a
    // last resort because it's just a teaser.
    let rawDesc = ld.description ? stripHtml(ld.description) : "";

    if (!rawDesc) {
      const selectorMatches = [
        "#job_description",
        '[itemprop="description"]',
        ".job-description",
        ".jobdesc",
        ".job_description",
        ".jobpost-description",
        ".jobpost-desc",
        ".description",
        ".fulltext",
        ".entry-content",
        "article .content",
      ];
      for (const sel of selectorMatches) {
        const text = $(sel).first().text().replace(/\s+/g, " ").trim();
        if (text.length > rawDesc.length) rawDesc = text;
        if (rawDesc.length > 400) break;
      }
    }

    if (rawDesc.length < 400) {
      // Heuristic fallback: scan candidate blocks for the longest text body
      let best = "";
      $("div, section, article").each((_, el) => {
        const $el = $(el);
        if ($el.find("nav, header, footer, form, aside").length > 0) return;
        const text = $el.clone().children("script,style,nav,header,footer,form,aside")
          .remove().end().text().replace(/\s+/g, " ").trim();
        if (text.length > best.length && text.length < 20000) best = text;
      });
      if (best.length > rawDesc.length) rawDesc = best;
    }

    if (!rawDesc) {
      rawDesc =
        $('meta[property="og:description"]').attr("content")?.trim() ||
        $('meta[name="description"]').attr("content")?.trim() ||
        "";
    }

    const description = rawDesc.trim().slice(0, 20000) || null;

    let employmentType = ld.employmentType;
    if (!employmentType) {
      // Look for table rows or labelled spans on the OLJ detail page
      const $rows: string[] = [];
      $("table tr").each((_, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text) $rows.push(text);
      });
      const combined = $rows.join(" | ");
      employmentType = normalizeEmploymentType(combined);
    }

    return { title, description, employmentType };
  } catch {
    return empty;
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }).map(async () => {
      while (cursor < items.length) {
        const idx = cursor++;
        out[idx] = await fn(items[idx], idx);
      }
    })
  );
  return out;
}

export async function scrapeOljSearch(searchUrl: string): Promise<ScrapedListItem[]> {
  let html: string;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(searchUrl, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  const $ = cheerio.load(html);
  const byUrl = new Map<string, ScrapedListItem>();

  // Each OLJ search result has TWO links to the same job:
  //   /jobseekers/job/Some-Slug-1633114   (the title link)
  //   /jobseekers/job/1633114             (the "See more" link)
  // Dedupe by the trailing numeric ID so both anchors collapse to one entry.
  const jobIdFromUrl = (url: string): string => {
    const m = url.match(/\/jobseekers\/job\/(?:.*?-)?(\d+)\/?$/);
    return m ? m[1] : url;
  };

  const isJunkText = (t: string) =>
    !t ||
    t.length < 4 ||
    /^(see\s*more|view\s*(details|job)?|read\s*more|apply\s*(now)?|details|more|→|»|\.{2,})$/i.test(
      t.trim()
    );

  $('a[href*="/jobseekers/job/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let absUrl: string;
    try {
      absUrl = new URL(href, searchUrl).toString().split("?")[0].split("#")[0];
    } catch {
      return;
    }

    const linkText = $(el).text().replace(/\s+/g, " ").trim();

    // OLJ wraps each card with an empty <a> tag that sits OUTSIDE the
    // .jobpost-cat-box. Those wrapper links have no text and no children —
    // skip them so we only process the real anchors that live inside cards.
    if (!linkText && $(el).children().length === 0) return;

    // The OLJ card class is well-known — use it directly. Falls back to the
    // walk-up only if OLJ ever changes the class.
    let container = $(el).closest(".jobpost-cat-box, .latest-job-post");
    if (!container.length) {
      container = $(el);
      let i = 0;
      while (i < 10) {
        const parent = container.parent();
        if (!parent.length) break;
        const tag = (parent.prop("tagName") as string | undefined)?.toLowerCase();
        if (tag === "body" || tag === "html" || tag === "main") break;
        const ids = new Set<string>();
        parent.find('a[href*="/jobseekers/job/"]').each((_, a) => {
          const href = $(a).attr("href");
          if (href) ids.add(jobIdFromUrl(href));
        });
        if (ids.size > 1) break;
        container = parent;
        i++;
      }
    }

    // Prefer a heading inside the container; fall back to the link text.
    const headingText = container
      .find("h1, h2, h3, h4, h5, h6")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const candidateTitle =
      (!isJunkText(headingText) && headingText) ||
      (!isJunkText(linkText) && linkText) ||
      "";

    let company: string | null = null;
    let location: string | null = null;

    container.find("*").each((_, child) => {
      const t = $(child).text().replace(/\s+/g, " ").trim();
      if (!t || t.length > 200) return;
      const cls = ($(child).attr("class") || "").toLowerCase();
      if (!company && /employer|company/.test(cls)) {
        company = t.replace(/^by\s+/i, "").trim() || null;
      }
      // Location field: only capture short text labelled with location/work-hours
      // class, NOT random paragraphs that happen to mention "full time".
      if (
        !location &&
        t.length < 80 &&
        /(location|workhours|work[-\s]?hours)/.test(cls)
      ) {
        location = t;
      }
    });

    // Look for an employment-type badge on the search result card. We want
    // an element whose text is *only* an employment type (e.g. "Part Time"),
    // not a paragraph that happens to contain "full time" somewhere inside.
    let employmentType: string | null = null;
    container.find("*").each((_, child) => {
      if (employmentType) return;
      const t = $(child).text().replace(/\s+/g, " ").trim();
      if (!t || t.length > 30) return;
      const norm = normalizeEmploymentType(t);
      if (norm) employmentType = norm;
    });

    const dedupeKey = jobIdFromUrl(absUrl);

    const existing = byUrl.get(dedupeKey);
    if (existing) {
      // Upgrade title if we now have a better one
      if (
        candidateTitle &&
        (!existing.title ||
          isJunkText(existing.title) ||
          candidateTitle.length > existing.title.length)
      ) {
        existing.title = candidateTitle.length > 300
          ? candidateTitle.slice(0, 300)
          : candidateTitle;
      }
      if (!existing.company && company) existing.company = company;
      if (!existing.location && location) existing.location = location;
      if (!existing.employmentType && employmentType) {
        existing.employmentType = employmentType;
      }
      // Prefer the slug-style URL over the bare-ID URL when we have a choice
      if (
        existing.url.match(/\/jobseekers\/job\/\d+\/?$/) &&
        !absUrl.match(/\/jobseekers\/job\/\d+\/?$/)
      ) {
        existing.url = absUrl;
      }
      return;
    }

    byUrl.set(dedupeKey, {
      url: absUrl,
      title: candidateTitle
        ? candidateTitle.length > 300
          ? candidateTitle.slice(0, 300)
          : candidateTitle
        : null,
      company,
      location,
      employmentType,
      description: null,
    });
  });

  const filtered = Array.from(byUrl.values()).filter(
    (it) => it.title && !isJunkText(it.title)
  );

  // Hydrate title + description + employment type from each job's detail page
  // (limited concurrency). The detail page gives a clean h1/og:title.
  // For employment type, the search-page badge is more reliable than OLJ's
  // JSON-LD (which often hard-codes FULL_TIME regardless of the real listing),
  // so we only use the detail-page value as a fallback.
  await mapLimit(filtered, 6, async (item) => {
    const detail = await fetchJobDetail(item.url);
    if (detail.title) item.title = detail.title;
    item.description = detail.description;
    if (!item.employmentType && detail.employmentType) {
      item.employmentType = detail.employmentType;
    }
  });

  return filtered;
}

export function detectSource(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (/onlinejobs\.ph/i.test(host)) return "OnlineJobs.ph";
    return host;
  } catch {
    return "Unknown";
  }
}

const TAG_KEYWORDS: Record<string, string[]> = {
  VA: ["virtual assistant", "general va", "executive assistant", "admin assistant"],
  Dev: ["developer", "engineer", "programmer", "react", "node", "python", "full stack", "frontend", "backend"],
  Marketing: ["marketing", "seo", "social media", "content", "ads", "ppc"],
  Design: ["designer", "graphic design", "ui/ux", "figma", "photoshop"],
  Sales: ["sales", "appointment setter", "outbound", "cold call"],
  Support: ["customer support", "customer service", "help desk", "live chat"],
  Writing: ["writer", "copywriter", "blogger", "content writer"],
  Video: ["video editor", "premiere", "after effects", "davinci"],
  Bookkeeping: ["bookkeeper", "accounting", "quickbooks", "xero"],
};

export function autoTags(text: string | null | undefined): string[] {
  if (!text) return [];
  const t = text.toLowerCase();
  const tags = new Set<string>();
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((k) => t.includes(k))) tags.add(tag);
  }
  return Array.from(tags);
}
