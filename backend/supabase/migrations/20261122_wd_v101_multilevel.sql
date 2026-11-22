-- v101: Multilevel sinov imtihoni (mock) — testlar banki, urinishlar, audio
-- Testlarni admin ilovada yaratadi (AI + TTS), foydalanuvchilar bankdan oladi.

create or replace function public.wd_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select lower(auth.jwt() ->> 'email') in (select lower(x) from jsonb_array_elements_text(val) x)
       from public.wd_tg_kv where key = 'admins'), false);
$$;
grant execute on function public.wd_is_admin() to authenticated;

create table if not exists public.wd_ml_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'hidden')),
  listening jsonb,
  reading jsonb,
  writing jsonb,
  speaking jsonb,
  audio jsonb not null default '{}'::jsonb,      -- klip nomi -> ommaviy URL
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  uses int not null default 0
);
alter table public.wd_ml_tests enable row level security;
drop policy if exists wd_ml_tests_read on public.wd_ml_tests;
create policy wd_ml_tests_read on public.wd_ml_tests for select to authenticated
  using (status = 'ready' or public.wd_is_admin());
drop policy if exists wd_ml_tests_admin on public.wd_ml_tests;
create policy wd_ml_tests_admin on public.wd_ml_tests for all to authenticated
  using (public.wd_is_admin()) with check (public.wd_is_admin());

create table if not exists public.wd_ml_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid references public.wd_ml_tests(id) on delete set null,
  mode text not null default 'full',            -- full | listening | reading | writing | speaking
  scores jsonb not null default '{}'::jsonb,    -- {listening:{raw,score}, reading:..., writing:{score,...}, speaking:..., overall, level}
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists wd_ml_attempts_user on public.wd_ml_attempts(user_id, created_at desc);
alter table public.wd_ml_attempts enable row level security;
drop policy if exists wd_ml_attempts_own on public.wd_ml_attempts;
create policy wd_ml_attempts_own on public.wd_ml_attempts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists wd_ml_attempts_admin on public.wd_ml_attempts;
create policy wd_ml_attempts_admin on public.wd_ml_attempts for select to authenticated
  using (public.wd_is_admin());

-- Test ishlatilganini sanash (foydalanuvchi o'zi update qila olmaydi)
create or replace function public.wd_ml_use(tid uuid) returns void
language sql security definer set search_path = public as $$
  update public.wd_ml_tests set uses = uses + 1 where id = tid and status = 'ready';
$$;
grant execute on function public.wd_ml_use(uuid) to authenticated;

-- Audio: ommaviy o'qish, faqat admin yozadi
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ml-audio', 'ml-audio', true, 10485760, array['audio/mpeg', 'audio/wav', 'audio/x-wav'])
on conflict (id) do nothing;
drop policy if exists wd_ml_audio_admin_ins on storage.objects;
create policy wd_ml_audio_admin_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'ml-audio' and public.wd_is_admin());
drop policy if exists wd_ml_audio_admin_upd on storage.objects;
create policy wd_ml_audio_admin_upd on storage.objects for update to authenticated
  using (bucket_id = 'ml-audio' and public.wd_is_admin());
drop policy if exists wd_ml_audio_admin_del on storage.objects;
create policy wd_ml_audio_admin_del on storage.objects for delete to authenticated
  using (bucket_id = 'ml-audio' and public.wd_is_admin());
