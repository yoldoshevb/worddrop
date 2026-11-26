-- Either a Telegram identity or a direct account restriction can hold access.
alter table public.wd_access_blocks drop constraint wd_access_blocks_pkey,
  add unique (telegram_id), add column account_id uuid unique;
alter table public.wd_access_blocks alter column telegram_id drop not null,
  add check ((telegram_id is not null and account_id is null) or
             (telegram_id is null and account_id is not null and accounts = array[account_id]));
create or replace function public.wd_manage_access(op text, target text default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
 return (select coalesce(jsonb_agg(telegram_id::text order by created_at desc),'[]') from public.wd_access_blocks where telegram_id is not null);
end $$;

create function public.wd_manage_account_access(op text, target text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  needle text := lower(trim(target));
  account uuid;
begin
  if not exists (select from auth.users where id = auth.uid()
      and lower(email) = 'bexruzyoldoshev@yahoo.com' and email_confirmed_at is not null) then
    raise insufficient_privilege;
  end if;

  if op in ('block','unblock') then
    if needle ~ '^[0-9]+$' then
      perform public.wd_manage_access(op, needle);
    else
      if needle ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        account := needle::uuid;
      elsif needle like '%@%' and op = 'block' then
        select id into strict account from auth.users where lower(email) = needle;
      else
        raise exception 'Email, WordDrop ID yoki Telegram ID kiriting.';
      end if;
      if op = 'block' then
        if account = auth.uid() then raise exception 'O‘z admin hisobingizni cheklay olmaysiz.'; end if;
        perform 1 from auth.users where id = account for update;
        if not found then raise no_data_found; end if;
        insert into public.wd_access_blocks(account_id, accounts) values(account, array[account])
          on conflict (account_id) do nothing;
      else
        delete from public.wd_access_blocks where account_id = account;
      end if;
    end if;
  elsif op is distinct from 'list' then
    raise exception 'Noma’lum amal';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', coalesce(b.telegram_id::text, b.account_id::text),
    'label', case when b.telegram_id is not null then 'Telegram · ' || b.telegram_id
                  else coalesce(u.email, b.account_id::text) end
    ) order by b.created_at desc), '[]'::jsonb)
    from public.wd_access_blocks b left join auth.users u on u.id = b.account_id);
exception when no_data_found then raise exception 'Bunday WordDrop hisobi topilmadi.';
when too_many_rows then raise exception 'WordDrop ID orqali kiriting.';
end $$;
revoke all on function public.wd_manage_account_access(text,text) from public, anon, authenticated;
grant execute on function public.wd_manage_account_access(text,text) to authenticated;
