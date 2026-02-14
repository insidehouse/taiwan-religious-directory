# Kaohsiung Religious Directory MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 8-12 週內上線高雄宗教場所搜尋 MVP（2,000+ 場所資料），支援搜尋/篩選/地圖附近探索/登入收藏，並以 SEO 自然流量作為 3 個月北極星指標。

**Architecture:** 以 `places` 為核心資料模型，`suppliers` 和 `events` 先作為場所詳情頁的關聯資訊。前端採 Next.js App Router（列表 SSR、詳情 SSG + ISR），後端以 Route Handlers + Supabase Postgres/PostGIS，資料來源由 Google Maps + 政府宗教資料雙源合併，使用信心分數與發布門檻控制品質。

**Tech Stack:** Next.js 16 + TypeScript、Supabase(PostgreSQL/PostGIS/Auth)、Drizzle ORM、Zod、Vitest、Playwright、Python 3.12（資料清洗管線）、Vercel。

---

## Skills To Apply During Execution

- `@test-driven-development`
- `@systematic-debugging`
- `@verification-before-completion`
- `@requesting-code-review`

## Weekly Milestones (10 Weeks)

- Week 1: 專案骨架、CI、環境變數契約、資料模型與 migration 草案。
- Week 2: Google Maps/政府資料抓取器 + 原始資料落地。
- Week 3: 清洗、去重、合併、資料發布門檻與 seed 匯入（目標 2,000+）。
- Week 4: 搜尋 API（關鍵字、行政區、宗教類型、分頁）+ 列表頁 SSR。
- Week 5: 場所詳情頁 SSG + 結構化資料 + 基本 SEO metadata。
- Week 6: 附近探索 API（PostGIS）+ 地圖/列表切換。
- Week 7: Supabase Auth + 收藏流程（匿名瀏覽、收藏時登入）。
- Week 8: 供應商/活動關聯區塊（僅詳情頁展示）+ 回報入口。
- Week 9: 效能/品質驗證、sitemap/robots、Search Console 上線配置。
- Week 10: 上線演練、回滾策略、MVP 驗收與正式發布。

## MVP Data Contract (V1)

### places (required for publish)

- `id` (UUID)
- `slug` (text, unique)
- `name` (text)
- `religion_type` (enum: taoism|buddhism|christianity|catholicism|islam|folk|other)
- `district` (text)
- `address` (text)
- `latitude` (double precision)
- `longitude` (double precision)
- `source_primary` (text)
- `source_confidence` (numeric 0-1)
- `updated_at` (timestamp)
- `publish_status` (enum: draft|published)

### places (optional in MVP)

- `deity_name` (text)
- `built_year` (int)
- `phone` (text)
- `opening_hours_json` (jsonb)
- `transport_notes` (text)
- `photos_json` (jsonb)

### suppliers (linked, optional)

- `id`, `name`, `service_type`, `phone`, `website`, `district`

### events (linked, optional)

- `id`, `title`, `start_at`, `end_at`, `organizer`, `event_type`, `source_url`

### user_favorites

- `user_id` (UUID)
- `place_id` (UUID)
- `created_at` (timestamp)
- unique (`user_id`, `place_id`)

## MVP Acceptance Criteria

- 資料量: `published` 場所 >= 2,000 筆（高雄）。
- 欄位完整率: publish required 欄位完整率 >= 95%。
- 搜尋效能: `/api/places` p95 < 400ms（10k rows 測試資料）。
- 附近效能: `/api/nearby` p95 < 700ms（半徑 3km, limit 20）。
- 收藏流程: 未登入點收藏會登入，登入後返回原頁並成功收藏。
- SEO: `sitemap.xml` 含所有 published 場所頁；每個詳情頁含 `PlaceOfWorship` 結構化資料。
- 產品範圍: 不含評論、不含供應商認領、不含捐獻流程。

---

### Task 1: Bootstrap Web App And Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `tests/smoke/homepage.test.tsx`

**Step 1: Create Next.js app skeleton**

Run: `pnpm create next-app . --typescript --eslint --app --src-dir false --import-alias "@/*"`
Expected: app scaffold created with `app/` route.

**Step 2: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

test('shows product title', () => {
  render(<HomePage />)
  expect(screen.getByText('高雄宗教場所目錄')).toBeInTheDocument()
})
```

**Step 3: Run test to verify it fails**

Run: `pnpm vitest tests/smoke/homepage.test.tsx`
Expected: FAIL (title not found).

**Step 4: Implement minimal homepage**

```tsx
export default function HomePage() {
  return <main><h1>高雄宗教場所目錄</h1></main>
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm vitest tests/smoke/homepage.test.tsx`
Expected: PASS.

**Step 6: Commit**

```bash
git add .
git commit -m "chore: bootstrap nextjs app with test harness"
```

### Task 2: Define Domain Types And Validation

**Files:**
- Create: `lib/domain/place.ts`
- Create: `lib/domain/supplier.ts`
- Create: `lib/domain/event.ts`
- Create: `tests/unit/place-schema.test.ts`

**Step 1: Write failing schema test for required publish fields**

```ts
import { PlacePublishSchema } from '@/lib/domain/place'

test('requires publish fields', () => {
  const parsed = PlacePublishSchema.safeParse({ name: '某某宮' })
  expect(parsed.success).toBe(false)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/place-schema.test.ts`
Expected: FAIL (schema missing).

**Step 3: Implement zod schemas**

```ts
import { z } from 'zod'

export const PlacePublishSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  religion_type: z.enum(['taoism', 'buddhism', 'christianity', 'catholicism', 'islam', 'folk', 'other']),
  district: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  source_primary: z.string().min(1),
  source_confidence: z.number().min(0).max(1),
  updated_at: z.string(),
  publish_status: z.enum(['draft', 'published'])
})
```

**Step 4: Re-run tests**

Run: `pnpm vitest tests/unit/place-schema.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/domain tests/unit/place-schema.test.ts
git commit -m "feat: add domain schemas for places suppliers events"
```

### Task 3: Database Schema And Spatial Indexes

**Files:**
- Create: `db/migrations/0001_init.sql`
- Create: `db/migrations/0002_indexes.sql`
- Create: `db/migrations/0003_seed_flags.sql`
- Create: `tests/sql/schema-smoke.sql`

**Step 1: Write failing SQL smoke check**

```sql
select to_regclass('public.places') as places_table;
```

**Step 2: Run local DB check before migration**

Run: `psql "$DATABASE_URL" -f tests/sql/schema-smoke.sql`
Expected: `places_table` is null.

**Step 3: Implement migrations**

```sql
create extension if not exists postgis;

create table if not exists places (
  id uuid primary key,
  slug text unique not null,
  name text not null,
  religion_type text not null,
  district text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  location geography(point, 4326) generated always as (st_setsrid(st_makepoint(longitude, latitude),4326)::geography) stored,
  source_primary text not null,
  source_confidence numeric(3,2) not null,
  updated_at timestamptz not null,
  publish_status text not null default 'draft'
);
```

**Step 4: Apply migration and verify**

Run: `pnpm db:migrate && psql "$DATABASE_URL" -f tests/sql/schema-smoke.sql`
Expected: `places_table` = `places`.

**Step 5: Commit**

```bash
git add db/migrations tests/sql/schema-smoke.sql
git commit -m "feat: add places suppliers events schema with postgis"
```

### Task 4: Raw Ingestion From Google Maps

**Files:**
- Create: `scripts/ingest/fetch_outscraper.py`
- Create: `scripts/ingest/tests/test_fetch_outscraper.py`
- Create: `data/raw/.gitkeep`

**Step 1: Write failing parser test for Outscraper payload**

```python
from scripts.ingest.fetch_outscraper import normalize_outscraper_row

def test_normalize_outscraper_row_has_required_keys():
    row = {"name": "某某宮", "full_address": "高雄市...", "lat": 22.6, "lng": 120.3}
    normalized = normalize_outscraper_row(row)
    assert normalized["name"] == "某某宮"
    assert normalized["latitude"] == 22.6
```

**Step 2: Run test to verify it fails**

Run: `pytest scripts/ingest/tests/test_fetch_outscraper.py -v`
Expected: FAIL (module/function missing).

**Step 3: Implement fetch + normalize script**

```python
def normalize_outscraper_row(row: dict) -> dict:
    return {
        "name": row.get("name", "").strip(),
        "address": row.get("full_address", "").strip(),
        "latitude": float(row["lat"]),
        "longitude": float(row["lng"]),
        "phone": row.get("phone", ""),
        "source_primary": "outscraper"
    }
```

**Step 4: Re-run test**

Run: `pytest scripts/ingest/tests/test_fetch_outscraper.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/ingest data/raw/.gitkeep
git commit -m "feat: add outscraper raw ingestion script"
```

### Task 5: Government Data Ingestion And Merge

**Files:**
- Create: `scripts/ingest/fetch_moi_religion.py`
- Create: `scripts/ingest/merge_sources.py`
- Create: `scripts/ingest/tests/test_merge_sources.py`
- Create: `data/processed/.gitkeep`

**Step 1: Write failing merge confidence test**

```python
from scripts.ingest.merge_sources import merge_record

def test_merge_record_assigns_confidence():
    merged = merge_record({"name": "龍皇宮", "address": "高雄市..."}, {"name": "龍皇宮", "address": "高雄市..."})
    assert merged["source_confidence"] >= 0.8
```

**Step 2: Run test to verify it fails**

Run: `pytest scripts/ingest/tests/test_merge_sources.py -v`
Expected: FAIL.

**Step 3: Implement merge and publish threshold**

```python
def merge_record(gmap: dict, gov: dict) -> dict:
    score = 0.0
    if gmap.get("name") == gov.get("name"):
        score += 0.5
    if gmap.get("address") == gov.get("address"):
        score += 0.4
    if gmap.get("latitude") and gmap.get("longitude"):
        score += 0.1
    return {
        **gmap,
        **{k: v for k, v in gov.items() if v},
        "source_confidence": min(score, 1.0),
        "publish_status": "published" if score >= 0.7 else "draft"
    }
```

**Step 4: Re-run test**

Run: `pytest scripts/ingest/tests/test_merge_sources.py -v`
Expected: PASS.

**Step 5: Seed processed data to DB**

Run: `python scripts/ingest/merge_sources.py --city 高雄市 --out data/processed/kaohsiung_places.jsonl`
Expected: output file created with 2,000+ rows.

**Step 6: Commit**

```bash
git add scripts/ingest data/processed/.gitkeep
git commit -m "feat: merge google and government sources with confidence scoring"
```

### Task 6: Search API (Keyword + Filters + Pagination)

**Files:**
- Create: `app/api/places/route.ts`
- Create: `lib/queries/searchPlaces.ts`
- Create: `tests/integration/places-api.test.ts`

**Step 1: Write failing integration test for district filter**

```ts
import { GET } from '@/app/api/places/route'

test('filters places by district', async () => {
  const req = new Request('http://localhost/api/places?district=左營區')
  const res = await GET(req)
  expect(res.status).toBe(200)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/places-api.test.ts`
Expected: FAIL.

**Step 3: Implement query function and API route**

```ts
export async function searchPlaces(params: URLSearchParams) {
  // district, religion_type, keyword, page, pageSize
}
```

```ts
export async function GET(req: Request) {
  const data = await searchPlaces(new URL(req.url).searchParams)
  return Response.json(data)
}
```

**Step 4: Re-run tests**

Run: `pnpm vitest tests/integration/places-api.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/api/places lib/queries tests/integration/places-api.test.ts
git commit -m "feat: implement places search api with filters"
```

### Task 7: Places List Page (SSR)

**Files:**
- Create: `app/places/page.tsx`
- Create: `components/places/PlaceFilters.tsx`
- Create: `components/places/PlaceList.tsx`
- Create: `tests/e2e/places-list.spec.ts`

**Step 1: Write failing e2e test for filter interaction**

```ts
import { test, expect } from '@playwright/test'

test('user can filter by district on places page', async ({ page }) => {
  await page.goto('/places')
  await page.selectOption('[name="district"]', '左營區')
  await expect(page.getByText('左營區')).toBeVisible()
})
```

**Step 2: Run e2e test to verify it fails**

Run: `pnpm playwright test tests/e2e/places-list.spec.ts`
Expected: FAIL (route/component missing).

**Step 3: Implement SSR list page and filters**

```tsx
export default async function PlacesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/places?${new URLSearchParams(params)}`, { cache: 'no-store' })
  const data = await res.json()
  return <PlaceList data={data} />
}
```

**Step 4: Re-run e2e test**

Run: `pnpm playwright test tests/e2e/places-list.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/places components/places tests/e2e/places-list.spec.ts
git commit -m "feat: add ssr places listing and filters"
```

### Task 8: Place Detail Page (SSG + Structured Data)

**Files:**
- Create: `app/places/[slug]/page.tsx`
- Create: `lib/seo/placeStructuredData.ts`
- Create: `tests/unit/place-structured-data.test.ts`

**Step 1: Write failing test for PlaceOfWorship schema**

```ts
import { toPlaceStructuredData } from '@/lib/seo/placeStructuredData'

test('generates PlaceOfWorship schema', () => {
  const jsonld = toPlaceStructuredData({ name: '龍山寺', address: '高雄市...', latitude: 22.6, longitude: 120.3 })
  expect(jsonld['@type']).toBe('PlaceOfWorship')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/place-structured-data.test.ts`
Expected: FAIL.

**Step 3: Implement detail page and JSON-LD generator**

```ts
export function toPlaceStructuredData(place: {
  name: string
  address: string
  latitude: number
  longitude: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PlaceOfWorship',
    name: place.name,
    address: place.address,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.latitude,
      longitude: place.longitude
    }
  }
}
```

**Step 4: Re-run test**

Run: `pnpm vitest tests/unit/place-structured-data.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/places/[slug] lib/seo tests/unit/place-structured-data.test.ts
git commit -m "feat: add static place detail pages with schema markup"
```

### Task 9: Nearby API + Map View

**Files:**
- Create: `app/api/nearby/route.ts`
- Create: `components/places/NearbyMap.tsx`
- Create: `app/nearby/page.tsx`
- Create: `tests/integration/nearby-api.test.ts`

**Step 1: Write failing nearby API test**

```ts
import { GET } from '@/app/api/nearby/route'

test('returns places within radius', async () => {
  const req = new Request('http://localhost/api/nearby?lat=22.62&lng=120.30&radiusKm=3')
  const res = await GET(req)
  expect(res.status).toBe(200)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/nearby-api.test.ts`
Expected: FAIL.

**Step 3: Implement PostGIS-based nearby query**

```sql
select id, name, address,
  st_distance(location, st_setsrid(st_makepoint($1, $2), 4326)::geography) as distance_m
from places
where publish_status = 'published'
  and st_dwithin(location, st_setsrid(st_makepoint($1, $2), 4326)::geography, $3)
order by distance_m
limit $4;
```

**Step 4: Re-run test**

Run: `pnpm vitest tests/integration/nearby-api.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/api/nearby app/nearby components/places/NearbyMap.tsx tests/integration/nearby-api.test.ts
git commit -m "feat: add nearby exploration api and map view"
```

### Task 10: Auth + Favorites Flow

**Files:**
- Create: `app/api/favorites/route.ts`
- Create: `components/auth/LoginButton.tsx`
- Create: `components/places/FavoriteButton.tsx`
- Create: `tests/e2e/favorites-auth.spec.ts`

**Step 1: Write failing e2e for auth-gated favorite**

```ts
test('unauthenticated user is redirected to login on favorite', async ({ page }) => {
  await page.goto('/places/test-place')
  await page.getByRole('button', { name: '收藏' }).click()
  await expect(page).toHaveURL(/login/)
})
```

**Step 2: Run e2e test to verify it fails**

Run: `pnpm playwright test tests/e2e/favorites-auth.spec.ts`
Expected: FAIL.

**Step 3: Implement favorites route + redirect-back logic**

```ts
if (!session) {
  const redirectTo = encodeURIComponent(currentPath)
  return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?next=${redirectTo}`, 302)
}
```

**Step 4: Re-run e2e**

Run: `pnpm playwright test tests/e2e/favorites-auth.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/api/favorites components/auth components/places/FavoriteButton.tsx tests/e2e/favorites-auth.spec.ts
git commit -m "feat: add login and favorites flow"
```

### Task 11: SEO Infrastructure (Metadata + Sitemap + Robots)

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Modify: `app/places/[slug]/page.tsx`
- Create: `tests/integration/sitemap.test.ts`

**Step 1: Write failing sitemap test**

```ts
import { GET } from '@/app/sitemap'

test('sitemap includes published place URLs', async () => {
  const entries = await GET()
  expect(entries.length).toBeGreaterThan(1000)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/sitemap.test.ts`
Expected: FAIL.

**Step 3: Implement sitemap and metadata**

```ts
export default async function sitemap() {
  const places = await getPublishedPlaceSlugs()
  return places.map((slug) => ({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/places/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }))
}
```

**Step 4: Re-run tests**

Run: `pnpm vitest tests/integration/sitemap.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/sitemap.ts app/robots.ts app/places/[slug]/page.tsx tests/integration/sitemap.test.ts
git commit -m "feat: add seo metadata sitemap and robots"
```

### Task 12: Release Readiness And MVP Gate

**Files:**
- Create: `docs/release/mvp-launch-checklist.md`
- Create: `scripts/qa/verify_mvp_gate.ts`
- Create: `tests/qa/mvp-gate.test.ts`

**Step 1: Write failing QA gate test**

```ts
import { evaluateMvpGate } from '@/scripts/qa/verify_mvp_gate'

test('fails if published places are below 2000', async () => {
  const result = await evaluateMvpGate({ publishedPlaces: 1800, requiredCoverage: 0.95 })
  expect(result.pass).toBe(false)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/qa/mvp-gate.test.ts`
Expected: FAIL.

**Step 3: Implement gate script and checklist**

```ts
export async function evaluateMvpGate(input: { publishedPlaces: number; requiredCoverage: number }) {
  const pass = input.publishedPlaces >= 2000 && input.requiredCoverage >= 0.95
  return { pass }
}
```

**Step 4: Run full verification suite**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm playwright test`
Expected: all PASS.

**Step 5: Commit**

```bash
git add docs/release/mvp-launch-checklist.md scripts/qa tests/qa/mvp-gate.test.ts
git commit -m "chore: add mvp launch gate and verification checklist"
```

---

## Deployment And Rollback Checklist

- Vercel preview deploy every PR; production deploy from `main` only.
- Supabase migration rollback SQL prepared per migration file.
- Feature flags:
  - `FEATURE_NEARBY`
  - `FEATURE_SUPPLIER_WIDGET`
  - `FEATURE_EVENT_WIDGET`
- Rollback trigger:
  - search API p95 > 800ms for 15 mins
  - 5xx error rate > 2% for 10 mins
  - failed login callback rate > 5%

## Post-Launch 14-Day Metrics Plan

- Day 1-3: crawl/index coverage and sitemap fetch success.
- Day 4-7: keyword landing impressions and top district queries.
- Day 8-14: favorites conversion rate and return users.
- Weekly review: remove low-quality pages (`source_confidence < 0.7`).

