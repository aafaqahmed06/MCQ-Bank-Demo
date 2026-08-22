import { describe, it, expect } from "vitest";
import { splitReservedAndRemainder, type QuestionWeight } from "./practiceRankingCore";

type Item = { id: string };

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

/** Deterministic RNG so weighted-random remainder ordering is reproducible. */
function deterministicRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

describe("splitReservedAndRemainder", () => {
  // 10-question pool: 4 missed questions (differing weight), 6 unseen.
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

  it("places the worst-weighted missed questions first, in descending weight order", () => {
    const result = splitReservedAndRemainder(pool, weightMap, qWeights, 0.5, deterministicRng(42));

    // reservedCount = min(floor(10 * 0.5), 4 missed) = min(5, 4) = 4
    const front = result.slice(0, 4).map((r) => r.id);
    expect(front).toEqual(["q0", "q1", "q2", "q3"]);
  });

  it("returns every pool item exactly once, with the remainder excluding all reserved ids", () => {
    const result = splitReservedAndRemainder(pool, weightMap, qWeights, 0.5, deterministicRng(42));
    const reservedIds = result.slice(0, 4).map((r) => r.id);
    const remainderIds = result.slice(4).map((r) => r.id);

    expect(remainderIds.some((id) => reservedIds.includes(id))).toBe(false);
    expect(result).toHaveLength(pool.length);
    expect(result.map((r) => r.id).sort()).toEqual(pool.map((p) => p.id).sort());
  });

  it("caps the reserved count at the real miss count when it's fewer than half the pool", () => {
    // Only 1 missed question in a 10-item pool -- half would be 5, but
    // reservedCount must cap at the real miss count (1), and the other 9
    // slots must still all be filled via the weighted-random remainder,
    // not left empty.
    const shortfallWeights: QuestionWeight[] = [
      mkWeight("q0", 0.8, 2.0),
      ...Array.from({ length: 9 }, (_, i) => mkWeight(`q${i + 1}`, 0, 1.0)),
    ];
    const shortfallWeightMap = new Map(shortfallWeights.map((w) => [w.mcqId, w.finalWeight]));

    const result = splitReservedAndRemainder(
      pool,
      shortfallWeightMap,
      shortfallWeights,
      0.5,
      deterministicRng(7),
    );

    expect(result[0]?.id).toBe("q0");
    expect(result).toHaveLength(10);
    expect(result.map((r) => r.id).sort()).toEqual(pool.map((p) => p.id).sort());
  });

  it("reserves nothing when there are no misses -- the full pool still returns via weighted-random", () => {
    const noMissWeights: QuestionWeight[] = pool.map((p) => mkWeight(p.id, 0, 1.2));
    const noMissWeightMap = new Map(noMissWeights.map((w) => [w.mcqId, w.finalWeight]));

    const result = splitReservedAndRemainder(pool, noMissWeightMap, noMissWeights, 0.5, deterministicRng(1));

    expect(result).toHaveLength(10);
    expect(result.map((r) => r.id).sort()).toEqual(pool.map((p) => p.id).sort());
  });
});
