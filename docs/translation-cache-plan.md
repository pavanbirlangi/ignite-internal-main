# Permanent translation cache (planned, not built)

Agreed 2026-11-04. Build it in the same change that adds `LANGBLY_API_KEY` (planned for about Dec 2026 to Jan 2027).

## Why
- **Langbly bills every request, even cache hits.** Its docs' caching FAQ: "Each request, cached or not, counts toward your usage." Its cache lasts 1 hour (24 hours for idempotency keys). The "7-day caching" on its comparison pages is marketing only.
- **Price:** 500K characters a month included, then $5 per 1M input characters, minimum 50 characters per request.
- **Our code today:**
  - `lib/services/langbly-translation.service.ts` caches in Worker memory for 1 hour. Each Cloudflare instance starts empty, so it rarely hits.
  - The 13 `unstable_cache` wrappers in `lib/translations/*.ts` revalidate every 3600 s.
  - Result: every page and language gets re-translated, and re-billed, about hourly whenever it's visited or crawled.
- **Scale:** 108 products × 24 languages × about 3,000 characters is about 7.8M characters, roughly $39, per full pass. With a permanent cache we pay that once; after that only edited text costs anything.

## Design
1. **Key:** `tr:v1:<lang>:<format text|html>:<sha256(source text)>` → translated text, with no expiry. Stored in a Cloudflare KV namespace bound to the Worker (for example `TRANSLATIONS`). The account is on Workers Paid ($5), so KV allowances cover it.
2. **Lookup order:** in-memory Map, then KV (batched reads), then one batched Langbly call for the misses, then write the results to KV.
3. **Edits:** the source text changes, so its hash changes and it's a cache miss, translated once. No edit tracking is needed.
4. **Failures:** if Langbly fails or times out, show English and do **not** store it.
5. **Refreshing everything** (for example after better translation quality): bump `v1` to `v2`.
6. **Optional:**
   - A one-time pre-translate script after adding the key, so no visitor waits.
   - A cleanup of orphaned keys.
   - Langbly's `translationMemory: true` (exact matches free); check with Langbly whether the plan includes it.
   - Later: translate on admin save (backend, `product.updated`) and allow manual corrections stored in the database.
7. Keep the page-level `unstable_cache`; it then reads KV instead of calling Langbly.

## Related
- `TRANSLATIONS_ENABLED` in `lib/site.ts` (commit 6360843): while the key is missing, language pages carry no hreflang, point their canonical at English, and the sitemap is English only. Adding the key and deploying turns all of that back on.
- Deploy flow: `~/Desktop/Increddy-db/storefront-cf`. Add the key to `.env.production.local`, then run `npm run cf:deploy`.

## Sources (checked 2026-11-04)
- https://langbly.com/docs/caching/
- https://langbly.com/docs/billing/
- https://langbly.com/pricing
