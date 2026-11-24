-- v108: «Adabiyot» rejimi — asarlar, boblar (bepul bob yoki Pro), o'qish progressi
-- Manba fayllar: content/adabiyot/<id>.json  →  lit-sync edge function bazaga yozadi.

create table if not exists public.wd_lit_works(
  id          text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  title       text not null,
  author      text not null,
  year        int,
  orig_lang   text,
  edition     text not null default 'full' check (edition in ('full','study')),
  level       text,
  genres      text[] not null default '{}',
  cover       jsonb not null default '{}'::jsonb,   -- ranglar, belgi
  meta        jsonb not null default '{}'::jsonb,   -- kirish, qahramonlar, mavzular, manba
  toc         jsonb not null default '[]'::jsonb,   -- [{idx,title,title_uz,words,free,part}]
  words       int not null default 0,
  sort        int not null default 100,
  published   boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.wd_lit_chapters(
  work_id    text not null references public.wd_lit_works(id) on delete cascade,
  idx        int  not null,
  free       boolean not null default false,
  body       jsonb not null,                        -- {paras:[{en,uz,k}], gloss:[], quiz:[], note_uz}
  updated_at timestamptz not null default now(),
  primary key(work_id, idx)
);

create table if not exists public.wd_lit_progress(
  user_id    uuid not null references auth.users(id) on delete cascade,
  work_id    text not null references public.wd_lit_works(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,    -- {cur, pos, done:[idx], quiz:{idx:score}}
  updated_at timestamptz not null default now(),
  primary key(user_id, work_id)
);

alter table public.wd_lit_works    enable row level security;
alter table public.wd_lit_chapters enable row level security;
alter table public.wd_lit_progress enable row level security;

-- Joriy foydalanuvchi Pro bobini o'qiy oladimi (Pro yoki admin)
create or replace function public.wd_lit_can_read()
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce(auth.uid() is not null and (public.wd_is_pro(auth.uid()) or public.wd_is_admin()), false)
$$;
revoke all on function public.wd_lit_can_read() from public;
grant execute on function public.wd_lit_can_read() to anon, authenticated;

drop policy if exists wd_lit_works_read on public.wd_lit_works;
create policy wd_lit_works_read on public.wd_lit_works for select
  using (published or public.wd_is_admin());

drop policy if exists wd_lit_chapters_read on public.wd_lit_chapters;
create policy wd_lit_chapters_read on public.wd_lit_chapters for select
  using (exists(select 1 from public.wd_lit_works w where w.id=work_id and (w.published or public.wd_is_admin()))
         and (free or public.wd_lit_can_read()));

drop policy if exists wd_lit_progress_own on public.wd_lit_progress;
create policy wd_lit_progress_own on public.wd_lit_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.wd_lit_works, public.wd_lit_chapters to anon, authenticated;
grant select, insert, update, delete on public.wd_lit_progress to authenticated;
