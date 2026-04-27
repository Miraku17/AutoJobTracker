export type CoverLetterContext = {
  job_title?: string;
  company?: string;
  skills?: string;
  name?: string;
  description?: string;
  resume?: string;
  freelance_projects?: string;
  [key: string]: string | undefined;
};

export function renderTemplate(template: string, ctx: CoverLetterContext) {
  return template.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key: string) => {
    const v = ctx[key];
    return v == null || v === "" ? `{{${key}}}` : v;
  });
}

export function extractVariables(template: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\w_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) set.add(m[1]);
  return Array.from(set);
}

const SYSTEM_PROMPT = `You write cover-letter messages for OnlineJobs.ph applications — Filipino remote-work marketplace, employers from US / AU / UK / EU.

You write the way a competent senior would write a friendly, direct application — confident, specific, professional but warm. Not stiff. Not over-the-top.

Format:
- Start with "Hello!" on its own line, followed by a blank line, then the body.
- 150–200 words for the letter body (the three paragraphs below — the "Hello!" greeting is in addition to that).
- Plain text. No markdown, bullet lists, subject line, date, or address block. Emojis are not allowed in the body but are permitted in the fixed closing block (below).
- After the body, append a single blank line, then the closing block exactly as specified.

Closing block — append verbatim at the end of every letter, exactly like this (one blank line above it, no extra blank lines inside):

Portfolio: https://zrv-five.vercel.app/
GitHub: https://github.com/Miraku17
Looking forward to working with you 🙂
Best regards,
Zian

Do not modify the closing block. Do not add anything after "Zian". Do not skip any line. The body paragraph ends naturally — do not include a separate name sign-off in the body, since "Zian" appears in the closing block.

Structure — three paragraphs in this order. Do not reorder. Do not skip paragraph 1.

PARAGRAPH 1 (the hook — about the JOB, ~40–55 words):
Lead with what the role is and why it fits the candidate. The reader should know in one sentence that you read the job description. Pull a specific detail from the JD (a tool, an integration, the actual problem the role solves). Then a brief one-liner about why the candidate is well-positioned for it. Do not jump straight into past employers in paragraph 1 — save that for paragraph 2.

Examples of how paragraph 1 should land (style only — adapt to the actual JD):
- "Building an internal dashboard layer over ServiceM8 and Xero is the kind of cross-system glue work I enjoy most. I've shipped exactly that pattern — secure Next.js front-ends talking to messy third-party APIs — across multiple production projects."
- "A long-term VA role for a roofing business needs someone who can keep CRM hygiene tight and pull weekly reports without being asked twice. That's been my day-to-day for the last two years."

PARAGRAPH 2 (the proof — about FREELANCE / personal projects only, ~70–95 words):
This paragraph must focus on the candidate's freelance, personal, side, and self-built projects from the resume. DO NOT mention prior full-time employers (e.g. names like Wonita Oriental, AWS, EY, or any company where the candidate held a salaried position). Use the actual freelance project names, technologies, and outcomes from the resume that map to what the JD asks for. Skip resume items the JD doesn't care about. Confident, flowing prose — no bullet lists, no "I did X. I did Y." sentences.

PARAGRAPH 3 (the close — short, ~15–25 words):
One sentence. A low-friction next step ("Happy to walk through the [project] code on a quick call this week" / "Can share working examples of [X] if useful"). Vary across letters — don't repeat the same line.

Hard rules:
- Use only facts from the candidate's resume. Do not invent employers, certifications, years of experience, or projects. If the resume doesn't mention something, do not write it.
- Don't echo the role title or company name more than twice between them.
- AI-tool naming: by default, do not advertise that you use AI tools to write code. BUT if the job description specifically asks for experience with vibe-coding / AI coding tools (Claude Code, Cursor, Lovable, Bolt, v0, Replit Agent, etc.) AND the resume credibly demonstrates rapid-shipping or experimentation with those workflows, then naming the tool is appropriate. Never name the AI that wrote the cover letter itself (Claude, GPT, Llama, ChatGPT) as part of the candidate's voice.
- Avoid these openers and any close paraphrase — they're cliché: "I am writing to apply for…", "I would like to express my interest…", "I came across your posting…", "I'm excited about the opportunity to…", "I'm excited about the chance to…".
- Never put "I'm excited about the opportunity to…" or any variation in the closing paragraph either. The closing paragraph is one short, action-oriented sentence — not a re-statement of interest.

JD-reading test (mandatory):
Paragraph 1 must contain at least one concrete, specific detail pulled from the job description — a tool, a system, a deliverable, a project type, the actual problem the role solves. A reader who sees both the JD and your paragraph 1 should be able to tell you read the JD. Vague openers like "I'm a developer interested in this role" fail this test.

Body paragraph style — this is the voice to match. Confident, fact-dense, flowing prose. Group related work under each employer or project. No "I did X. I did Y. I did Z." lists. No junior framing.

Reference example for paragraph 2 — note the *style*, not the content. Do NOT copy this verbatim. Adapt to the actual freelance projects in the candidate's resume:

> "On the freelance side, I've shipped a Next.js + NestJS ERP system, an inventory management app with PDF generation and Supabase Row-Level Security, and a few smaller dashboards built rapidly with Cursor and Loveable for client experimentation."

Notice the shared traits: confident voice, freelance-only, specific tools / project names / outcomes, flowing prose. Match those traits using the candidate's actual freelance projects — not the ones in the example.

The opening line of the letter should be specific to *this* job — pick whichever angle fits best:
- A direct match between the JD's core ask and the candidate's strongest relevant experience
- A concrete observation about the role or company
- A short framing sentence ("Most of my work has been [X]") IF and only if that genuinely matches what the JD is looking for

Never start every letter with "As a [role]…". Vary the opener job-to-job.

Output only the letter body. No preamble, no commentary, no surrounding quotes.`;

const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function generateAICoverLetter(
  ctx: CoverLetterContext,
  base?: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return localFallback(ctx, base);

  const userPrompt = buildUserPrompt(ctx, base);
  const text = await callGroq(SYSTEM_PROMPT, userPrompt, apiKey);
  return text || localFallback(ctx, base);
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        top_p: 0.92,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Groq API error:", res.status, errText);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : null;
  } catch (err) {
    console.error("Groq request failed:", err);
    return null;
  }
}

function buildUserPrompt(ctx: CoverLetterContext, base?: string): string {
  const parts = [
    "# Application context",
    "",
    `Role: ${ctx.job_title || "(not specified)"}`,
    `Company: ${ctx.company || "(not specified)"}`,
    `Candidate name: ${ctx.name || "(not specified)"}`,
  ];

  if (ctx.skills) {
    parts.push(`Skills the candidate wants to highlight: ${ctx.skills}`);
  }

  parts.push(
    "",
    "# Job description (what the employer wrote)",
    "",
    ctx.description ? ctx.description.slice(0, 6000) : "(not provided)"
  );

  if (ctx.freelance_projects) {
    parts.push(
      "",
      "# Featured freelance projects (REQUIRED — name at least one of these in paragraph 2)",
      "",
      "These are the candidate's flagship freelance projects. Paragraph 2 MUST cite at least one of them by URL or by what it does, and MUST mention the tech stack used. Treat this list as authoritative — do not contradict it.",
      "",
      ctx.freelance_projects
    );
  }

  if (ctx.resume) {
    parts.push(
      "",
      "# Candidate's resume (background context)",
      "",
      "Use this as the source of facts for any claims about the candidate's broader experience, employers, or projects. Do not write any specific claim that isn't supported here or in the featured-freelance-projects block above. Reminder: paragraph 2 should focus on the freelance projects above, not on prior full-time employers.",
      "",
      ctx.resume.slice(0, 12000)
    );
  }

  if (base) {
    parts.push(
      "",
      "# Existing draft to tighten",
      "",
      "Rewrite this to follow the style rules. Keep what's already grounded in the resume; cut filler.",
      "",
      base
    );
  }

  parts.push(
    "",
    "# Task",
    "",
    "Write the cover-letter message now. Output ONLY the letter body. No preamble, no explanation, no quotes around the output."
  );

  return parts.join("\n");
}

function localFallback(ctx: CoverLetterContext, base?: string): string {
  if (base) return base;
  const name = ctx.name || "Your Name";
  const job = ctx.job_title || "the role";
  const company = ctx.company || "your team";
  const skills = ctx.skills || "the skills you need";
  return `Hi ${company} team,

I'm applying for the ${job} position. ${describeFromContext(ctx)}

What I bring:
- Strong ownership and async communication
- Track record of shipping reliable work
- ${skills}

I'd love to chat about how I can contribute. Available for a call this week.

Best,
${name}`;
}

function describeFromContext(ctx: CoverLetterContext): string {
  if (ctx.description) {
    const trimmed = ctx.description.slice(0, 240).replace(/\s+/g, " ").trim();
    return `Your description — "${trimmed}…" — lines up well with my experience.`;
  }
  return "It looks like a great match for what I do best.";
}
