# MVP Launch Checklist

## Product Scope

- [ ] Confirm scope matches MVP definition (no reviews, no supplier claim, no donation flow)
- [ ] Confirm high-priority pages render on mobile and desktop

## Data Quality

- [ ] Published places >= 2,000 (Kaohsiung)
- [ ] Required-field completeness >= 95%
- [ ] `source_confidence` distribution reviewed and low-confidence pages gated

## Performance

- [ ] `/api/places` p95 latency < 400ms
- [ ] `/api/nearby` p95 latency < 700ms (radius 3km, limit 20)

## SEO

- [ ] `sitemap.xml` includes all published place pages
- [ ] Place detail pages emit `PlaceOfWorship` JSON-LD
- [ ] `robots.txt` points to production sitemap URL

## Reliability

- [ ] Rollback trigger and owner confirmed
- [ ] DB migration rollback scripts tested in staging
- [ ] Error rate and latency alerts enabled

## Verification Commands

- `npm run test`
- `python3 -m pytest scripts/ingest/tests -v`
- `npx playwright test tests/e2e/places-list.spec.ts tests/e2e/favorites-auth.spec.ts`
