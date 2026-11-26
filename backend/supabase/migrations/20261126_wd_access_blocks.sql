create table public.wd_access_blocks (
 telegram_id bigint primary key check(telegram_id between 1 and 4503599627370495),
 accounts uuid[] not null default '{}', created_at timestamptz not null default now()
);
alter table public.wd_access_blocks enable row level security;
revoke all on public.wd_access_blocks from public, anon, authenticated;
grant select on public.wd_access_blocks to service_role;
create function public.wd_access_guard() returns void language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role()='authenticated' and exists(select 1 from public.wd_access_blocks b where auth.uid()=any(b.accounts)) then
 raise sqlstate 'PT403' using message='WD_BLOCKED';
 end if;
end $$;
alter role authenticator set pgrst.db_pre_request='public.wd_access_guard';
notify pgrst,'reload config';
create function public.wd_manage_access(op text, target text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare tid bigint; ids uuid[];
begin
 if not exists(select 1 from auth.users where id=auth.uid() and lower(email)='bexruzyoldoshev@yahoo.com' and email_confirmed_at is not null) then raise insufficient_privilege; end if;
 if op in ('block','unblock') then
 if target is null or target !~ '^[1-9][0-9]{0,15}$' then raise exception 'Telegram ID noto‘g‘ri'; end if;
 tid:=target::bigint;
 if op='block' then
 select coalesce(array_agg(distinct u.id),'{}') into ids from auth.users u where u.email='tg'||tid||'@tg.worddrop-app.uz' or exists(select from public.wd_tg_chats c where c.chat_id=tid and c.user_id=u.id);
 if auth.uid()=any(ids) then raise exception 'Admin hisobini bloklab bo‘lmaydi'; end if;
 insert into public.wd_access_blocks(telegram_id,accounts) values(tid,ids) on conflict(telegram_id) do update set accounts=array(select distinct unnest(wd_access_blocks.accounts||excluded.accounts));
 else delete from public.wd_access_blocks where telegram_id=tid; end if;
 elsif op is distinct from 'list' then raise exception 'Noma’lum amal'; end if;
 return (select coalesce(jsonb_agg(telegram_id::text order by created_at desc),'[]') from public.wd_access_blocks);
end $$;
revoke all on function public.wd_manage_access(text,text) from public,anon;
grant execute on function public.wd_manage_access(text,text) to authenticated;
