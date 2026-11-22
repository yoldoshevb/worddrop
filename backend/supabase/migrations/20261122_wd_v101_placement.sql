-- v101: Daraja (placement) testi — savollar banki va natijalar
create table if not exists public.wd_placement_items (
  id serial primary key,
  level text not null check (level in ('A1','A2','B1','B2','C1')),
  kind text not null,
  q text not null,
  opts jsonb not null,
  a int not null,
  active boolean not null default true
);
alter table public.wd_placement_items enable row level security;
drop policy if exists wd_placement_items_read on public.wd_placement_items;
create policy wd_placement_items_read on public.wd_placement_items for select to anon, authenticated using (active);

create table if not exists public.wd_placement (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  tg_user bigint,
  level text not null,
  score numeric,
  answers int,
  source text not null default 'app',
  created_at timestamptz not null default now()
);
create index if not exists wd_placement_user on public.wd_placement(user_id, created_at desc);
alter table public.wd_placement enable row level security;
drop policy if exists wd_placement_own on public.wd_placement;
create policy wd_placement_own on public.wd_placement for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bot natijasini ilova holatiga yozish (service role chaqiradi)
create or replace function public.wd_set_cefr(uid uuid, lvl text) returns void
language sql security definer set search_path = public as $$
  update public.wd_state set state = coalesce(state,'{}'::jsonb) || jsonb_build_object('cefr', lvl, 'placed', now()::text),
    saved_at = (extract(epoch from now())*1000)::bigint, updated_at = now()
  where user_id = uid;
$$;
revoke all on function public.wd_set_cefr(uuid, text) from public, anon, authenticated;

truncate public.wd_placement_items restart identity;
insert into public.wd_placement_items(level, kind, q, opts, a) values
('A1','grammar','My brother ___ a doctor.','["is", "are", "am", "be"]'::jsonb,0),
('A1','grammar','___ you like tea?','["Does", "Do", "Are", "Is"]'::jsonb,1),
('A1','grammar','There ___ two cats in the garden.','["is", "be", "are", "am"]'::jsonb,2),
('A1','grammar','She ___ to school every day.','["go", "goes", "going", "gone"]'::jsonb,1),
('A1','grammar','I have ___ apple and a banana.','["a", "an", "the", "some"]'::jsonb,1),
('A1','grammar','We ___ at home yesterday.','["are", "was", "were", "is"]'::jsonb,2),
('A1','vocab','Choose the opposite of "cold".','["hot", "wet", "old", "new"]'::jsonb,0),
('A1','vocab','You sleep in a ___.','["kitchen", "bed", "bus", "shop"]'::jsonb,1),
('A1','vocab','"Kitob" in English is…','["pen", "book", "bag", "desk"]'::jsonb,1),
('A1','vocab','The day after Monday is…','["Sunday", "Wednesday", "Tuesday", "Friday"]'::jsonb,2),
('A1','reading','"Anna is ten. Her sister Lola is six." Who is older?','["Lola", "Anna", "They are the same age", "We don''t know"]'::jsonb,1),
('A1','reading','Sign: "CLOSED ON SUNDAYS". When can''t you visit?','["Monday", "Saturday", "Sunday", "Every day"]'::jsonb,2),
('A2','grammar','I ___ TV when you called me.','["watched", "was watching", "am watching", "watch"]'::jsonb,1),
('A2','grammar','This bag is ___ than that one.','["more cheap", "cheapest", "cheaper", "the cheaper"]'::jsonb,2),
('A2','grammar','We ___ to the cinema tomorrow evening.','["go", "are going", "went", "have gone"]'::jsonb,1),
('A2','grammar','How ___ sugar do you need?','["many", "much", "lot", "few"]'::jsonb,1),
('A2','grammar','You ___ smoke here. It''s not allowed.','["mustn''t", "don''t have to", "needn''t", "can"]'::jsonb,0),
('A2','grammar','He has lived here ___ 2019.','["for", "since", "from", "ago"]'::jsonb,1),
('A2','vocab','I need to ___ a table at the restaurant for Friday.','["book", "read", "write", "close"]'::jsonb,0),
('A2','vocab','The train was ___, so we waited for an hour.','["early", "late", "fast", "empty"]'::jsonb,1),
('A2','vocab','Can you ___ me your pen for a minute?','["borrow", "lend", "take", "keep"]'::jsonb,1),
('A2','vocab','A person who works in a hospital and helps doctors is a…','["nurse", "pilot", "waiter", "farmer"]'::jsonb,0),
('A2','reading','"Bus 12 leaves every 20 minutes from 7 am. The first bus on Sunday is at 9 am." On Sunday the first bus is at…','["7 am", "7:20 am", "9 am", "9:20 am"]'::jsonb,2),
('A2','reading','"Sorry, I can''t come to your party. I have to look after my little brother." Why can''t the writer come?','["She is ill", "She is busy at work", "She has to take care of her brother", "She doesn''t like parties"]'::jsonb,2),
('B1','grammar','If I ___ more time, I would learn Spanish.','["have", "had", "will have", "would have"]'::jsonb,1),
('B1','grammar','The letter ___ yesterday.','["was sent", "sent", "has sent", "is sending"]'::jsonb,0),
('B1','grammar','She asked me where I ___.','["live", "do live", "lived", "am living"]'::jsonb,2),
('B1','grammar','I''m not used to ___ up so early.','["get", "getting", "got", "be getting"]'::jsonb,1),
('B1','grammar','That''s the woman ___ son plays for the national team.','["who", "whose", "which", "whom"]'::jsonb,1),
('B1','grammar','By the time we arrived, the film ___.','["already started", "has already started", "had already started", "was already starting"]'::jsonb,2),
('B1','vocab','I can''t ___ with all this noise — I need to concentrate.','["put up", "work out", "get on", "take off"]'::jsonb,0),
('B1','vocab','The company decided to ___ the meeting until next week.','["put off", "put on", "take up", "bring up"]'::jsonb,0),
('B1','vocab','She was very ___ of her son''s exam results.','["proud", "jealous", "ashamed", "afraid"]'::jsonb,0),
('B1','vocab','Choose the word closest in meaning to "purchase".','["sell", "buy", "return", "order"]'::jsonb,1),
('B1','reading','"Although the hotel was cheap, the rooms were clean and the staff were helpful. Our only complaint was the noise from the street." What did the writer dislike?','["The price", "The staff", "The noise", "The rooms"]'::jsonb,2),
('B1','reading','"Applicants must have at least two years'' experience. Knowledge of Russian is an advantage but not essential." Which is true?','["Russian is required", "Experience is not necessary", "Russian is helpful but optional", "Only Russian speakers can apply"]'::jsonb,2),
('B2','grammar','If she had left earlier, she ___ the train.','["would catch", "would have caught", "will catch", "had caught"]'::jsonb,1),
('B2','grammar','Hardly ___ the house when it started to rain.','["I had left", "had I left", "I left", "did I leave"]'::jsonb,1),
('B2','grammar','He denied ___ the window.','["to break", "break", "breaking", "to have break"]'::jsonb,2),
('B2','grammar','I wish I ___ so much yesterday — I feel terrible now.','["didn''t eat", "hadn''t eaten", "wouldn''t eat", "haven''t eaten"]'::jsonb,1),
('B2','grammar','The new bridge is said ___ the longest in the region.','["being", "to be", "that it is", "be"]'::jsonb,1),
('B2','grammar','___ the bad weather, the match went ahead.','["Although", "Despite", "However", "Even"]'::jsonb,1),
('B2','vocab','The government has introduced new measures to ___ unemployment.','["tackle", "handle with", "deal", "cope"]'::jsonb,0),
('B2','vocab','Her argument was so ___ that nobody could disagree.','["compelling", "compulsory", "complacent", "complimentary"]'::jsonb,0),
('B2','vocab','The results of the study were ___: some data supported the theory, some didn''t.','["conclusive", "inconclusive", "exclusive", "inclusive"]'::jsonb,1),
('B2','vocab','We need to ___ the pros and cons before making a decision.','["weigh up", "look up", "make up", "turn up"]'::jsonb,0),
('B2','reading','"Critics have praised the novel''s vivid characters, yet many readers find its slow pace frustrating." The writer suggests that the novel…','["is unpopular with critics", "has strengths and weaknesses", "is fast-moving", "has dull characters"]'::jsonb,1),
('B2','reading','"Contrary to popular belief, bats are not blind; many species see quite well, although they rely mainly on echolocation." What does the text claim?','["Bats cannot see", "Bats only use their eyes", "Many bats can see but mainly use sound", "Few people know about echolocation"]'::jsonb,2),
('C1','grammar','Not until the results were published ___ how serious the problem was.','["we realised", "did we realise", "we did realise", "had we realised it"]'::jsonb,1),
('C1','grammar','Were it not for your help, I ___ the deadline.','["would miss", "would have missed", "had missed", "will miss"]'::jsonb,1),
('C1','grammar','She is believed ___ the country several years ago.','["to leave", "to have left", "having left", "that she left"]'::jsonb,1),
('C1','grammar','___ as it may seem, the plan actually worked.','["Strange", "Strangely", "However strange", "Although strange"]'::jsonb,0),
('C1','grammar','The proposal, ___ details remain unclear, will be discussed on Monday.','["whose", "which", "of which the", "that its"]'::jsonb,0),
('C1','vocab','The minister''s speech was full of ___ language that avoided any real commitment.','["evasive", "persuasive", "abrasive", "cohesive"]'::jsonb,0),
('C1','vocab','His ___ remarks offended several people at the meeting.','["tactful", "tactless", "tactical", "tangible"]'::jsonb,1),
('C1','vocab','The scandal seriously ___ public trust in the institution.','["undermined", "underlined", "undertook", "underwent"]'::jsonb,0),
('C1','vocab','Choose the word closest in meaning to "ubiquitous".','["rare", "everywhere", "ancient", "invisible"]'::jsonb,1),
('C1','vocab','The two theories are not ___ exclusive; both may be partly true.','["mutually", "merely", "marginally", "mainly"]'::jsonb,0),
('C1','reading','"The author''s optimism is tempered by an acknowledgement that technology alone cannot resolve deeply rooted social inequalities." The author believes technology…','["will solve inequality", "is irrelevant to inequality", "can help but is not a complete solution", "makes inequality worse"]'::jsonb,2),
('C1','reading','"While the policy was ostensibly designed to protect consumers, its main beneficiaries turned out to be the largest retailers." The writer implies the policy…','["achieved its stated aim", "mostly helped big retailers", "harmed large retailers", "was never introduced"]'::jsonb,1);
