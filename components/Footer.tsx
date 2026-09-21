import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle py-6 text-center text-sm text-text-tertiary">
      <p>
        DiagKnow &copy; 2026 &middot; Built for MBBS students &middot;{" "}
        <Link href="/privacy" className="hover:text-primary active:text-primary">
          Privacy
        </Link>
        {" "}&middot;{" "}
        <Link href="/terms" className="hover:text-primary active:text-primary">
          Terms
        </Link>
      </p>
    </footer>
  );
}
