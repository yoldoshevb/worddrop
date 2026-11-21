-- WordDrop Telegram tizimi (v95): bot foydalanuvchilari, hisob ulash kodlari, kanal postlari, sozlamalar
-- Supabase'ga 2026-11-22 da qo'llangan (migration: wd_telegram_bot_v1). Bu fayl — zaxira nusxa.
create extension if not exists pg_net with schema extensions;

create table if not exists public.wd_tg_chats (
  chat_id      bigint primary key,
  user_id      uuid unique references auth.users(id) on delete set null,
  username     text,
  first_name   text,
  morning      boolean not null default true,
  evening      boolean not null default true,
  remind_hour  smallint not null default 20 check (remind_hour between 0 and 23),
  active       boolean not null default true,
  quiz_ok      integer not null default 0,
  quiz_total   integer not null default 0,
  quiz_streak  integer not null default 0,
  ask_day      date,
  ask_count    integer not null default 0,
  last_morning date,
  last_evening date,
  created_at   timestamptz not null default now(),
  last_seen    timestamptz not null default now()
);
create index if not exists wd_tg_chats_user_idx on public.wd_tg_chats(user_id);

create table if not exists public.wd_tg_codes (
  code       text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

create table if not exists public.wd_tg_posts (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null default 'custom',
  status        text not null default 'draft' check (status in ('draft','scheduled','sending','sent','failed')),
  caption       text not null default '',
  image_path    text,
  poll          jsonb,
  card          jsonb,
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  tg_message_id bigint,
  error         text,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists wd_tg_posts_due_idx on public.wd_tg_posts(status, scheduled_at);

create table if not exists public.wd_tg_kv (
  key        text primary key,
  val        jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.wd_tg_chats enable row level security;
alter table public.wd_tg_codes enable row level security;
alter table public.wd_tg_posts enable row level security;
alter table public.wd_tg_kv    enable row level security;

drop policy if exists wd_tg_chats_own_select on public.wd_tg_chats;
create policy wd_tg_chats_own_select on public.wd_tg_chats for select to authenticated using (user_id = auth.uid());

insert into public.wd_tg_kv(key, val) values
  ('webhook_secret', to_jsonb(encode(extensions.gen_random_bytes(24),'hex'))),
  ('cron_secret',    to_jsonb(encode(extensions.gen_random_bytes(24),'hex'))),
  ('admins',         '["bexruzyoldoshev@yahoo.com"]'::jsonb),
  ('channel',        '"@worddrop_uz"'::jsonb),
  ('autopilot',      '{"word":false,"word_hour":9,"quiz":false,"quiz_hour":18}'::jsonb)
on conflict (key) do nothing;

insert into storage.buckets (id, name, public) values ('tg-posts','tg-posts', true)
on conflict (id) do nothing;

create or replace function public.wd_tg_top(n integer default 10)
returns table(name text, xp bigint, streak integer)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(s.state->>'name'),''), nullif(trim(p.first_name),''), 'WordDrop o''quvchisi') as name,
         coalesce((s.state->>'xp')::bigint,0) as xp,
         coalesce((s.state->>'dailyStreak')::int,0) as streak
    from public.wd_state s
    left join public.wd_profiles p on p.user_id = s.user_id
   where coalesce((s.state->>'xp')::bigint,0) > 0
   order by 2 desc
   limit greatest(1, least(n, 50));
$$;
revoke all on function public.wd_tg_top(integer) from public, anon, authenticated;

select cron.unschedule('wd-tg-tick') where exists (select 1 from cron.job where jobname = 'wd-tg-tick');
select cron.schedule('wd-tg-tick', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://jgeycbyaoiybpudakgmk.supabase.co/functions/v1/tg-bot',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (select val #>> '{}' from public.wd_tg_kv where key = 'cron_secret')),
    body := '{"action":"cron"}'::jsonb,
    timeout_milliseconds := 55000
  );
$cron$);
