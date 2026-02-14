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
  location geography(point, 4326)
    generated always as (
      st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    ) stored,
  source_primary text not null,
  source_confidence numeric(3,2) not null check (source_confidence >= 0 and source_confidence <= 1),
  updated_at timestamptz not null,
  publish_status text not null default 'draft' check (publish_status in ('draft', 'published')),
  deity_name text,
  built_year int,
  phone text,
  opening_hours_json jsonb,
  transport_notes text,
  photos_json jsonb
);

create table if not exists suppliers (
  id uuid primary key,
  name text not null,
  service_type text not null,
  phone text,
  website text,
  district text not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  organizer text,
  event_type text not null,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists place_supplier_links (
  place_id uuid not null references places(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, supplier_id)
);

create table if not exists place_event_links (
  place_id uuid not null references places(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, event_id)
);

create table if not exists user_favorites (
  user_id uuid not null,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
