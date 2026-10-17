// Outline brand glyphs from Tabler Icons (MIT, tabler.io/icons), so every
// social link in the footer has the same weight and shape. Returns null for
// networks not listed here; the footer then falls back to the CMS icon.
const PATHS: Record<string, string[]> = {
  facebook: [
    'M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3',
  ],
  discord: [
    'M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0',
    'M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0',
    'M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3',
    'M7 16.5c3.5 1 6.5 1 10 0',
  ],
  x: [
    'M4 4l11.733 16h4.267l-11.733 -16z',
    'M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772',
  ],
  instagram: [
    'M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z',
    'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0',
    'M16.5 7.5v.01',
  ],
  linkedin: [
    'M8 11v5',
    'M8 8v.01',
    'M12 16v-5',
    'M16 16v-3a2 2 0 1 0 -4 0',
    'M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z',
  ],
  youtube: [
    'M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z',
    'M10 9l5 3l-5 3z',
  ],
}
PATHS.twitter = PATHS.x

export function hasSocialIcon(name: string) {
  return name.toLowerCase() in PATHS
}

export default function SocialIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const paths = PATHS[name.toLowerCase()]
  if (!paths) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
