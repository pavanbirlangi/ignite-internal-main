// The PEGI age label as stores show it (Driffle, Instant Gaming): the age on the PEGI colour
// (green 3 and 7, orange 12 and 16, red 18) over a white "PEGI" strip.
const PEGI_COLOURS: Record<string, string> = {
  '3': '#7AB929',
  '7': '#7AB929',
  '12': '#F5A300',
  '16': '#F5A300',
  '18': '#E2001A',
}

export const isPegiAge = (age: string | null | undefined): age is string => !!age && age in PEGI_COLOURS

export default function PegiIcon({ age, className }: { age: string; className?: string }) {
  return (
    <svg viewBox="0 0 28 34" role="img" aria-label={`PEGI ${age}`} className={className}>
      <rect width="28" height="34" rx="2" fill="#FFFFFF" />
      <rect x="1.5" y="1.5" width="25" height="23" rx="1" fill={PEGI_COLOURS[age]} />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize={age.length > 1 ? 14 : 16}
      >
        {age}
      </text>
      <text
        x="14"
        y="31.2"
        textAnchor="middle"
        fill="#000000"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="6"
        letterSpacing="0.6"
      >
        PEGI
      </text>
    </svg>
  )
}
