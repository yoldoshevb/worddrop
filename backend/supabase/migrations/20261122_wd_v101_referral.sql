-- v101: Do'st taklif qilish (ikkalasiga 7 kun Pro) va botdagi daraja
alter table public.wd_tg_chats add column if not exists cefr text, add column if not exists ref_by uuid, add column if not exists ref_claimed boolean not null default false;
create table if not exists public.wd_referrals (
  id bigserial primary key,
  referrer uuid not null,
  invitee uuid not null unique,
  tg_chat bigint,
  days int not null default 7,
  created_at timestamptz not null default now()
);
alter table public.wd_referrals enable row level security;
drop policy if exists wd_referrals_own on public.wd_referrals;
create policy wd_referrals_own on public.wd_referrals for select to authenticated using (referrer = auth.uid() or invitee = auth.uid());
