create index if not exists idx_places_publish_status on places (publish_status);
create index if not exists idx_places_district on places (district);
create index if not exists idx_places_religion_type on places (religion_type);
create index if not exists idx_places_source_confidence on places (source_confidence);
create index if not exists idx_places_updated_at on places (updated_at desc);
create index if not exists idx_places_location_gist on places using gist (location);

create index if not exists idx_suppliers_district on suppliers (district);
create index if not exists idx_events_start_at on events (start_at);
