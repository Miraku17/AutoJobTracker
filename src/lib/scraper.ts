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
};

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
    const container = $(el).closest(
      "article, .jobpost-cat-box, .latest-job-cat, .jobpost, li, .panel, .row, div"
    );

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
      if (
        !location &&
        /(full[-\s]?time|part[-\s]?time|gig|freelance|remote|hours\/week)/i.test(t) &&
        t.length < 80
      ) {
        location = t;
      }
    });

    const existing = byUrl.get(absUrl);
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
      return;
    }

    byUrl.set(absUrl, {
      url: absUrl,
      title: candidateTitle
        ? candidateTitle.length > 300
          ? candidateTitle.slice(0, 300)
          : candidateTitle
        : null,
      company,
      location,
    });
  });

  // Drop entries whose title is still junk
  return Array.from(byUrl.values()).filter(
    (it) => it.title && !isJunkText(it.title)
  );
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
