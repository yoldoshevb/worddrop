-- v101b: Admin uchun Drop AI kunlik limitsiz (ilova ham, Telegram bot ham).
create or replace function public.wd_uid_is_admin(uid uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((select lower(u.email) in (select lower(x) from jsonb_array_elements_text(k.val) x)
                   from auth.users u, public.wd_tg_kv k where u.id = uid and k.key = 'admins'), false);
$$;
revoke all on function public.wd_uid_is_admin(uuid) from public, anon, authenticated;

create or replace function public.wd_drop_usage_admin_free() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.wd_uid_is_admin(new.user_id) then new.count := 0; end if;
  return new;
end $$;
drop trigger if exists wd_drop_usage_admin_free on public.wd_drop_usage;
create trigger wd_drop_usage_admin_free before insert or update on public.wd_drop_usage
  for each row execute function public.wd_drop_usage_admin_free();

create or replace function public.wd_drop_today() returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c integer;
begin
  if uid is null then return json_build_object('day', current_date::text, 'count', 0); end if;
  select u.count into c from public.wd_drop_usage u where u.user_id = uid and u.day = current_date;
  return json_build_object('day', current_date::text, 'count', coalesce(c, 0), 'unlimited', public.wd_uid_is_admin(uid));
end $$;

create or replace function public.wd_drop_bump(p_max integer default 10) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c integer; m integer; adm boolean;
begin
  if uid is null then return json_build_object('day', current_date::text, 'count', 0); end if;
  adm := public.wd_uid_is_admin(uid);
  m := case when adm then 1000000 when public.wd_is_pro(uid) then 100 else least(greatest(coalesce(p_max,20), 0), 20) end;
  insert into public.wd_drop_usage (user_id, day, count, updated_at)
       values (uid, current_date, 1, now())
  on conflict (user_id) do update
     set count = case when public.wd_drop_usage.day = current_date then least(public.wd_drop_usage.count + 1, m) else 1 end,
         day = current_date, updated_at = now()
  returning count into c;
  return json_build_object('day', current_date::text, 'count', c, 'max', m, 'unlimited', adm);
end $$;

update public.wd_drop_usage set count = 0 where public.wd_uid_is_admin(user_id);
