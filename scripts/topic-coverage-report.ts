// Lightweight per-topic coverage report CLI. Query/aggregation logic lives
// in lib/coverage.ts (shared with app/admin/coverage/page.tsx) so it isn't
// duplicated between the CLI and the admin UI -- this file is just the
// service-role client + console.table formatting.

import { getServiceClient } from "./tag-utils";
import { getTopicCoverage, tierFor, CRITICAL_MAX_QUESTIONS, LOW_MAX_QUESTIONS } from "@/lib/coverage";

async function main(): Promise<void> {
  const db = getServiceClient();
  const rows = await getTopicCoverage(db);

  const table = rows.map((r) => ({
    Topic: r.name,
    Block: r.block,
    Module: r.module,
    Published: r.publishedCount,
    Linked: r.linkedCount,
    "Diff 1/2/3": `${r.difficulty[1]}/${r.difficulty[2]}/${r.difficulty[3]}`,
    "Verif v/u/nr/rej": `${r.verification.verified}/${r.verification.unverified}/${r.verification.needs_review}/${r.verification.rejected}`,
    Flag: tierFor(r.publishedCount),
  }));

  console.table(table);

  const critical = rows.filter((r) => tierFor(r.publishedCount) === "CRITICAL").length;
  const low = rows.filter((r) => tierFor(r.publishedCount) === "LOW").length;
  const ok = rows.filter((r) => tierFor(r.publishedCount) === "OK").length;
  console.log(
    `\n${rows.length} topics: ${critical} critical (0-${CRITICAL_MAX_QUESTIONS}), ${low} low ` +
      `(${CRITICAL_MAX_QUESTIONS + 1}-${LOW_MAX_QUESTIONS}), ${ok} ok (${LOW_MAX_QUESTIONS + 1}+) ` +
      `(edit CRITICAL_MAX_QUESTIONS/LOW_MAX_QUESTIONS in lib/coverage.ts to change the tiers).`,
  );
}

main().catch((err) => {
  console.error("Topic coverage report failed:", err);
  process.exit(1);
});
