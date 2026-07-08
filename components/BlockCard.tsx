import Link from "next/link";
import type { Block } from "@/types";

export default function BlockCard({ block }: { block: Block }) {
  return (
    <Link
      href={`/modules/${block.id}`}
      className="hud-card hud-card-hover block rounded-xl p-5"
    >
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--text-heading)]">{block.name}</h3>
        <p className="text-sm text-[var(--text-muted)]">Year {block.year}</p>
      </div>
    </Link>
  );
}
