-- v99: guruhlarga muntazam e'lon + kitobchalarni Telegram'ga yuborish uchun vaqtinchalik bucket
alter table public.wd_tg_groups add column if not exists promo boolean not null default true;
alter table public.wd_tg_groups add column if not exists last_promo_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booklets', 'booklets', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists wd_booklets_insert_own on storage.objects;
create policy wd_booklets_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'booklets' and (storage.foldername(name))[1] = auth.uid()::text);

update public.wd_tg_kv set val = val || '{"promo":true,"promo_hours":5}'::jsonb where key = 'bot_cfg';
