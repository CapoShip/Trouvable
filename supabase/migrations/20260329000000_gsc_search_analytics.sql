create table if not exists public.gsc_search_analytics (
	id uuid primary key default gen_random_uuid(),
	client_id uuid not null references public.client_geo_profiles(id) on delete cascade,
	site_url text not null,
	date date not null,
	query text not null,
	page text not null,
	clicks numeric not null default 0,
	impressions numeric not null default 0,
	ctr numeric not null default 0,
	position numeric not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint gsc_search_analytics_unique_row unique (client_id, date, query, page),
	constraint gsc_search_analytics_non_negative_metrics check (
		clicks >= 0 and impressions >= 0 and ctr >= 0 and position >= 0
	)
);

create index if not exists gsc_search_analytics_client_date_idx
	on public.gsc_search_analytics (client_id, date desc);

create index if not exists gsc_search_analytics_client_site_date_idx
	on public.gsc_search_analytics (client_id, site_url, date desc);
