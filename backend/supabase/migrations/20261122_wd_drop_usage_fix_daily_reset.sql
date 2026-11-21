-- wd_drop_usage da PK faqat user_id; oldingi "on conflict (user_id, day)" har doim xato berardi,
-- shuning uchun Drop AI kunlik limiti serverda hisoblanmagan. Endi bitta qator: kun o'zgarsa hisob 1 dan boshlanadi.
-- Supabase'ga 2026-11-22 da qo'llangan (migration: wd_drop_usage_fix_daily_reset). Bu fayl — zaxira nusxa.
create or replace function public.wd_drop_bump(p_max integer default 10)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare uid uuid := auth.uid(); c integer;
begin
  if uid is null then return json_build_object('day', current_date::text, 'count', 0); end if;
  insert into public.wd_drop_usage (user_id, day, count, updated_at)
       values (uid, current_date, 1, now())
  on conflict (user_id) do update
     set count = case when public.wd_drop_usage.day = current_date
                      then least(public.wd_drop_usage.count + 1, greatest(p_max, 0))
                      else 1 end,
         day = current_date,
         updated_at = now()
  returning count into c;
  return json_build_object('day', current_date::text, 'count', c);
end; $function$;

create or replace function public.wd_drop_today()
returns json language plpgsql security definer set search_path to 'public' as $function$
declare uid uuid := auth.uid(); c integer;
begin
  if uid is null then return json_build_object('day', current_date::text, 'count', 0); end if;
  select u.count into c from public.wd_drop_usage u where u.user_id = uid and u.day = current_date;
  return json_build_object('day', current_date::text, 'count', coalesce(c, 0));
end; $function$;
