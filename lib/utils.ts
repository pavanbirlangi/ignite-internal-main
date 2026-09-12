import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxyImageUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.replace('https://cdn.shopify.com', '/cdn-shopify');
}
