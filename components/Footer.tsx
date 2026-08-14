import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]">
      <p>
        DiagKnow &copy; 2026 &middot; Built for MBBS students &middot;{" "}
        <Link
          href="/privacy"
          className="hover:text-[var(--accent-cyan)] active:text-[var(--accent-cyan)]"
        >
          Privacy
        </Link>
        {" "}&middot;{" "}
        <Link
          href="/terms"
          className="hover:text-[var(--accent-cyan)] active:text-[var(--accent-cyan)]"
        >
          Terms
        </Link>
      </p>
    </footer>
  );
}
