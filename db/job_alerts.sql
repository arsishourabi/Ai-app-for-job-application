create table if not exists job_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_notified_at timestamptz,
  active boolean not null default true
);

create index if not exists job_alerts_active_idx on job_alerts (active);
create index if not exists job_alerts_email_idx on job_alerts (email);
