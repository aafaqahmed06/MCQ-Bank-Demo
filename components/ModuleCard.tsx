import Link from "next/link";
import type { Module } from "@/types";

export default function ModuleCard({ module: mod }: { module: Module }) {
  return (
    <Link
      href={`/topics/${mod.id}`}
      className="hud-card hud-card-hover block rounded-xl p-5"
    >
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--text-heading)]">{mod.name}</h3>
      </div>
    </Link>
  );
}
