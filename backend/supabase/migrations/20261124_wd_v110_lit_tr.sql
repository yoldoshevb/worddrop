-- v110: Adabiyot — xatboshilarni talab bo'yicha o'zbekchaga tarjima qilish keshi
create table if not exists public.wd_lit_tr(
  work_id text not null references public.wd_lit_works(id) on delete cascade,
  idx int not null, i int not null,
  uz text not null,
  created_at timestamptz not null default now(),
  primary key(work_id, idx, i)
);
create table if not exists public.wd_lit_tr_use(
  user_key text not null, day date not null default current_date, n int not null default 0,
  primary key(user_key, day)
);
alter table public.wd_lit_tr enable row level security;
alter table public.wd_lit_tr_use enable row level security;
-- faqat service_role (lit-tr edge function) o'qiydi/yozadi; mijozlarga siyosat yo'q
alter table public.wd_lit_tr add column if not exists h text not null default '';
