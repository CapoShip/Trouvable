-- GA4 Analytics tables: daily traffic aggregates and top landing pages per period.

create table if not exists public.ga4_traffic_daily (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.client_geo_profiles(id) on delete cascade,
    property_id text not null,
    date date not null,
    sessions numeric not null default 0,
    users numeric not null default 0,
    new_users numeric not null default 0,
    page_views numeric not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ga4_traffic_daily_unique_row unique (client_id, date),
    constraint ga4_traffic_daily_non_negative_metrics check (
        sessions >= 0 and users >= 0 and new_users >= 0 and page_views >= 0
    )
);

create index if not exists ga4_traffic_daily_client_date_idx
    on public.ga4_traffic_daily (client_id, date desc);

DROP TRIGGER IF EXISTS tgr_ga4_traffic_daily_updated_at ON public.ga4_traffic_daily;
CREATE TRIGGER tgr_ga4_traffic_daily_updated_at
    BEFORE UPDATE ON public.ga4_traffic_daily
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

create table if not exists public.ga4_top_pages (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.client_geo_profiles(id) on delete cascade,
    property_id text not null,
    period_end date not null,
    landing_page text not null,
    sessions numeric not null default 0,
    users numeric not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ga4_top_pages_unique_row unique (client_id, period_end, landing_page),
    constraint ga4_top_pages_non_negative_metrics check (
        sessions >= 0 and users >= 0
    )
);

create index if not exists ga4_top_pages_client_period_idx
    on public.ga4_top_pages (client_id, period_end desc);

DROP TRIGGER IF EXISTS tgr_ga4_top_pages_updated_at ON public.ga4_top_pages;
CREATE TRIGGER tgr_ga4_top_pages_updated_at
    BEFORE UPDATE ON public.ga4_top_pages
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
