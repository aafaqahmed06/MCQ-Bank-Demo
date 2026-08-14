/**
 * DiagKnow abstract brand mark: a "diagnostic pathway" ring converging on a
 * central node. Abstraction of a clinical cross inside a knowledge ring —
 * deliberately not a stethoscope. Renders with currentColor so it works in
 * both Clinical Light and Deep Medical Dark.
 */
export default function LogoMark({
  className = "size-5 sm:size-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* knowledge ring */}
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="2.2" />
      {/* diagnostic pathway — converging cross */}
      <path
        d="M16 6.5v19M6.5 16h19"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* central node */}
      <circle cx="16" cy="16" r="3.4" fill="currentColor" />
      <circle cx="16" cy="16" r="1.6" fill="var(--bg-card, #ffffff)" />
    </svg>
  );
}
