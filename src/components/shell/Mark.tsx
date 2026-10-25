/**
 * The product mark: a W for Weight drawn as a line of weigh-ins, ending on a
 * teal dot for the latest one. Drawn in tokens so it follows the theme; the
 * dot keeps the bright teal in both, as on the favicon.
 */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
      <rect width="512" height="512" rx="128" fill="var(--primary)" />
      <polyline
        points="104,170 180,338 256,226 332,338 408,170"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="408" cy="170" r="40" fill="#5cb8ad" />
    </svg>
  );
}
