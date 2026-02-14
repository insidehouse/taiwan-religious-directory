-- Seed-safe defaults for initial data quality gating.
-- This file is intentionally idempotent and can be re-run.

update places
set publish_status = 'draft'
where publish_status not in ('draft', 'published');

update places
set publish_status = 'draft'
where name is null
   or address is null
   or district is null
   or latitude is null
   or longitude is null;
