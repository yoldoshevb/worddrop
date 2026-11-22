-- v101: Admin statistika paneli uchun bitta RPC. Faqat wd_is_admin() = true bo'lganda ishlaydi.
create or replace function public.wd_admin_stats(days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  d0 date := (now() at time zone 'Asia/Tashkent')::date;
  n int := greatest(7, least(coalesce(days, 30), 120));
  r jsonb;
begin
  if not public.wd_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  with act as (   -- foydalanuvchi faol bo'lgan kunlar (ilova holatidagi activeDays + lastActiveDay)
    select s.user_id, x::date as day
    from wd_state s, lateral jsonb_array_elements_text(case when jsonb_typeof(s.state->'activeDays')='array' then s.state->'activeDays' else '[]'::jsonb end) x
    where x ~ '^\d{4}-\d{2}-\d{2}$'
    union
    select s.user_id, (s.state->>'lastActiveDay')::date from wd_state s where (s.state->>'lastActiveDay') ~ '^\d{4}-\d{2}-\d{2}$'
  ),
  first_day as (select user_id, min(day) d from act group by 1),
  cal as (select generate_series(d0 - (n - 1), d0, interval '1 day')::date as day),
  series as (
    select c.day,
      (select count(distinct a.user_id) from act a where a.day = c.day) as dau,
      (select count(*) from first_day f where f.d = c.day) as new_users,
      (select count(*) from auth.users u where (u.created_at at time zone 'Asia/Tashkent')::date = c.day and coalesce(u.is_anonymous,false) = false) as signups,
      (select count(*) from wd_events e where (e.created_at at time zone 'Asia/Tashkent')::date = c.day) as events,
      (select count(*) from wd_pageviews p where (p.created_at at time zone 'Asia/Tashkent')::date = c.day) as views,
      (select coalesce(sum(count),0) from wd_drop_usage du where du.day = c.day) as ai
    from cal c
  ),
  coh as (   -- haftalik kogortalar: birinchi faol haftadan keyingi haftalarda qaytganlar
    select date_trunc('week', f.d)::date as wk, f.user_id,
      array_agg(distinct ((date_trunc('week', a.day)::date - date_trunc('week', f.d)::date) / 7)) as weeks
    from first_day f join act a using (user_id)
    where f.d > d0 - 63
    group by 1, 2
  ),
  cohorts as (
    select wk, count(*) as size,
      round(100.0 * count(*) filter (where 1 = any(weeks)) / count(*)) as w1,
      round(100.0 * count(*) filter (where 2 = any(weeks)) / count(*)) as w2,
      round(100.0 * count(*) filter (where 3 = any(weeks)) / count(*)) as w3,
      round(100.0 * count(*) filter (where 4 = any(weeks)) / count(*)) as w4
    from coh group by wk order by wk
  )
  select jsonb_build_object(
    'generated_at', now(), 'days', n, 'today', d0,
    'kpi', jsonb_build_object(
      'users', (select count(*) from wd_state),
      'accounts', (select count(*) from auth.users where coalesce(is_anonymous,false) = false),
      'guests', (select count(*) from auth.users where is_anonymous),
      'dau', (select count(distinct user_id) from act where day = d0),
      'dau_prev', (select count(distinct user_id) from act where day = d0 - 1),
      'wau', (select count(distinct user_id) from act where day > d0 - 7),
      'wau_prev', (select count(distinct user_id) from act where day > d0 - 14 and day <= d0 - 7),
      'mau', (select count(distinct user_id) from act where day > d0 - 30),
      'new7', (select count(*) from first_day where d > d0 - 7),
      'new7_prev', (select count(*) from first_day where d > d0 - 14 and d <= d0 - 7),
      'pro', (select count(*) from wd_pro where until > now()),
      'pro_paid', (select count(distinct user_id) from wd_pro_payments where not coalesce(refunded,false)),
      'stars', (select coalesce(sum(stars),0) from wd_pro_payments where not coalesce(refunded,false)),
      'stars30', (select coalesce(sum(stars),0) from wd_pro_payments where not coalesce(refunded,false) and created_at > now() - interval '30 days'),
      'tg', (select count(*) from wd_tg_chats where active),
      'tg_linked', (select count(*) from wd_tg_chats where user_id is not null),
      'groups', (select count(*) from wd_tg_groups where status = 'on'),
      'words', (select coalesce(sum((state->>'totalLearned')::int),0) from wd_state where (state->>'totalLearned') ~ '^\d+$'),
      'xp', (select coalesce(sum((state->>'xp')::int),0) from wd_state where (state->>'xp') ~ '^\d+$')
    ),
    'series', (select jsonb_agg(to_jsonb(s) order by s.day) from series s),
    'funnel', jsonb_build_array(
      jsonb_build_object('k','visit','label','Saytga kirish','n',(select count(*) from wd_pageviews where path = '/' and created_at > now() - make_interval(days => n))),
      jsonb_build_object('k','welcome','label','Ilovani ochdi','n',(select count(distinct coalesce(user_id::text, id::text)) from wd_onboarding_events where event = 'welcome_seen' and created_at > now() - make_interval(days => n))),
      jsonb_build_object('k','steps','label','Sozlashni boshladi','n',(select count(distinct coalesce(user_id::text, id::text)) from wd_onboarding_events where event = 'steps_started' and created_at > now() - make_interval(days => n))),
      jsonb_build_object('k','finish','label','Sozlashni tugatdi','n',(select count(distinct coalesce(user_id::text, id::text)) from wd_onboarding_events where event = 'finish' and created_at > now() - make_interval(days => n))),
      jsonb_build_object('k','day2','label','2-kuni qaytdi','n',(select count(*) from (select a.user_id from act a join first_day f using (user_id) where f.d > d0 - n and a.day > f.d group by 1) z)),
      jsonb_build_object('k','pro','label','Pro oldi','n',(select count(distinct user_id) from wd_pro where until > now() - make_interval(days => n)))
    ),
    'cohorts', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from cohorts c),
    'cefr', (select coalesce(jsonb_object_agg(lv, k), '{}'::jsonb) from (select coalesce(nullif(state->>'cefr',''),'—') lv, count(*) k from wd_state group by 1) z),
    'placement', jsonb_build_object(
      'total', (select count(*) from wd_placement),
      'app', (select count(*) from wd_placement where source = 'app'),
      'bot', (select count(*) from wd_placement where source = 'bot'),
      'levels', (select coalesce(jsonb_object_agg(level, k), '{}'::jsonb) from (select level, count(*) k from wd_placement group by 1) z)),
    'features', jsonb_build_object(
      'ai30', (select coalesce(sum(count),0) from wd_drop_usage where day > d0 - 30),
      'ai_users30', (select count(distinct user_id) from wd_drop_usage where day > d0 - 30),
      'ml_attempts', (select count(*) from wd_ml_attempts),
      'ml_users', (select count(distinct user_id) from wd_ml_attempts),
      'ml_tests', (select count(*) from wd_ml_tests where status = 'ready'),
      'referrals', (select count(*) from wd_referrals),
      'daily_results', (select count(*) from wd_daily_results),
      'feedback', (select count(*) from wd_feedback)
    ),
    'words_hist', (select jsonb_agg(jsonb_build_object('b', b, 'n', k) order by o) from (
      select case when w = 0 then '0' when w < 20 then '1–19' when w < 50 then '20–49' when w < 100 then '50–99' when w < 250 then '100–249' else '250+' end b,
             min(w) o, count(*) k
      from (select coalesce(case when (state->>'totalLearned') ~ '^\d+$' then (state->>'totalLearned')::int end, 0) w from wd_state) z group by 1) q),
    'top', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select coalesce(nullif(state->>'name',''),'Ismsiz') name, coalesce((state->>'xp')::int,0) xp, coalesce((state->>'totalLearned')::int,0) words,
             coalesce((state->>'dailyStreak')::int,0) streak, state->>'cefr' cefr, state->>'lastActiveDay' last
      from wd_state where (state->>'xp') ~ '^\d+$' and coalesce((state->>'totalLearned'),'0') ~ '^\d+$' and coalesce((state->>'dailyStreak'),'0') ~ '^\d+$'
      order by (state->>'xp')::int desc limit 10) t)
  ) into r;
  return r;
end $$;
revoke all on function public.wd_admin_stats(int) from public, anon;
grant execute on function public.wd_admin_stats(int) to authenticated;
