import Link from "next/link";
import type { Block } from "@/types";

export default function BlockCard({ block }: { block: Block }) {
  return (
    <Link
      href={`/modules/${block.id}`}
      className="hud-card hud-card-hover block rounded-xl p-5"
    >
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#f2f8ff]">{block.name}</h3>
        <p className="text-sm text-[#8ca3c5]">Year {block.year}</p>
      </div>
    </Link>
  );
}
