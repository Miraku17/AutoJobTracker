import { PrismaClient } from "@prisma/client";

const JUNK = /^(see\s*more|view\s*(details|job)?|read\s*more|apply\s*(now)?|details|more|→|»|\.{2,})$/i;

async function main() {
  const prisma = new PrismaClient();
  const jobs = await prisma.job.findMany({ select: { id: true, title: true } });

  const junkIds = jobs
    .filter((j) => {
      const t = (j.title ?? "").trim();
      if (!t) return true;
      if (t.length < 4) return true;
      return JUNK.test(t);
    })
    .map((j) => j.id);

  console.log(`Total jobs: ${jobs.length}`);
  console.log(`Junk-titled jobs to delete: ${junkIds.length}`);

  if (junkIds.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const titles = jobs
    .filter((j) => junkIds.includes(j.id))
    .map((j) => `  - "${j.title}"`)
    .slice(0, 10)
    .join("\n");
  console.log(`Sample (first 10):\n${titles}`);

  const evDel = await prisma.event.deleteMany({
    where: { jobId: { in: junkIds } },
  });
  const reDel = await prisma.reminder.deleteMany({
    where: { jobId: { in: junkIds } },
  });
  const jbDel = await prisma.job.deleteMany({
    where: { id: { in: junkIds } },
  });

  console.log(
    `Deleted: ${jbDel.count} jobs, ${evDel.count} events, ${reDel.count} reminders`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
