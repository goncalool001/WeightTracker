/** The product mark: a bathroom-scale dial with its needle, drawn in tokens. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
      <rect width="512" height="512" rx="128" fill="var(--primary)" />
      <path
        d="M120 312 a136 136 0 0 1 272 0"
        fill="none"
        stroke="var(--on-primary)"
        strokeOpacity="0.25"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M120 312 a136 136 0 0 1 200 -125"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <circle cx="256" cy="312" r="24" fill="var(--on-primary)" />
      <rect x="247" y="196" width="18" height="120" rx="9" fill="var(--on-primary)" transform="rotate(34 256 312)" />
    </svg>
  );
}
