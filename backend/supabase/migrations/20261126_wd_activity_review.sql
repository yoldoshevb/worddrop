-- Owner-only directory and chronological view of existing WordDrop records.
create function public.wd_review_activity(account uuid default null, term text default '', skip_rows int default 0, flagged_only boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare needle text := lower(left(trim(coalesce(term,'')),320));
  result jsonb;
begin
  if not exists(select from auth.users where id=auth.uid() and email_confirmed_at is not null
    and lower(email)='bexruzyoldoshev@yahoo.com') then raise insufficient_privilege; end if;
  if account is null then
    select coalesce(jsonb_agg(to_jsonb(r) order by r.created desc,r.id),'[]') into result from (
      select u.id,u.created_at created,u.is_anonymous guest,u.email,
        nullif(concat_ws(' ',p.first_name,p.last_name),'') name,
        exists(select from public.wd_flags f where f.user_id=u.id) flagged,
        exists(select from public.wd_access_blocks b where u.id=any(b.accounts)) restricted
      from auth.users u left join public.wd_profiles p on p.user_id=u.id
      where u.deleted_at is null
        and (needle='' or strpos(lower(concat_ws(' ',u.email,u.id,p.first_name,p.last_name)),needle)>0)
        and (not flagged_only or exists(select from public.wd_flags f where f.user_id=u.id))
      order by u.created_at desc,u.id offset greatest(skip_rows,0) limit 31
    ) r;
  else
    with events(at,kind,detail) as (
      select created_at,'Hisob yaratildi','' from auth.users where id=account
      union all select last_sign_in_at,'So‘nggi kirish','' from auth.users where id=account
      union all select created_at,'Faoliyat',left(event_type,80) from public.wd_events where user_id=account
      union all select created_at,'Tekshiruv belgisi',left(kind,80) from public.wd_flags where user_id=account
      union all select at,'Promokod qabul qilinmadi','' from public.wd_promo_fails where user_id=account
      union all select created_at,'Promokod ishlatildi',days::text||' kun' from public.wd_promo_uses where user_id=account
      union all select created_at,'Boshlang‘ich sozlash',left(event,80) from public.wd_onboarding_events where user_id=account
      union all select created_at,'Multilevel imtihoni',left(mode,60) from public.wd_ml_attempts where user_id=account
      union all select created_at,'Daraja testi',level from public.wd_placement where user_id=account
      union all select created_at,'Pro to‘lovi',stars::text||' Stars' from public.wd_pro_payments where user_id=account
      union all select updated_at,'Kunlik AI hisobi yangilandi',count::text||' so‘rov' from public.wd_drop_usage where user_id=account
      union all select created_at,'Drop AI',case when role='user' then 'Xabar yuborildi' else 'Javob yozildi' end from public.wd_drop_msg where user_id=account
      union all select p.updated_at,'Kitobdagi so‘nggi progress',w.title from public.wd_lit_progress p left join public.wd_lit_works w on w.id=p.work_id where p.user_id=account
      union all select updated_at,'Kunlik mashq yangilandi',day::text from public.wd_daily_results where user_id=account
      union all select submitted_at,'Fikr bildirildi','' from public.wd_feedback where user_id=account
      union all select created_at,'Kirish cheklovi qo‘yildi','' from public.wd_access_blocks where account=any(accounts)
    )
    select coalesce(jsonb_agg(to_jsonb(r) order by at desc,kind,detail),'[]') into result from (
      select at,kind,detail,count(*) n from events where at is not null group by at,kind,detail
      order by at desc,kind,detail offset greatest(skip_rows,0) limit 31
    ) r;
  end if;
  return result;
end $$;
revoke all on function public.wd_review_activity(uuid,text,int,boolean) from public,anon,authenticated;
grant execute on function public.wd_review_activity(uuid,text,int,boolean) to authenticated;
