-- v106: Pro promokodlari. Admin yaratadi: necha kun Pro, nechta odam (standart — 1), amal qilish muddati, faqat yangi foydalanuvchilar.
-- Ishlatish: ilova (Pro oynasi, promokod oynasi) va bot (/promo). Promokod to'liq Pro beradi (wd_pro.until uzayadi).
create table if not exists public.wd_promo_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{4,32}$'),
  days int not null check (days between 1 and 366),
  max_uses int not null default 1 check (max_uses between 1 and 100000),
  used int not null default 0,
  valid_until timestamptz,
  only_new boolean not null default false,
  note text,
  active boolean not null default true,
  batch text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.wd_promo_uses (
  code text not null references public.wd_promo_codes(code) on delete cascade,
  user_id uuid not null,
  tg_user bigint,
  via text,
  days int not null,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);
alter table public.wd_promo_codes enable row level security;
alter table public.wd_promo_uses enable row level security;
drop policy if exists wd_promo_codes_admin on public.wd_promo_codes;
create policy wd_promo_codes_admin on public.wd_promo_codes for select to authenticated using (wd_is_admin());
drop policy if exists wd_promo_uses_admin on public.wd_promo_uses;
create policy wd_promo_uses_admin on public.wd_promo_uses for select to authenticated using (wd_is_admin() or user_id = auth.uid());

-- Noto'g'ri urinishlarni cheklash (kodni taxmin qilishga qarshi): 15 daqiqada 10 ta xato
create table if not exists public.wd_promo_fails (user_id uuid not null, at timestamptz not null default now());
create index if not exists wd_promo_fails_u on public.wd_promo_fails (user_id, at);
alter table public.wd_promo_fails enable row level security;

-- Ishlatish (umumiy): service role (bot) va wd_promo_redeem_me orqali
create or replace function public.wd_promo_redeem(uid uuid, c text, tg bigint default null, via text default 'app') returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := upper(regexp_replace(coalesce(c,''), '\s+', '', 'g')); p record; nu timestamptz; fails int;
begin
  if uid is null then return jsonb_build_object('ok',false,'msg','Avval WordDrop hisobingizga kiring'); end if;
  select count(*) into fails from wd_promo_fails where user_id = uid and at > now() - interval '15 minutes';
  if fails >= 10 then return jsonb_build_object('ok',false,'msg','Juda ko''p noto''g''ri urinish. 15 daqiqadan keyin qayta urinib ko''ring'); end if;
  select * into p from wd_promo_codes where code = k for update;
  if p is null or not p.active then
    insert into wd_promo_fails(user_id) values (uid);
    return jsonb_build_object('ok',false,'msg','Bunday promokod topilmadi');
  end if;
  if p.valid_until is not null and p.valid_until < now() then return jsonb_build_object('ok',false,'msg','Promokod muddati tugagan'); end if;
  if exists(select 1 from wd_promo_uses where code = k and user_id = uid) then return jsonb_build_object('ok',false,'msg','Siz bu promokodni allaqachon ishlatgansiz'); end if;
  if p.used >= p.max_uses then return jsonb_build_object('ok',false,'msg','Promokod limiti tugagan'); end if;
  if p.only_new and exists(select 1 from wd_pro where user_id = uid) then return jsonb_build_object('ok',false,'msg','Bu promokod faqat ilgari Pro bo''lmagan foydalanuvchilar uchun'); end if;
  insert into wd_promo_uses(code, user_id, tg_user, via, days) values (k, uid, tg, via, p.days);
  update wd_promo_codes set used = used + 1 where code = k;
  insert into wd_pro(user_id, until, plan, tg_user, updated_at)
    values (uid, now() + make_interval(days => p.days), 'promo', tg, now())
  on conflict (user_id) do update set until = greatest(wd_pro.until, now()) + make_interval(days => p.days), updated_at = now()
  returning until into nu;
  return jsonb_build_object('ok',true,'days',p.days,'until',nu);
end $$;
revoke all on function public.wd_promo_redeem(uuid,text,bigint,text) from public, anon, authenticated;

create or replace function public.wd_promo_redeem_me(c text) returns jsonb
language sql security definer set search_path = public as $$ select wd_promo_redeem(auth.uid(), c, null, 'app') $$;
revoke all on function public.wd_promo_redeem_me(text) from public, anon;
grant execute on function public.wd_promo_redeem_me(text) to authenticated;

-- Admin: kod(lar) yaratish. n > 1 bo'lsa — n ta alohida kod (har biri max_uses marta).
create or replace function public.wd_promo_create(p_days int, p_max int default 1, p_n int default 1, p_code text default null,
  p_valid_until timestamptz default null, p_only_new boolean default false, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare out text[] := '{}'; k text; i int; tries int; b text := to_char(now(),'YYMMDDHH24MISS');
  al text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if not wd_is_admin() then raise exception 'faqat admin'; end if;
  if p_days not between 1 and 366 then raise exception 'kun 1..366'; end if;
  if p_n not between 1 and 200 then raise exception 'soni 1..200'; end if;
  if p_code is not null and length(trim(p_code)) > 0 then
    k := upper(regexp_replace(p_code, '\s+', '', 'g'));
    insert into wd_promo_codes(code, days, max_uses, valid_until, only_new, note, batch, created_by)
      values (k, p_days, greatest(1,p_max), p_valid_until, p_only_new, nullif(p_note,''), b, auth.uid());
    return jsonb_build_object('codes', jsonb_build_array(k), 'batch', b);
  end if;
  for i in 1..p_n loop
    tries := 0;
    loop
      k := 'WD-' || (select string_agg(substr(al, 1 + floor(random()*length(al))::int, 1), '') from generate_series(1,4))
            || '-' || (select string_agg(substr(al, 1 + floor(random()*length(al))::int, 1), '') from generate_series(1,4));
      begin
        insert into wd_promo_codes(code, days, max_uses, valid_until, only_new, note, batch, created_by)
          values (k, p_days, greatest(1,p_max), p_valid_until, p_only_new, nullif(p_note,''), b, auth.uid());
        exit;
      exception when unique_violation then tries := tries + 1; if tries > 5 then raise; end if; end;
    end loop;
    out := out || k;
  end loop;
  return jsonb_build_object('codes', to_jsonb(out), 'batch', b);
end $$;
revoke all on function public.wd_promo_create(int,int,int,text,timestamptz,boolean,text) from public, anon;
grant execute on function public.wd_promo_create(int,int,int,text,timestamptz,boolean,text) to authenticated;

create or replace function public.wd_promo_set_active(p_code text, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not wd_is_admin() then raise exception 'faqat admin'; end if;
  update wd_promo_codes set active = p_active where code = upper(p_code);
end $$;
revoke all on function public.wd_promo_set_active(text,boolean) from public, anon;
grant execute on function public.wd_promo_set_active(text,boolean) to authenticated;
