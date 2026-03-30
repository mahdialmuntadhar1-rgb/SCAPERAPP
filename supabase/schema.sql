create table if not exists public.businesses (
  id bigint generated always as identity primary key,
  name text not null,
  city text not null,
  category text not null,
  phone text,
  source text not null,
  source_url text,
  address text,
  notes text,
  confidence_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists businesses_city_idx on public.businesses(city);
create index if not exists businesses_category_idx on public.businesses(category);
create index if not exists businesses_source_idx on public.businesses(source);
