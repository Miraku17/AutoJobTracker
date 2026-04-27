import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@olj.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Demo User",
    },
  });

  await prisma.template.create({
    data: {
      userId: user.id,
      name: "General VA Cover Letter",
      isDefault: true,
      subject: "Application for {{job_title}} role at {{company}}",
      body: `Hi {{company}} team,

I'm excited to apply for the {{job_title}} position. I bring {{skills}} along with a track record of dependable, proactive work.

A few things you should know about me:
- Reliable communication across timezones
- Comfortable with task management tools (Trello, Notion, ClickUp)
- Detail-obsessed and outcome-driven

I'd love to chat about how I can help {{company}}. Available for an interview at your convenience.

Best,
{{name}}`,
    },
  });

  await prisma.template.create({
    data: {
      userId: user.id,
      name: "Developer Role",
      subject: "{{job_title}} application — {{name}}",
      body: `Hi,

I'm applying for the {{job_title}} role at {{company}}. With experience in {{skills}}, I can ship production-quality work from day one.

Recent highlights:
- Built and shipped end-to-end web apps
- Comfortable on full-stack JS/TS
- Strong async communication

Looking forward to hearing from you.

— {{name}}`,
    },
  });

  console.log("Seeded demo user:", email, "/ password: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
