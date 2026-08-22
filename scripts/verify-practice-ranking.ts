// ---------------------------------------------------------------------------
// Pure-function checks for lib/practiceRanking.ts's guaranteed-slot split
// (splitReservedAndRemainder). No database/network access -- run standalone.
// Mirrors the assertion style of scripts/verify-phase8.ts (plain records,
// non-zero exit on failure) since this project has no test framework.
// ---------------------------------------------------------------------------
import {
  splitReservedAndRemainder,
  type QuestionWeight,
} from "../lib/practiceRankingCore";

type Item = { id: string };

const results: { name: string; pass: boolean; detail: string }[] = [];
const failures: string[] = [];
function record(name: string, pass: boolean, detail = ""): void {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures.push(name);
}

function mkWeight(mcqId: string, weaknessScore: number, finalWeight: number): QuestionWeight {
  return {
    mcqId,
    attempts: weaknessScore > 0 ? 3 : 0,
    errorRate: weaknessScore > 0 ? 0.5 : null,
    daysSinceLastAttempt: weaknessScore > 0 ? 5 : null,
    recencyWeight: 1.5,
    weaknessScore,
    noveltyScore: weaknessScore > 0 ? 0 : 1,
    finalWeight,
  };
}

function deterministicRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function main(): void {
  // ── Fixture: 10-question pool, 4 missed (differing weight), 6 unseen ──
  const pool: Item[] = Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }));
  const qWeights: QuestionWeight[] = [
    mkWeight("q0", 0.9, 2.1), // worst miss
    mkWeight("q1", 0.6, 1.7),
    mkWeight("q2", 0.3, 1.3),
    mkWeight("q3", 0.1, 0.9), // weakest miss
    mkWeight("q4", 0, 0.2),
    mkWeight("q5", 0, 0.2),
    mkWeight("q6", 0, 1.2),
    mkWeight("q7", 0, 1.2),
    mkWeight("q8", 0, 1.2),
    mkWeight("q9", 0, 1.2),
  ];
  const weightMap = new Map(qWeights.map((w) => [w.mcqId, w.finalWeight]));

  const result = splitReservedAndRemainder(pool, weightMap, qWeights, 0.5, deterministicRng(42));

  // reservedCount = min(floor(10 * 0.5), 4 missed) = min(5, 4) = 4
  const expectedReservedOrder = ["q0", "q1", "q2", "q3"];
  const actualFront = result.slice(0, 4).map((r) => r.id);
  record(
    "front N entries are exactly the missed questions, worst-weighted first",
    JSON.stringify(actualFront) === JSON.stringify(expectedReservedOrder),
    `got=${JSON.stringify(actualFront)}`,
  );

  record(
    "remainder excludes all reserved ids",
    result.slice(4).every((r) => !expectedReservedOrder.includes(r.id)),
    `remainder=${JSON.stringify(result.slice(4).map((r) => r.id))}`,
  );

  const allIds = result.map((r) => r.id).sort();
  const poolIds = pool.map((p) => p.id).sort();
  record(
    "every pool item appears exactly once (nothing dropped, nothing duplicated)",
    result.length === pool.length && JSON.stringify(allIds) === JSON.stringify(poolIds),
    `result=${result.length} pool=${pool.length}`,
  );

  // ── Shortfall: only 1 missed question in a 10-item pool -- half would be
  // 5, but reservedCount must cap at the real miss count (1), and the
  // other 9 slots must still all be filled, not left empty. ──────────────
  const shortfallWeights: QuestionWeight[] = [
    mkWeight("q0", 0.8, 2.0),
    ...Array.from({ length: 9 }, (_, i) => mkWeight(`q${i + 1}`, 0, 1.0)),
  ];
  const shortfallWeightMap = new Map(shortfallWeights.map((w) => [w.mcqId, w.finalWeight]));
  const shortfallResult = splitReservedAndRemainder(
    pool,
    shortfallWeightMap,
    shortfallWeights,
    0.5,
    deterministicRng(7),
  );
  record(
    "shortfall: reserved count capped at real miss count (1), not half the pool (5)",
    shortfallResult[0]?.id === "q0",
    `first=${shortfallResult[0]?.id}`,
  );
  record(
    "shortfall: all 10 slots still filled despite only 1 real miss",
    shortfallResult.length === 10,
    `length=${shortfallResult.length}`,
  );

  // ── Zero misses: entire pool falls through to the existing weighted-
  // random path, reservedCount = 0. ──────────────────────────────────────
  const noMissWeights: QuestionWeight[] = pool.map((p) => mkWeight(p.id, 0, 1.2));
  const noMissWeightMap = new Map(noMissWeights.map((w) => [w.mcqId, w.finalWeight]));
  const noMissResult = splitReservedAndRemainder(pool, noMissWeightMap, noMissWeights, 0.5, deterministicRng(1));
  record(
    "zero misses: no reservation, full pool still returned via weighted-random",
    noMissResult.length === 10 && JSON.stringify(noMissResult.map((r) => r.id).sort()) === JSON.stringify(poolIds),
    `length=${noMissResult.length}`,
  );

  console.log(`\nPractice ranking summary: ${results.length - failures.length}/${results.length} passed; ${failures.length} failed.`);
  if (failures.length) {
    console.log(`Failed: ${failures.join(" | ")}`);
    process.exit(1);
  }
}

main();
