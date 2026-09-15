import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxyImageUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.replace('https://cdn.shopify.com', '/cdn-shopify');
}

// product.description is real HTML now (a TipTap-based rich-text editor in Medusa Admin writes
// directly into it) -- SEO surfaces (meta description, JSON-LD) need a clean plain-text excerpt,
// not raw markup.
export function stripHtml(html: string | null | undefined, maxLength = 160): string {
  if (!html) return ''
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text
}
