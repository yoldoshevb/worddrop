create table public.wd_access_auth_holds(user_id uuid primary key references auth.users(id) on delete cascade, prior_until timestamptz);
alter table public.wd_access_auth_holds enable row level security;
revoke all on public.wd_access_auth_holds from public,anon,authenticated;
create function public.wd_apply_access_hold() returns trigger language plpgsql security definer set search_path='' as $$
declare account_uuid uuid; prior_ts timestamptz; marker constant timestamptz := '9999-12-31 00:00:00+00';
begin
 if tg_op in ('INSERT','UPDATE') then
 foreach account_uuid in array new.accounts loop
 select banned_until into prior_ts from auth.users where auth.users.id=account_uuid for update;
 if found then
 insert into public.wd_access_auth_holds values(account_uuid,prior_ts) on conflict do nothing;
 update auth.users set banned_until=marker where auth.users.id=account_uuid and (banned_until is null or banned_until<marker);
 delete from auth.sessions where user_id=account_uuid;
 end if;
 end loop;
 elsif tg_op='DELETE' then
 foreach account_uuid in array old.accounts loop
 perform 1 from auth.users where auth.users.id=account_uuid for update;
 if not exists(select from public.wd_access_blocks where account_uuid=any(accounts)) then
 update auth.users u set banned_until=h.prior_until from public.wd_access_auth_holds h where h.user_id=account_uuid and u.id=h.user_id and u.banned_until=marker;
 delete from public.wd_access_auth_holds where user_id=account_uuid;
 end if;
 end loop;
 end if;
 return null;
end $$;
revoke all on function public.wd_apply_access_hold() from public, anon, authenticated;
create trigger wd_apply_access_hold after insert or update or delete on public.wd_access_blocks for each row execute function public.wd_apply_access_hold();
