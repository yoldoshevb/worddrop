-- v111: «So'z devori» (3D sinfxona) va «Shaxsiy xona» olib tashlandi.
-- Xona mehmonlari va mehmonlar kitobi jadvallari endi ishlatilmaydi.
drop table if exists public.wd_guestbook cascade;
drop table if exists public.wd_rooms cascade;
-- Storage: 'models' bucket (barcha .glb fayllar) va devor televizori videosi
-- wd-storage-clean edge function orqali Storage API bilan o'chirildi (bir martalik).
