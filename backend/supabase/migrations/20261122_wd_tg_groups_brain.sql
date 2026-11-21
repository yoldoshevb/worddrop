-- WordDrop v96: Telegram guruhlaridagi "aqlli" Drop — guruhlar, odamlar, xabarlar tarixi, boshqaruv.
-- Faqat service role (edge funksiya) o'qiydi/yozadi: RLS yoqilgan, siyosat yo'q.

create table if not exists public.wd_tg_groups (
  chat_id      bigint primary key,
  title        text,
  username     text,
  status       text not null default 'pending' check (status in ('pending','on','off','left')),
  mode         text not null default 'smart'   check (mode in ('mention','smart','active')),
  humor        smallint not null default 1 check (humor between 0 and 2),
  daily_limit  integer not null default 50 check (daily_limit between 0 and 1000),
  used_day     date,
  used         integer not null default 0,
  quiet_from   smallint check (quiet_from between 0 and 23),
  quiet_to     smallint check (quiet_to between 0 and 23),
  muted_until  timestamptz,
  vibe         text,
  rules        text,
  jokes        text,
  new_msgs     integer not null default 0,
  since_bot    integer not null default 0,
  total_msgs   integer not null default 0,
  last_bot_at  timestamptz,
  learned_at   timestamptz,
  added_by     bigint,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.wd_tg_people (
  user_id       bigint primary key,
  first_name    text,
  last_name     text,
  username      text,
  bio           text,
  bio_at        timestamptz,
  ai_notes      text,
  secret_notes  text,
  public_notes  text,
  ignore        boolean not null default false,
  optout        boolean not null default false,
  msg_count     integer not null default 0,
  last_seen     timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.wd_tg_members (
  chat_id   bigint not null references public.wd_tg_groups(chat_id) on delete cascade on update cascade,
  user_id   bigint not null references public.wd_tg_people(user_id) on delete cascade,
  msg_count integer not null default 0,
  last_seen timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists public.wd_tg_msgs (
  id         bigserial primary key,
  chat_id    bigint not null references public.wd_tg_groups(chat_id) on delete cascade on update cascade,
  msg_id     bigint,
  user_id    bigint,
  name       text,
  text       text not null,
  is_bot     boolean not null default false,
  reply_to   bigint,
  created_at timestamptz not null default now()
);
create index if not exists wd_tg_msgs_chat_idx on public.wd_tg_msgs(chat_id, id desc);

alter table public.wd_tg_groups  enable row level security;
alter table public.wd_tg_people  enable row level security;
alter table public.wd_tg_members enable row level security;
alter table public.wd_tg_msgs    enable row level security;

-- Bitta chaqiruvda: guruh hisoblagichlari, odam va a'zolik yozuvi, xabar tarixi
create or replace function public.wd_tg_ingest(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.wd_tg_groups; pr public.wd_tg_people; uid bigint := nullif(p->>'user_id','')::bigint;
begin
  update public.wd_tg_groups
     set title = coalesce(nullif(p->>'title',''), title),
         new_msgs = new_msgs + 1, since_bot = since_bot + 1, total_msgs = total_msgs + 1, updated_at = now()
   where chat_id = (p->>'chat_id')::bigint
  returning * into g;
  if not found then return jsonb_build_object('group', null); end if;
  if uid is not null then
    insert into public.wd_tg_people (user_id, first_name, last_name, username, msg_count, last_seen)
         values (uid, p->>'first_name', nullif(p->>'last_name',''), nullif(p->>'username',''), 1, now())
    on conflict (user_id) do update
       set first_name = excluded.first_name, last_name = excluded.last_name, username = excluded.username,
           msg_count = public.wd_tg_people.msg_count + 1, last_seen = now()
    returning * into pr;
    insert into public.wd_tg_members (chat_id, user_id, msg_count, last_seen) values (g.chat_id, uid, 1, now())
    on conflict (chat_id, user_id) do update set msg_count = public.wd_tg_members.msg_count + 1, last_seen = now();
  end if;
  if coalesce(p->>'text','') <> '' and not coalesce(pr.optout, false) then
    insert into public.wd_tg_msgs (chat_id, msg_id, user_id, name, text, reply_to)
         values (g.chat_id, nullif(p->>'msg_id','')::bigint, uid, p->>'name', left(p->>'text', 1500), nullif(p->>'reply_to','')::bigint);
  end if;
  return jsonb_build_object('group', to_jsonb(g), 'person', to_jsonb(pr));
end; $$;
revoke all on function public.wd_tg_ingest(jsonb) from public, anon, authenticated;

-- Admin email'lariga ulangan Telegram chatlari (bildirishnoma va /admin uchun)
create or replace function public.wd_tg_admin_chats()
returns table(chat_id bigint) language sql stable security definer set search_path = public, auth as $$
  select c.chat_id from public.wd_tg_chats c join auth.users u on u.id = c.user_id
   where lower(u.email) in (select lower(x) from public.wd_tg_kv k, jsonb_array_elements_text(k.val) x where k.key = 'admins');
$$;
revoke all on function public.wd_tg_admin_chats() from public, anon, authenticated;

insert into public.wd_tg_kv(key, val) values ('bot_cfg', '{"dm":"all","approve_groups":true,"humor":1}'::jsonb)
on conflict (key) do nothing;
