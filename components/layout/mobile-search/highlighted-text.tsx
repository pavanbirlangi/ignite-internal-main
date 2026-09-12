import { buildHighlightRegex } from '@/lib/search/search-utils'
import type { HighlightedTextProps } from '@/types/MobileSearchTypes'

export function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query.trim()) {
    return <>{text}</>
  }

  const parts = text.split(buildHighlightRegex(query))

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={`${part}-${index}`}
            className="text-primary bg-transparent font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  )
}
