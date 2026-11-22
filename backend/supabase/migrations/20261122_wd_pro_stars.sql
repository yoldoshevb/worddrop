-- WordDrop v97: Pro (Telegram Stars). Supabase'ga 2026-11-22 da qo'llangan (migration: wd_pro_stars).
create table if not exists public.wd_pro (
  user_id uuid primary key references auth.users(id) on delete cascade,
  until timestamptz not null, plan text,
  sub_active boolean not null default false, sub_charge_id text, tg_user bigint,
  updated_at timestamptz not null default now()
);
create table if not exists public.wd_pro_payments (
  charge_id text primary key,
  user_id uuid references auth.users(id) on delete set null, tg_user bigint,
  stars integer not null, plan text not null,
  recurring boolean not null default false, first_recurring boolean not null default false, refunded boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.wd_pro enable row level security;
alter table public.wd_pro_payments enable row level security;
drop policy if exists wd_pro_own on public.wd_pro;
create policy wd_pro_own on public.wd_pro for select to authenticated using (user_id = auth.uid());

create or replace function public.wd_is_pro(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.wd_pro where user_id = uid and until > now());
$$;
revoke all on function public.wd_is_pro(uuid) from public, anon, authenticated;

create or replace function public.wd_pro_status()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('pro', coalesce(p.until > now(), false), 'until', p.until, 'plan', p.plan, 'sub_active', coalesce(p.sub_active, false))
    from (select 1) x left join public.wd_pro p on p.user_id = auth.uid();
$$;
grant execute on function public.wd_pro_status() to authenticated;

-- Drop AI limiti serverda: Pro — 100, oddiy — 20
create or replace function public.wd_drop_bump(p_max integer default 10)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare uid uuid := auth.uid(); c integer; m integer;
begin
  if uid is null then return json_build_object('day', current_date::text, 'count', 0); end if;
  m := case when public.wd_is_pro(uid) then 100 else least(greatest(coalesce(p_max,20), 0), 20) end;
  insert into public.wd_drop_usage (user_id, day, count, updated_at) values (uid, current_date, 1, now())
  on conflict (user_id) do update
     set count = case when public.wd_drop_usage.day = current_date then least(public.wd_drop_usage.count + 1, m) else 1 end,
         day = current_date, updated_at = now()
  returning count into c;
  return json_build_object('day', current_date::text, 'count', c, 'max', m);
end; $function$;
