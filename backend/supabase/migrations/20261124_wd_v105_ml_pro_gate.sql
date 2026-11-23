-- v105: Multilevel — to'liq Pro. Bepul hisob: bitta urinish (to'liq yoki bitta bo'lim), cheklangan tahlil.
-- Bepul urinish alohida jadvalda qayd qilinadi (foydalanuvchi o'chira olmaydi).
create table if not exists public.wd_ml_free (
  user_id uuid not null,
  test_id uuid not null,
  mode text not null default 'full',
  scored_w boolean not null default false,
  scored_s boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, test_id)
);
alter table public.wd_ml_free enable row level security;
drop policy if exists wd_ml_free_own on public.wd_ml_free;
create policy wd_ml_free_own on public.wd_ml_free for select to authenticated using (user_id = auth.uid());

-- Avval natija topshirgan Pro bo'lmagan foydalanuvchilar: bepul urinishi ishlatilgan deb yoziladi
insert into public.wd_ml_free (user_id, test_id, mode, scored_w, scored_s, created_at)
select distinct on (a.user_id, a.test_id) a.user_id, a.test_id, a.mode, true, true, a.created_at
from public.wd_ml_attempts a
where a.test_id is not null and not public.wd_is_pro(a.user_id) and not public.wd_uid_is_admin(a.user_id)
order by a.user_id, a.test_id, a.created_at
on conflict do nothing;

-- Testlar (javoblari bilan): faqat admin, Pro yoki shu testni bepul urinishga olgan foydalanuvchi
drop policy if exists wd_ml_tests_read on public.wd_ml_tests;
create policy wd_ml_tests_read on public.wd_ml_tests for select to authenticated using (
  wd_is_admin() or (status = 'ready' and (public.wd_is_pro(auth.uid())
    or exists (select 1 from public.wd_ml_free f where f.user_id = auth.uid() and f.test_id = wd_ml_tests.id))));

-- Holat
create or replace function public.wd_ml_access(uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare adm boolean := wd_uid_is_admin(uid); pro boolean := wd_is_pro(uid); c record; done boolean; rdy int;
begin
  select count(*) into rdy from wd_ml_tests where status = 'ready';
  if adm or pro then return jsonb_build_object('signed',true,'admin',adm,'pro',true,'free_left',99,'ready',rdy); end if;
  select * into c from wd_ml_free where user_id = uid order by created_at desc limit 1;
  if c is null then return jsonb_build_object('signed',true,'admin',false,'pro',false,'free_left',1,'ready',rdy); end if;
  select exists(select 1 from wd_ml_attempts a where a.user_id = uid and a.test_id = c.test_id and a.created_at >= c.created_at) into done;
  return jsonb_build_object('signed',true,'admin',false,'pro',false,'free_left',0,'ready',rdy,
    'claim', case when done then null else jsonb_build_object('test_id',c.test_id,'mode',c.mode) end);
end $$;

-- Boshlash: Pro/admin — ruxsat; bepul — bitta urinish (tugallanmagan bo'lsa o'sha testni qaytaradi)
create or replace function public.wd_ml_claim(uid uuid, m text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c record; done boolean; t uuid;
begin
  if m not in ('full','listening','reading','writing','speaking') then return jsonb_build_object('ok',false,'msg','Noto''g''ri rejim'); end if;
  if wd_uid_is_admin(uid) or wd_is_pro(uid) then return jsonb_build_object('ok',true,'limited',false); end if;
  select * into c from wd_ml_free where user_id = uid order by created_at desc limit 1;
  if c is not null then
    select exists(select 1 from wd_ml_attempts a where a.user_id = uid and a.test_id = c.test_id and a.created_at >= c.created_at) into done;
    if not done and c.mode = m then return jsonb_build_object('ok',true,'limited',true,'test_id',c.test_id,'resume',true); end if;
    return jsonb_build_object('ok',false,'pro',true,'msg','Bepul urinish ishlatilgan. Multilevel imtihonlari — WordDrop Pro''da.');
  end if;
  select id into t from wd_ml_tests where status = 'ready' order by random() limit 1;
  if t is null then return jsonb_build_object('ok',false,'msg','Hozircha imtihon variantlari tayyor emas'); end if;
  insert into wd_ml_free (user_id, test_id, mode) values (uid, t, m);
  return jsonb_build_object('ok',true,'limited',true,'test_id',t);
end $$;

-- AI baholash ruxsati: Pro/admin — to'liq; bepul — shu urinishda har bo'lim bir marta, cheklangan javob
create or replace function public.wd_ml_gate(uid uuid, kind text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if wd_uid_is_admin(uid) or wd_is_pro(uid) then return jsonb_build_object('ok',true,'limited',false); end if;
  select * into c from wd_ml_free where user_id = uid order by created_at desc limit 1;
  if c is null or not (c.mode = 'full' or c.mode = kind)
     or (kind = 'writing' and c.scored_w) or (kind = 'speaking' and c.scored_s)
     or exists(select 1 from wd_ml_attempts a where a.user_id = uid and a.test_id = c.test_id and a.created_at >= c.created_at) then
    return jsonb_build_object('ok',false,'pro',true,'msg','Bepul urinish ishlatilgan. Writing va Speaking baholash — WordDrop Pro''da.');
  end if;
  return jsonb_build_object('ok',true,'limited',true);
end $$;
-- Baholash muvaffaqiyatli bo'lgandan keyingina belgilanadi
create or replace function public.wd_ml_mark(uid uuid, kind text) returns void
language sql security definer set search_path = public as $$
  update wd_ml_free set scored_w = scored_w or kind = 'writing', scored_s = scored_s or kind = 'speaking'
  where user_id = uid and test_id = (select test_id from wd_ml_free where user_id = uid order by created_at desc limit 1);
$$;
revoke all on function public.wd_ml_access(uuid), public.wd_ml_claim(uuid,text), public.wd_ml_gate(uuid,text), public.wd_ml_mark(uuid,text) from public, anon, authenticated;
