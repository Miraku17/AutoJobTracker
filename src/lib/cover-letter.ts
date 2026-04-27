export type CoverLetterContext = {
  job_title?: string;
  company?: string;
  skills?: string;
  name?: string;
  description?: string;
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

// AI placeholder. If OPENAI_API_KEY is set, the future implementation
// would call OpenAI. For now we synthesize a polished letter from context.
export async function generateAICoverLetter(ctx: CoverLetterContext, base?: string) {
  if (process.env.OPENAI_API_KEY) {
    // Placeholder for actual OpenAI Chat Completions call.
    // Intentionally not implemented to avoid leaking keys / requiring network.
  }

  const name = ctx.name || "Your Name";
  const job = ctx.job_title || "the role";
  const company = ctx.company || "your team";
  const skills = ctx.skills || "the skills you need";
  const intro = base
    ? base
    : `Hi ${company} team,

I'm applying for the ${job} position. ${describeFromContext(ctx)}

What I bring:
- Strong ownership and async communication
- Track record of shipping reliable work
- ${skills}

I'd love to chat about how I can contribute. Available for an interview at your convenience.

Best,
${name}`;
  return intro;
}

function describeFromContext(ctx: CoverLetterContext) {
  if (ctx.description) {
    const trimmed = ctx.description.slice(0, 240).replace(/\s+/g, " ").trim();
    return `Your description — "${trimmed}…" — lines up well with my experience.`;
  }
  return `It looks like a great match for what I do best.`;
}
