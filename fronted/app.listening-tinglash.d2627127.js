
/* ========== LISTENING (TINGLASH) — bo'sh so'zni to'ldirish o'yini ==========
   Endi REAL audio (Supabase Storage) + real matn bilan ishlaydi.
   lesson.lines: har element {sp:"kim", t:boshlanish_sekundi, toks:[...]}.
   toks: matn bo'lagi = string, bo'sh so'z = {a:"javob", o:[variantlar]}.
   Audio o'ynaydi; bo'sh so'zli qatorga yetganda pauza qiladi, javobdan keyin davom etadi.
   maxTime — audioning shu soniyasidan keyin tugaydi (qolgani "qirqiladi"). */
const LISTEN_LESSON={
  title:"Formal Greetings",
  subtitle:"Dialogs for Everyday Use · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/dialogue_1-01_formal_greetings.mp3",
  startAt:6,
  maxTime:45,
  lines:[
    {sp:"JAMES", t:6.5, toks:["Good morning, Professor Austin, how are you doing?"]},
    {sp:"PROF. AUSTIN", t:10, toks:["Good morning, James. I am doing", {a:"well", o:["well","good","fine"]}, "and you?"]},
    {sp:"JAMES", t:14., toks:["I'm great, thank you. This is my friend Emma."]},
    {sp:"JAMES", t:17, toks:["She is thinking about", {a:"applying", o:["applying","apply","applied"]}, "to this college."]},
    {sp:"JAMES", t:21, toks:["She has a few questions. Would you mind telling us about the", {a:"process", o:["process","progress","promise"]}, "please?"]},
    {sp:"PROF. AUSTIN", t:26, toks:["Hello, Emma! It's a", {a:"pleasure", o:["pleasure","please","present"]}, "to meet you."]},
    {sp:"PROF. AUSTIN", t:29, toks:["I'm more than happy to speak with you. Please stop by my", {a:"office", o:["office","offer","officer"]}, "next week."]},
    {sp:"EMMA", t:36, toks:["It's a pleasure to meet you, professor. Thank you so", {a:"much", o:["much","many","more"]}, "for helping us."]},
    {sp:"PROF. AUSTIN", t:40, toks:["Don't mention it. Hopefully, I will be able to", {a:"answer", o:["answer","ask","answered"]}, "your questions!"]}
  ]
};
// Barcha tinglash darslari. Yangi dars qo'shish uchun shu massivga LESSONS[1]={...}, LESSONS[2]={...} tarzida qo'shing.
const LESSON_2={
  title:"Informal Greetings and Farewells",
  subtitle:"Dialogs for Everyday Use · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/dialogue_1-02_informal_greetings_and_farewells.mp3",
  startAt:6,
  maxTime:26,
  lines:[
    {sp:"JANE", t:6.5, toks:["Hi, Helen! How's it", {a:"going", o:["going","doing","coming"]}, "?"]},
    {sp:"HELEN", t:9, toks:["Fine, thanks — and you?"]},
    {sp:"JANE", t:11.5, toks:["Just fine. Where are you", {a:"off", o:["off","of","out"]}, "to?"]},
    {sp:"HELEN", t:14, toks:["To the library. I've got a history", {a:"exam", o:["exam","exit","example"]}, "next week"]},
    {sp:"HELEN", t:18, toks:["and need to start", {a:"studying", o:["studying","study","studied"]}, ". Ugh."]},
    {sp:"JANE", t:21, toks:["Oh, no. Well, I'll see you", {a:"later", o:["later","letter","ladder"]}, "then. Good luck!"]},
    {sp:"HELEN", t:24, toks:["Thanks. See you later."]}
  ]
};
const LESSON_3={
  title:"Formal Introductions",
  subtitle:"Dialogs for Everyday Use · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/dialogue_1-03_formal_introductions.mp3",
  startAt:6,
  maxTime:38,
  lines:[
    {sp:"MARGARET", t:7, toks:["Mr. Wilson, I'd like you to meet Dr. Edward Smith."]},
    {sp:"MR. WILSON", t:11, toks:["It's nice to meet you, Dr. Smith."]},
    {sp:"DR. SMITH", t:13, toks:[{a:"Pleasure", o:["Pleasure","Please","Pleasant"]}, "to meet you, too."]},
    {sp:"MARGARET", t:15, toks:["Dr. Smith is an", {a:"economist", o:["economist","economics","economy"]}, ". He just finished writing a book on international trade."]},
    {sp:"MR. WILSON", t:22, toks:["Oh? That's my", {a:"field", o:["field","feel","filled"]}, ", too. I work for the United Nations."]},
    {sp:"DR. SMITH", t:27, toks:["In the Development Program, by any", {a:"chance", o:["chance","change","chances"]}, "?"]},
    {sp:"MR. WILSON", t:32, toks:["Yes. How did you", {a:"guess", o:["guess","guest","guessed"]}, "?"]},
    {sp:"DR. SMITH", t:34, toks:["I've read your articles on technical", {a:"assistance", o:["assistance","assistants","resistance"]}, ". They're excellent."]}
  ]
};
/* 4-dars — intervyu (uzunroq, murakkabroq). Manba: U.S. Dept. of State.
   DIQQAT: t (vaqt) qiymatlari matn hajmiga qarab TAXMINIY hisoblangan.
   Audioni tinglab, kerak bo'lsa aniqlashtiring. */
const LESSON_4={
  title:"Interview with Sol",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/04_interview_sol_1.mp3",
  startAt:0,
  maxTime:124,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"SOL", t:3, toks:["Well, this week I've been focusing on trying to get my extracurriculars started, because the year has just started, and I'm trying to study and getting my",
      {a:"grades", o:["grades","grants","greats"]}, "up this year."]},
    {sp:"INTERVIEWER", t:11, toks:["What kind of extracurricular activities do you do?"]},
    {sp:"SOL", t:15, toks:["Oh, I've been doing speech and", {a:"debate", o:["debate","debut","deputy"]},
      ", and Battle of the Books, and soon Science Olympiad is going to get started and I'm going to be doing that. And in addition after school I also have a Jewish youth program that I do, and I help with the kids in Sunday school at Temple. I'm basically like a teacher's assistant."]},
    {sp:"INTERVIEWER", t:34, toks:["And what is Battle of the Books?"]},
    {sp:"SOL", t:36, toks:["Battle of the Books is a school club that is focused on a competition with a list of books that we get every year, and we compete on our",
      {a:"knowledge", o:["knowledge","college","knowing"]}, "of the books."]},
    {sp:"INTERVIEWER", t:43, toks:["What kind of books?"]},
    {sp:"SOL", t:45, toks:["Well, this year there are fifteen on the list, and I just started reading The Bell Jar by Sylvia Plath. And the list is mostly",
      {a:"fiction", o:["fiction","friction","fixing"]}, "but there is some nonfiction in there."]},
    {sp:"INTERVIEWER", t:53, toks:["And what is the Science Olympiad?"]},
    {sp:"SOL", t:56, toks:["Science Olympiad is a school club that is also geared to preparing towards a competition, but it's for a state science competition where we compete in",
      {a:"partners", o:["partners","patterns","parents"]}, "on different science events."]},
    {sp:"INTERVIEWER", t:68, toks:["What do you hope to do after high school?"]},
    {sp:"SOL", t:71, toks:["After high school I really hope to get a degree in",
      {a:"chemistry", o:["chemistry","symmetry","cemetery"]},
      "because that's what I'm really passionate about, and then probably go to medical school to focus on people and the brain, which I'm also really interested in, and I want to be a neurologist."]},
    {sp:"INTERVIEWER", t:85, toks:["Is there anything that you would like to say to kids in other countries?"]},
    {sp:"SOL", t:89, toks:["Uh, I don't know. I'm kind of a new English speaker. I've been here for six years so it's kind of",
      {a:"surreal", o:["surreal","serial","cereal"]}, "to talk to kids who are also learning English."]},
    {sp:"INTERVIEWER", t:96, toks:["What is your first language?"]},
    {sp:"SOL", t:99, toks:["My first language is Hebrew. I'm from Israel."]},
    {sp:"INTERVIEWER", t:101, toks:["How did you end up here?"]},
    {sp:"SOL", t:103, toks:["Well, my dad got a", {a:"transfer", o:["transfer","transport","transplant"]},
      "from work, and we all thought it would be a really good experience, and I have loved it so far and so has my whole family."]},
    {sp:"INTERVIEWER", t:108, toks:["So, is there anything you would like to say to kids in other countries?"]},
    {sp:"SOL", t:112, toks:["Well, first of all, \"Hi.\" And I guess a really good piece of",
      {a:"advice", o:["advice","advise","device"]},
      "is really go after what you love and work towards doing what you are passionate about."]}
  ]
};
/* 5-dars — intervyu (Alex). Manba: U.S. Dept. of State.
   DIQQAT: t (vaqt) qiymatlari TAXMINIY (matn hajmiga qarab hisoblangan).
   Audioni tinglab aniqlashtiring — ayniqsa maxTime ni. */
const LESSON_5={
  title:"Interview with Alex",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/07_interview_alex.mp3",
  startAt:0,
  maxTime:100,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"ALEX", t:3, toks:["Well, this week my", {a:"cousins", o:["cousins","cousin's","coasting"]},
      "came down from New York and we celebrated Thanksgiving at my house with the other side of the family that is in Charlotte. We had a turkey, and everybody brought something, like a",
      {a:"dessert", o:["dessert","desert","deserve"]},
      ", and we all just sat at the table and had fun. And afterward we played games."]},
    {sp:"INTERVIEWER", t:16, toks:["Are there any other foods that are Thanksgiving traditions for your family besides the turkey?"]},
    {sp:"ALEX", t:21, toks:["We always have my grandmother's broccoli and cheese casserole, which sounds",
      {a:"gross", o:["gross","grows","grass"]},
      "but it's really delicious. We had mashed potatoes and sweet potatoes. My mom made her amazing orange-cranberry relish, and this year we also had ham, which was",
      {a:"different", o:["different","difficult","deferred"]},
      ". We also had pecan pie and pumpkin cheesecake."]},
    {sp:"INTERVIEWER", t:38, toks:["What kind of games did you play?"]},
    {sp:"ALEX", t:41, toks:["Well, this year we played Wii basketball and tennis."]},
    {sp:"INTERVIEWER", t:45, toks:["Did you go shopping on Friday?"]},
    {sp:"ALEX", t:47, toks:["We went to Charlotte because it was my aunt's",
      {a:"birthday", o:["birthday","birdbath","breathing"]},
      ", so we hung out with them for a while and watched the football game between Auburn and Alabama. My mom went to a bookstore for a while, but we didn't do any other shopping."]},
    {sp:"INTERVIEWER", t:59, toks:["What have you been doing today?"]},
    {sp:"ALEX", t:62, toks:["Well, my dad and I went for a run together, and then we decided to stop and take a",
      {a:"break", o:["break","brake","brick"]},
      "here to get something to drink. It's a little cold outside."]},
    {sp:"INTERVIEWER", t:70, toks:["How far do you run?"]},
    {sp:"ALEX", t:72, toks:["Well, it'll be five", {a:"miles", o:["miles","mills","meals"]}, "after we run back home from here."]},
    {sp:"INTERVIEWER", t:76, toks:["Did you do anything else this week?"]},
    {sp:"ALEX", t:78, toks:["Well, I saw the new Harry Potter movie, which is very good, with a lot of my friends. Tonight I'll",
      {a:"babysit", o:["babysit","baby sit","busy seat"]},
      "my little brother and my sister so my parents can go see the Harry Potter movie together."]},
    {sp:"INTERVIEWER", t:88, toks:["Is there anything that you would like to say to kids in other countries?"]},
    {sp:"ALEX", t:91, toks:["Well, I don't know if we're that different or not, but it doesn't seem like we are. I would like to say, well, good",
      {a:"luck", o:["luck","lack","lock"]},
      "and have a good time with your life."]}
  ]
};
/* 6-dars — intervyu (Michael). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 1:00). */
const LESSON_6={
  title:"Interview with Michael",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/05_interview_michael.mp3",
  startAt:0,
  maxTime:60,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"MICHAEL", t:2, toks:["I've been going to school and playing",
      {a:"outside", o:["outside","outsized","upside"]}, "with friends, mostly."]},
    {sp:"INTERVIEWER", t:4, toks:["What are you doing in school?"]},
    {sp:"MICHAEL", t:6, toks:["We just finished our end-of-grade",
      {a:"tests", o:["tests","texts","taxes"]}, ". School ends in two weeks."]},
    {sp:"INTERVIEWER", t:10, toks:["What do you play when you play with friends?"]},
    {sp:"MICHAEL", t:12, toks:["I play football, soccer, basketball with the guys in the neighborhood. We play at Evan's house. He has a basketball",
      {a:"hoop", o:["hoop","hope","hop"]}, "in his yard."]},
    {sp:"INTERVIEWER", t:18, toks:["And I see a fishing pole in your hands."]},
    {sp:"MICHAEL", t:20, toks:["Yeah, I like to go to the",
      {a:"pond", o:["pond","pound","pawn"]},
      "and fish. I normally go about once a week. I usually catch a few. Today I",
      {a:"hooked", o:["hooked","booked","looked"]},
      "five, but they all got off. But I did catch two. It really keeps you going. It makes you think, \"I really want to catch that fish.\" My dad loves to fish, so he",
      {a:"taught", o:["taught","thought","fought"]}, "me."]},
    {sp:"INTERVIEWER", t:35, toks:["I don't think you've always lived in this neighborhood. Is that right?"]},
    {sp:"MICHAEL", t:39, toks:["Yeah. We lived in Switzerland for two years. I liked it, but I like it here more. There's more",
      {a:"stuff", o:["stuff","staff","stiff"]}, "to do here, more entertainment. But it was fun in Switzerland."]},
    {sp:"INTERVIEWER", t:47, toks:["Did you learn a new language in Switzerland?"]},
    {sp:"MICHAEL", t:49, toks:["I already knew Swiss German because my mom was from Switzerland. I",
      {a:"learned", o:["learned","earned","leaned"]}, "it when I was three or four."]},
    {sp:"INTERVIEWER", t:54, toks:["Is there anything that you would like to say to kids in other countries?"]},
    {sp:"MICHAEL", t:57, toks:["Um. Hello from America!"]}
  ]
};
/* 7-dars — guruh intervyusi (4 do'st). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 1:16). */
const LESSON_7={
  title:"Four Friends",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/interview_four_friends.mp3",
  startAt:0,
  maxTime:76,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"ASIM", t:2, toks:["After school today, we came to the park. Two of us were playing",
      {a:"baseball", o:["baseball","basketball","baseline"]}, ", and two of us walked around making videos."]},
    {sp:"INTERVIEWER", t:7, toks:["Why are you making videos?"]},
    {sp:"ALEX", t:9, toks:["Because it's fun, something to kill time. We put them on YouTube."]},
    {sp:"INTERVIEWER", t:12, toks:["What are you doing in school this week?"]},
    {sp:"MAHMOUD", t:15, toks:["CST preparation. That's California Standardized Testing. Everyone in second through eleventh",
      {a:"grade", o:["grade","great","greet"]},
      "takes the test. It helps",
      {a:"decide", o:["decide","design","deciding"]},
      "what classes you get to take next year. The preparation helps us get ready for the test."]},
    {sp:"INTERVIEWER", t:26, toks:["What do you do on weekends?"]},
    {sp:"DES", t:28, toks:["Go to the mall."]},
    {sp:"ALEX", t:29, toks:["Buy clothes."]},
    {sp:"ASIM", t:31, toks:["I play video games. I go on the",
      {a:"computer", o:["computer","commuter","compute"]},
      "a little. Sometimes I hang with my brother, or I hang out with my friends."]},
    {sp:"INTERVIEWER", t:37, toks:["How do you get money to buy clothes?"]},
    {sp:"DES", t:39, toks:["From Mom."]},
    {sp:"ASIM", t:40, toks:["I have a job",
      {a:"painting", o:["painting","pointing","panting"]},
      ". I paint houses on weekends with my uncles, and when I get money, I use it to buy clothes."]},
    {sp:"ALEX", t:45, toks:["I work at East Oakland Regional Park. We go and paint benches, pull up",
      {a:"weeds", o:["weeds","weeks","wheels"]},
      ", make the park",
      {a:"cleaner", o:["cleaner","clearer","climber"]},
      ". I get money, and then I buy clothes, or food (I'm a junk food junkie), or I might take these friends to the movies."]},
    {sp:"INTERVIEWER", t:60, toks:["Is there anything you want to say to kids in other countries?"]},
    {sp:"DES", t:63, toks:["Stay safe."]},
    {sp:"ALEX", t:65, toks:["Have as much fun as possible. Learn to turf. (It's a kind of dance.)"]},
    {sp:"ASIM", t:68, toks:["Hmm. Don't go to the bad stuff, like drugs or alcohol — or",
      {a:"war", o:["war","wore","wall"]}, "."]},
    {sp:"MAHMOUD", t:74, toks:[{a:"Admire", o:["Admire","Advise","Admit"]}, "the little things."]}
  ]
};
/* 8-dars — intervyu (Bianca). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 2:15). Eng uzun dars. */
const LESSON_8={
  title:"Interview with Bianca",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/02_interview_bianca.mp3",
  startAt:0,
  maxTime:135,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"BIANCA", t:2, toks:["Well, this week I started with having a day off on Monday, but I've been doing a lot of",
      {a:"calculus", o:["calculus","calculate","callous"]},
      "homework the entire week. I was lucky enough to go to a conference today, on women's philanthropy, and I was so excited to meet a lot of people who are involved in supporting many philanthropies which deal with feeding the hungry in my area."]},
    {sp:"INTERVIEWER", t:20, toks:["Why did you get to go to the conference?"]},
    {sp:"BIANCA", t:23, toks:["I got to go to the conference because I am on the service council at my school, and I was one of the ten in the",
      {a:"county", o:["county","country","country's"]},
      "who was invited. I was able to meet Barbara Bush's",
      {a:"granddaughter", o:["granddaughter","grandmother","grandfather"]},
      ", and she was speaking about her charity that she has had for about ten years, which is called FEED, which basically feeds hungry children in America as well as around the world."]},
    {sp:"INTERVIEWER", t:42, toks:["What does the service council do?"]},
    {sp:"BIANCA", t:43, toks:["What the service council does is try to get my school",
      {a:"united", o:["united","invited","untied"]},
      "in doing service projects or raising money for local food banks. We also put together Christmas care packages for abused as well as neglected children."]},
    {sp:"INTERVIEWER", t:57, toks:["What did you do for the Labor Day holiday?"]},
    {sp:"BIANCA", t:60, toks:["For the Labor Day holiday, I was doing a lot of",
      {a:"studying", o:["studying","stunning","standing"]},
      "to get ready for my calculus and Spanish class. But we also had a barbecue for dinner and we ate as a family, which is something we always do on holidays and long weekends."]},
    {sp:"INTERVIEWER", t:72, toks:["Can you tell me a little bit about your family?"]},
    {sp:"BIANCA", t:75, toks:["My parents came to America from India, and they met in",
      {a:"college", o:["college","colleague","collage"]},
      ". My grandmother is Portuguese, and I am very close to her. I also have a younger sister, named Capri, and she is fifteen years old."]},
    {sp:"INTERVIEWER", t:86, toks:["Does your family have any special traditions?"]},
    {sp:"BIANCA", t:89, toks:["Yes, we have lots of special traditions, and they are really all important to me. I grew up cooking with my grandmother and my mother, so",
      {a:"baking", o:["baking","backing","banking"]},
      "cookies for Christmas is a huge tradition. We love Italian food, grilled chicken, and salads."]},
    {sp:"INTERVIEWER", t:103, toks:["What do you want to do after high school?"]},
    {sp:"BIANCA", t:105, toks:["I would love to go to college and",
      {a:"pursue", o:["pursue","purchase","persuade"]},
      "my passions for Spanish, history, and business."]},
    {sp:"INTERVIEWER", t:110, toks:["Do you have an idea of a career you'd like to follow?"]},
    {sp:"BIANCA", t:113, toks:["I would love to somehow bring all of these passions together by doing a type of",
      {a:"corporate", o:["corporate","cooperate","coordinate"]},
      "job, but I'm not really quite sure yet."]},
    {sp:"INTERVIEWER", t:120, toks:["Is there anything that you would like to say to kids in other countries?"]},
    {sp:"BIANCA", t:124, toks:["I'm so excited to be able to talk to you guys and to share part of my culture with you guys. I hope one day to",
      {a:"travel", o:["travel","travelled","trouble"]},
      "to your countries and to learn a little bit more about how small the world really is."]}
  ]
};
/* 9-dars — intervyu (Nichole). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 1:22). */
const LESSON_9={
  title:"Interview with Nichole",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/19_interview_nichole.mp3",
  startAt:0,
  maxTime:82,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"NICHOLE", t:2, toks:["This has been a busy week. I have lots to tell. Monday I went to school and then I went to work Monday night. And Tuesday I went to school but only for half a day because I went on a",
      {a:"field", o:["field","filled","failed"]},
      "trip with my photography class to a local college to take pictures. And then on Wednesday I went to a baseball game for the whole class day because all of the students who made",
      {a:"honor", o:["honor","owner","under"]},
      "roll got to go on a baseball trip. And then Thursday I went to school and I went to work Thursday night. And then on Friday I went to school, and then Friday night I went to the big birthday dinner of one of my really",
      {a:"close", o:["close","clothes","closed"]},
      "friends. And today I'm here at this service project."]},
    {sp:"INTERVIEWER", t:40, toks:["What do you do when you go to work?"]},
    {sp:"NICHOLE", t:42, toks:["I'm the front desk secretary at a",
      {a:"counseling", o:["counseling","consulting","canceling"]}, "center."]},
    {sp:"INTERVIEWER", t:45, toks:["Are you graduating from high school?"]},
    {sp:"NICHOLE", t:47, toks:["I'm going to graduate this year."]},
    {sp:"INTERVIEWER", t:48, toks:["What will you do after that?"]},
    {sp:"NICHOLE", t:50, toks:["I'm planning on going to Appalachian State. I'm going to be a double major in photography and Spanish with a",
      {a:"minor", o:["minor","miner","manner"]}, "in social work."]},
    {sp:"INTERVIEWER", t:57, toks:["Why do you want to study these subjects?"]},
    {sp:"NICHOLE", t:59, toks:["Well, I guess these are the things I'm extremely",
      {a:"fond", o:["fond","found","fund"]},
      "of. I love photography, and helping the Hispanic community is what I'm really passionate about."]},
    {sp:"INTERVIEWER", t:66, toks:["Is there anything that you would like to say to kids in other countries?"]},
    {sp:"NICHOLE", t:70, toks:["Whoa, I don't know. I guess, always think the best of people. People are trying to be the best they can be. There is",
      {a:"hate", o:["hate","hat","heat"]},
      "in the world, but there is also a lot of love."]}
  ]
};
/* 10-dars — intervyu (Casey). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 1:55). */
const LESSON_10={
  title:"Interview with Casey",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/20_interview_casey.mp3",
  startAt:0,
  maxTime:115,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"CASEY", t:2, toks:["Well, this week I've been working on schoolwork and going to a swim class to get ready for a swimming",
      {a:"meet", o:["meet","meat","met"]}, "."]},
    {sp:"INTERVIEWER", t:7, toks:["What are you doing in school?"]},
    {sp:"CASEY", t:9, toks:["Oh, a lot of stuff. Math and",
      {a:"biology", o:["biology","biography","apology"]}, "and history, and I've been learning Italian."]},
    {sp:"INTERVIEWER", t:14, toks:["You're home schooled, aren't you? Tell me about it."]},
    {sp:"CASEY", t:18, toks:["I guess it's like going to public school, but the school is only a few",
      {a:"feet", o:["feet","feed","fit"]},
      "away and the teacher is your mother. My sisters and brother are my only classmates. I'm the only one in my grade. I kind of have to be",
      {a:"responsible", o:["responsible","responsive","respectable"]},
      "for getting my work done. We study and take required tests."]},
    {sp:"INTERVIEWER", t:34, toks:["What happens if you don't do well on a test?"]},
    {sp:"CASEY", t:37, toks:["I haven't ever done bad on a test. I guess if I didn't",
      {a:"pass", o:["pass","past","path"]}, "a test, I would get a talk from my mother."]},
    {sp:"INTERVIEWER", t:44, toks:["Have you been doing anything else?"]},
    {sp:"CASEY", t:46, toks:["I volunteer at Horse Power, which is a riding center. It's for kids with",
      {a:"disabilities", o:["disabilities","abilities","durabilities"]},
      "or who are in wheelchairs, so they can learn to ride horses. Sometimes I",
      {a:"lead", o:["lead","led","laid"]},
      "the horses, and sometimes I walk beside the horse and help the kids keep their",
      {a:"balance", o:["balance","balloons","ballots"]}, "and learn how to ride."]},
    {sp:"INTERVIEWER", t:64, toks:["What are you looking forward to this year?"]},
    {sp:"CASEY", t:67, toks:["I'm looking forward to going to Italy. That's why I've been studying Italian. So that when I get there, hopefully I'll know some stuff. My Girl Scout",
      {a:"troop", o:["troop","troupe","trip"]},
      "is going. There are",
      {a:"thirteen", o:["thirteen","thirty","thirsty"]},
      "girls going; my sister is going too. We thought it would be cool to go to a different country and see what they have there, like all the art and history over there. We have two adult leaders going with us."]},
    {sp:"INTERVIEWER", t:90, toks:["How are you getting money for the trip?"]},
    {sp:"CASEY", t:92, toks:["We've been working toward this for two years. We raise funds by selling flowers in the spring and fall and",
      {a:"wreaths", o:["wreaths","reeds","breathes"]},
      "at Christmas. We had a spaghetti dinner and car",
      {a:"washes", o:["washes","watches","wishes"]},
      ". And we sell Girl Scout cookies of course."]},
    {sp:"INTERVIEWER", t:106, toks:["Is there anything you'd like to say to kids in other countries?"]},
    {sp:"CASEY", t:109, toks:["I hope you are OK over there and having a good time. I hope you are doing good."]}
  ]
};
/* 11-dars — intervyu (Jacob). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 2:07). */
const LESSON_11={
  title:"Interview with Jacob",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/12_interview_jacob.mp3",
  startAt:0,
  maxTime:127,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"JACOB", t:2, toks:["I've been, sort of, preparing for finals, finishing up work, trying to balance the things I need to do with the things I should do. I need to do things like studying for a test now or getting in",
      {a:"assignments", o:["assignments","alignments","assessments"]},
      "that are past",
      {a:"due", o:["due","dew","do"]},
      ", and I should do things like exercising or catching up on things that will help me up ahead, on tests in the future. I've been trying to work on a big English assignment and prepare for finals. I stayed up all night trying to finish, as well as preparing for a performance on the",
      {a:"clarinet", o:["clarinet","cabinet","carbonate"]}, "."]},
    {sp:"INTERVIEWER", t:26, toks:["Have you been doing anything else?"]},
    {sp:"JACOB", t:29, toks:["I've been trying to get a basic",
      {a:"draft", o:["draft","drought","drift"]},
      "of a book I want to write. I feel like the essays you write at school are constricting. This is writing I enjoy doing. It helps me relax and wind down."]},
    {sp:"INTERVIEWER", t:39, toks:["What do you want to do after high school?"]},
    {sp:"JACOB", t:42, toks:["After high school I want to go to a university and get a",
      {a:"doctorate", o:["doctorate","directorate","doctor"]},
      "in some kind of science. Right now I'm aiming for entomology, the study of",
      {a:"insects", o:["insects","inspects","aspects"]},
      ", especially ants. That's my passion. I'm really interested in the complex societies they form and how they work together. If you want to get me talking, ask me about ants. They have really complex and diverse societies. They are the most complex of all animal societies. It's ants, not elephants or",
      {a:"primates", o:["primates","pirates","privates"]}, "or monkeys, that are the closest to human societies."]},
    {sp:"INTERVIEWER", t:72, toks:["I know that when you were small, you had serious health problems. Your parents had to take you to the hospital really fast many times. Is that still true?"]},
    {sp:"JACOB", t:82, toks:["I still have health issues. I have allergy-induced asthma. That means I have allergies that sometimes make it very difficult to",
      {a:"breathe", o:["breathe","breath","bread"]},
      ". It limits me from doing activities or going places sometimes. It's just a part of my life. I live with it."]},
    {sp:"INTERVIEWER", t:96, toks:["Are you doing anything for Martin Luther King Day?"]},
    {sp:"JACOB", t:98, toks:["I'm probably going to study with a friend because I have finals right away. We had a powerful",
      {a:"assembly", o:["assembly","assembling","ensemble"]},
      "program at school. The African-American student community group gave a serious eye-opener on how bad it was at that time period. A lot of people were",
      {a:"disturbed", o:["disturbed","distributed","disturbing"]}, "by it."]},
    {sp:"INTERVIEWER", t:114, toks:["Is there anything that you would like to say to kids in other countries?"]},
    {sp:"JACOB", t:118, toks:["Hmm. In the end, we're all human. It's good to have an",
      {a:"identity", o:["identity","identify","entity"]},
      "and celebrate your history, but in the end, we're all human."]}
  ]
};
/* 12-dars — intervyu (Gordon). Manba: U.S. Dept. of State.
   Vaqtlar audio bo'yicha o'lchangan (davomiylik 1:25). */
const LESSON_12={
  title:"Interview with Gordon",
  subtitle:"Student Life · U.S. Dept. of State",
  audioUrl:"https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/11_interview_gordon.mp3",
  startAt:0,
  maxTime:85,
  lines:[
    {sp:"INTERVIEWER", t:0, toks:["What have you been doing this week?"]},
    {sp:"GORDON", t:2, toks:["Let me think. I go to school. I had",
      {a:"soccer", o:["soccer","sucker","soaker"]},
      "practice only once a week 'cause it's",
      {a:"winter", o:["winter","winner","wonder"]},
      ". I went to see the Trans-Siberian Orchestra. They come to town every year. They're really good."]},
    {sp:"INTERVIEWER", t:12, toks:["What kind of music do they do?"]},
    {sp:"GORDON", t:15, toks:["It's like rock, but it's like Christmas too sort of. It's a really good show. They've got",
      {a:"lasers", o:["lasers","losers","leisure"]},
      "and pyrotechnics. I also went to church and",
      {a:"choir", o:["choir","quiet","career"]},
      "practice. I do the sound board most of the time."]},
    {sp:"INTERVIEWER", t:25, toks:["What are you studying in school?"]},
    {sp:"GORDON", t:27, toks:["I'm taking pre-calculus, AP European history, band, English, French, chemistry, and",
      {a:"environmental", o:["environmental","experimental","elemental"]}, "science."]},
    {sp:"INTERVIEWER", t:38, toks:["What instrument do you play in band?"]},
    {sp:"GORDON", t:40, toks:["I play the",
      {a:"bassoon", o:["bassoon","balloon","baboon"]},
      "for concert band. For marching band I play the",
      {a:"tuba", o:["tuba","tuber","tumor"]},
      ". They're completely different instruments. You can't march with a bassoon."]},
    {sp:"INTERVIEWER", t:47, toks:["What do you study in environmental science?"]},
    {sp:"GORDON", t:50, toks:["So far we've studied a lot about weather and weather",
      {a:"patterns", o:["patterns","partners","patients"]},
      ". We also learn about earthquakes and tornados and that sort of stuff."]},
    {sp:"INTERVIEWER", t:58, toks:["What will you do after high school?"]},
    {sp:"GORDON", t:60, toks:["I plan to go to",
      {a:"college", o:["college","collage","knowledge"]},
      ". I'm not sure what I'll go for yet. Probably something in science because I enjoy science."]},
    {sp:"INTERVIEWER", t:65, toks:["Is there anything that you'd like to say to kids in other countries?"]},
    {sp:"GORDON", t:70, toks:["Um. I think that a lot of the things that the rest of the world thinks about America, that they get in movies or on TV — from reality TV shows and things like that — don't really",
      {a:"portray", o:["portray","betray","protect"]},
      "American life. We're probably not that different from you."]}
  ]
};
const LESSONS=[LISTEN_LESSON, LESSON_2, LESSON_3, LESSON_4, LESSON_5, LESSON_6, LESSON_7, LESSON_8, LESSON_9, LESSON_10, LESSON_11, LESSON_12];
window.__wdLessons=LESSONS;
try{ if(typeof renderHome==='function') renderHome(); }catch(e){}
let LS=null;
function _shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function _esc(s){ try{return escapeHtml(s)}catch(e){return String(s)} }

function openListening(arg){
  let lesson, lessonIdx=-1;
  if(typeof arg==='number'){ lesson=LESSONS[arg]; lessonIdx=arg; }
  else if(arg && typeof arg==='object'){ lesson=arg; }
  else { lesson=LESSONS[0]; }
  if(!lesson){ if(typeof showToast==='function') showToast("Bu tinglash darsi tez orada qo'shiladi",IC.sound); return; }
  LS={ idx:-1, playing:false, started:false, awaiting:false, done:false, correct:0, wrong:0, locked:false, gaps:0, curLine:-1, curGap:-1, curTok:null,
       lesson, lessonIdx, useAudio:!!lesson.audioUrl, fake:(lesson.startAt||0), audio:null, loop:null };
  lesson.lines.forEach(ln=>ln.toks.forEach(t=>{ if(typeof t==='object'){ LS.gaps++; if(!t._opts) t._opts=_shuffle(t.o.slice()); } }));
  const ov=document.getElementById('listen-overlay');
  ov.classList.remove('playing');
  ov.innerHTML=`
    <audio id="loAudio" preload="auto" ${lesson.audioUrl?`src="${lesson.audioUrl}"`:''}></audio>
    <div class="lo-top">
      <button class="lo-back" id="loBack"><svg viewBox="0 0 24 24"><path d="M15 5 L8 12 L15 19"/></svg></button>
      <div class="lo-titles"><h3>${_esc(lesson.title)}</h3><p>${_esc(lesson.subtitle||'')}</p></div>
      <div class="lo-score"><svg viewBox="0 0 24 24"><path d="M13 3 L5 13 H11 L10 21 L18 10 H12 Z"/></svg><span id="loScore">0</span></div>
    </div>
    <div class="lo-cover"><div class="eq"><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="lo-transcript" id="loTranscript">${listenLinesHTML(lesson)}</div>
    <div class="lo-hint" id="loHint">Boshlash uchun ▶ tugmasini bosing</div>
    <div class="lo-options" id="loOptions"></div>
    <div class="lo-controls">
      <div class="lo-bar"><i id="loProg"></i></div>
      <button class="lo-play" id="loPlay">${_playSvg()}</button>
    </div>`;
  ov.hidden=false;
  try{ history.pushState({wdListen:1},''); }catch(e){}
  const audio=document.getElementById('loAudio');
  LS.audio=audio;
  if(audio){
    audio.addEventListener('error',()=>{ LS.useAudio=false; });
    audio.addEventListener('ended',()=>{
      // Audio tugadi — lekin oxirgi qatorda javob berilmagan bo'sh so'z bo'lsa, avval o'shani so'raymiz
      try{
        if(LS && !LS.done){
          let last=LS.idx;
          if(last<0) last=LS.lesson.lines.length-1;
          for(let i=LS.lesson.lines.length-1;i>=0;i--){ if(_hasPending(i)){ last=i; break; } }
          if(_hasPending(last)){ _pauseAndAsk(last); return; }
        }
      }catch(e){}
      finishListening();
    });
  }
  document.getElementById('loBack').addEventListener('click',_listenBack);
  document.getElementById('loPlay').addEventListener('click',toggleListenPlay);
}
function listenLinesHTML(lesson){
  return lesson.lines.map((ln,li)=>{
    let gi=0;
    const inner=ln.toks.map(t=>{
      if(typeof t==='string') return t.split(' ').filter(Boolean).map(w=>`<span>${_esc(w)}</span>`).join(' ');
      const id='g-'+li+'-'+(gi++);
      return `<span class="lo-gap" id="${id}"></span>`;
    }).join(' ');
    const sp=ln.sp?`<div class="lo-sp">${_esc(ln.sp)}</div>`:'';
    return `<div class="lo-lwrap" id="line-${li}">${sp}<div class="lo-line">${inner}</div></div>`;
  }).join('');
}
function _playSvg(){ return '<svg viewBox="0 0 24 24"><path d="M7 4 L20 12 L7 20 Z"/></svg>'; }
function _pauseSvg(){ return '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>'; }
function _setPlayIcon(p){ const b=document.getElementById('loPlay'); if(b) b.innerHTML=p?_pauseSvg():_playSvg(); }
function _setHint(t){ const h=document.getElementById('loHint'); if(h) h.textContent=t||''; }

function _startClock(){ if(LS.loop) return; LS.loop=setInterval(_tick,150); }
function _stopClock(){ if(LS && LS.loop){ clearInterval(LS.loop); LS.loop=null; } }
function _clock(){ return (LS.useAudio && LS.audio) ? LS.audio.currentTime : LS.fake; }

function toggleListenPlay(){
  if(!LS || LS.awaiting) return;               // bo'sh so'z kutilyapti — avval javob bering
  const ov=document.getElementById('listen-overlay');
  if(!LS.started){                             // birinchi bosish — boshlash (introni tashlab)
    LS.started=true; LS.playing=true; ov.classList.add('playing'); _setPlayIcon(true);
    if(LS.useAudio && LS.audio){ try{ LS.audio.currentTime=LS.lesson.startAt||0; }catch(e){} LS.audio.play().catch(()=>{ LS.useAudio=false; }); }
    _startClock(); return;
  }
  LS.playing=!LS.playing;
  ov.classList.toggle('playing',LS.playing); _setPlayIcon(LS.playing);
  if(LS.playing){ if(LS.useAudio && LS.audio) LS.audio.play().catch(()=>{ LS.useAudio=false; }); }
  else { if(LS.useAudio && LS.audio) LS.audio.pause(); }
}
function _tick(){
  if(!LS || !LS.playing) return;
  if(!LS.useAudio) LS.fake += 0.15;
  const ct=_clock();
  const prog=document.getElementById('loProg');
  if(prog && LS.lesson.maxTime) prog.style.width=Math.min(100,ct/LS.lesson.maxTime*100)+'%';
  if(LS.lesson.maxTime && ct>=LS.lesson.maxTime){
    // Oxirgi qatorda javob berilmagan bo'sh so'z bo'lsa — avval o'shani so'raymiz
    if(LS.idx>=0 && _hasPending(LS.idx)){ _pauseAndAsk(LS.idx); return; }
    finishListening(); return;
  }
  let idx=-1; const lines=LS.lesson.lines;
  for(let i=0;i<lines.length;i++){ if(ct>=lines[i].t) idx=i; }
  if(idx>=0 && idx!==LS.idx){
    const prev=LS.idx;
    LS.idx=idx; _markActiveLine(idx);
    // Bir vaqtning o'zida bir nechta qator o'tib ketgan bo'lsa ham, javob berilmagan
    // eng birinchi qatorni so'raymiz — hech bir bo'sh so'z tashlab ketilmasin.
    for(let p=Math.max(prev,0); p<idx; p++){
      if(_hasPending(p)){ _pauseAndAsk(p); break; }
    }
  }
}
/* Qatorda javob berilmagan bo'sh so'z bormi */
function _hasPending(i){
  const line=LS.lesson.lines[i]; if(!line) return false;
  return line.toks.some((t,ti)=> typeof t==='object' && !_gapFilled(i,_gapOrd(line,ti)));
}
/* Audioni to'xtatib, o'sha qatorning bo'sh so'zini so'raymiz */
function _pauseAndAsk(i){
  LS.playing=false; LS.awaiting=true;
  if(LS.useAudio && LS.audio) LS.audio.pause();
  const ov=document.getElementById('listen-overlay');
  if(ov) ov.classList.remove('playing');
  _setPlayIcon(false);
  _markActiveLine(i);
  _presentGap(i,_firstUnfilledOrd(i));
}
function _gapOrd(line,tokenIdx){ let o=-1; for(let i=0;i<=tokenIdx;i++){ if(typeof line.toks[i]==='object') o++; } return o; }
function _gapFilled(li,gi){ const el=document.getElementById('g-'+li+'-'+gi); return el && el.classList.contains('filled'); }
function _firstUnfilledOrd(i){ const line=LS.lesson.lines[i]; let ord=-1; for(let k=0;k<line.toks.length;k++){ if(typeof line.toks[k]==='object'){ ord++; if(!_gapFilled(i,ord)) return ord; } } return 0; }
function _markActiveLine(i){
  document.querySelectorAll('.lo-line').forEach((el,idx)=>{ el.classList.toggle('active',idx===i); el.classList.toggle('past',idx<i); });
  const el=document.getElementById('line-'+i); if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
}
function _presentGap(li,gapOrd){
  const line=LS.lesson.lines[li];
  const gapToks=line.toks.filter(t=>typeof t==='object');
  const tok=gapToks[gapOrd];
  LS.curLine=li; LS.curGap=gapOrd; LS.curTok=tok;
  document.querySelectorAll('.lo-gap.current').forEach(x=>x.classList.remove('current'));
  const el=document.getElementById('g-'+li+'-'+gapOrd); if(el) el.classList.add('current');
  const box=document.getElementById('loOptions');
  box.innerHTML=tok._opts.map(o=>`<button class="lo-opt" data-opt="${_esc(o)}">${_esc(o)}</button>`).join('');
  box.querySelectorAll('.lo-opt').forEach(b=>b.addEventListener('click',()=>_choose(b)));
  _setHint("Eshiting va to'g'ri so'zni tanlang");
}
function _advanceAfterGap(){
  const gapCount=LS.lesson.lines[LS.curLine].toks.filter(t=>typeof t==='object').length;
  if(LS.curGap+1<gapCount){ setTimeout(()=>_presentGap(LS.curLine,LS.curGap+1),450); return; }
  // qatordagi bo'sh so'zlar tugadi — audio davom etadi
  document.getElementById('loOptions').innerHTML=''; _setHint('');
  LS.awaiting=false;
  if(LS.done) return;
  // Javobdan keyin faol qatorni joriy (audio turgan) qatorga qaytaramiz —
  // aks holda intervyu beruvchi gapirganda ekranda oldingi qator katta bo'lib qolardi.
  if(LS.idx>=0) _markActiveLine(LS.idx);
  // Audio allaqachon tugagan bo'lsa (oxirgi bo'sh so'z shu yerda so'ralgan edi) — natijaga o'tamiz
  try{
    const a=LS.audio;
    if(LS.useAudio && a && (a.ended || (LS.lesson.maxTime && a.currentTime>=LS.lesson.maxTime-0.05))){
      if(!LS.lesson.lines.some((_,i)=>_hasPending(i))){ finishListening(); return; }
    }
  }catch(e){}
  LS.playing=true;
  const ov=document.getElementById('listen-overlay'); if(ov) ov.classList.add('playing'); _setPlayIcon(true);
  if(LS.useAudio && LS.audio) LS.audio.play().catch(()=>{ LS.useAudio=false; });
}
function _choose(btn){
  if(!LS || !LS.curTok || LS.locked) return;
  const val=btn.dataset.opt, tok=LS.curTok;
  const box=document.getElementById('loOptions');
  const el=document.getElementById('g-'+LS.curLine+'-'+LS.curGap);
  LS.locked=true;
  box.querySelectorAll('.lo-opt').forEach(b=>b.disabled=true);
  if(val===tok.a){
    btn.classList.add('correct');
    try{ SFX.play('correct'); }catch(e){}
    if(el){ el.textContent=tok.a; el.classList.remove('current'); el.classList.add('filled'); }
    LS.correct++;
    const sc=document.getElementById('loScore'); if(sc) sc.textContent=LS.correct;
    setTimeout(()=>{ LS.locked=false; _advanceAfterGap(); },320);
  } else {
    // Xato javob — halol hisoblanadi, to'g'risi ko'rsatiladi va davom etamiz
    btn.classList.add('wrong');
    try{ SFX.play('wrong'); }catch(e){}
    LS.wrong=(LS.wrong||0)+1;
    const right=box.querySelector(`.lo-opt[data-opt="${_esc(tok.a)}"]`);
    if(right) right.classList.add('correct');
    if(el){ el.textContent=tok.a; el.classList.remove('current'); el.classList.add('filled','missed'); }
    _setHint(`To'g'ri javob: ${_esc(tok.a)}`);
    setTimeout(()=>{ LS.locked=false; _advanceAfterGap(); },1150);
  }
}
function finishListening(){
  if(!LS || LS.done) return;
  LS.done=true; LS.playing=false; _stopClock();
  if(LS.audio){ try{ LS.audio.pause(); }catch(e){} }
  const title=LS.lesson.title;
  const total=LS.gaps, correct=LS.correct, wrong=LS.wrong||0, pct=total?Math.round(correct/total*100):0;
  // Har dars uchun mukofot faqat 3 marta beriladi — aks holda takrorlab XP/tanga to'plash mumkin bo'lardi
  const key='L'+(LS.lessonIdx==null?-1:LS.lessonIdx);
  const paid=(window.__wdListenPaid && window.__wdListenPaid[key])||0;
  const rewarded = paid<3;
  const xp = rewarded ? correct*8 : 0;
  const coins = rewarded ? (pct>=90?12 : pct>=60?8 : pct>=30?4 : 0) : 0;
  const gotTitle = pct>=60 && !(window.__wdAch && window.__wdAch.has('listener'));
  const leftAfter = Math.max(0, 3-(paid+(rewarded?1:0)));
  try{ if(window.__wdDailyProgress) window.__wdDailyProgress('listen'); }catch(e){}  // kunlik: tinglash mashqi bajarildi
  const ov=document.getElementById('listen-overlay');
  ov.classList.remove('playing');
  ov.innerHTML=`
    <div class="lo-top"><button class="lo-back" id="loBack2"><svg viewBox="0 0 24 24"><path d="M15 5 L8 12 L15 19"/></svg></button><div class="lo-titles"><h3>Natija</h3></div></div>
    <div class="lo-results">
      <div class="lo-ring">
        <svg viewBox="0 0 120 120" width="132" height="132">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="11"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="${pct>=60?'#34D399':'#FBBF24'}" stroke-width="11"
            stroke-linecap="round" stroke-dasharray="${(pct/100*326.7).toFixed(1)} 326.7"/>
        </svg>
        <div class="pv"><b>${pct}%</b><i>ANIQLIK</i></div>
      </div>
      <div class="lo-res-title">${pct>=90?'Zo\'r natija!':pct>=60?'Ajoyib!':'Yaxshi urinish!'}</div>
      <div class="lo-res-sub">${_esc(title)}</div>
      <div class="lo-grid">
        <div class="lo-cell"><b style="color:#34D399">${correct}</b><span>To'g'ri</span></div>
        <div class="lo-cell"><b style="color:${wrong?'#FB7185':'rgba(255,255,255,.5)'}">${wrong}</b><span>Xato</span></div>
        <div class="lo-cell"><b style="color:#FCD34D">+${xp}</b><span>XP</span></div>
        <div class="lo-cell"><b style="color:#F0B429">+${coins}</b><span>WordCoin</span></div>
      </div>
      <div class="lo-res-note">${rewarded
        ? (leftAfter>0 ? `Bu dars uchun mukofot yana ${leftAfter} marta beriladi` : 'Bu dars uchun mukofot limiti tugadi')
        : 'Mukofot limiti tugagan — dars mashq uchun ochiq'}</div>
      ${gotTitle?`<div class="lo-titul"><svg viewBox="0 0 24 24" fill="none" stroke="#FCD34D" stroke-width="2" stroke-linecap="round"><path d="M5 14v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="13" width="4" height="7" rx="1.8" fill="#FCD34D" stroke="none"/><rect x="17" y="13" width="4" height="7" rx="1.8" fill="#FCD34D" stroke="none"/></svg>Yangi titul: Tinglovchi</div>`:''}
      <button class="lo-res-btn" id="loDone">Davom etish</button>
    </div>`;
  document.getElementById('loBack2').addEventListener('click',_listenBack);
  document.getElementById('loDone').addEventListener('click',_listenBack);
  if(xp>0 && typeof addXP==='function') addXP(xp);
  if(coins>0 && typeof addCoins==='function'){ try{ addCoins(coins,true); }catch(e){} }
  if(rewarded){
    if(!window.__wdListenPaid) window.__wdListenPaid={};
    window.__wdListenPaid[key]=paid+1;
  }
  if(pct>=60 && typeof fireConfetti==='function') fireConfetti();
  // Titul endi haqiqiy yutuq sifatida beriladi (avval faqat yozuv chiqardi, yutuq berilmasdi)
  if(pct>=60 && typeof unlockAch==='function'){ try{ unlockAch('listener'); }catch(e){} }
  if(typeof saveState==='function') saveState();
}
function closeListening(){
  const ov=document.getElementById('listen-overlay');
  if(!ov || ov.hidden) return;
  if(LS){ _stopClock(); LS.playing=false; if(LS.audio){ try{ LS.audio.pause(); }catch(e){} } }
  ov.classList.remove('playing');
  ov.hidden=true; ov.innerHTML='';
  LS=null;
}
function _listenBack(){ if(history.state && history.state.wdListen){ try{history.back();}catch(e){closeListening();} } else { closeListening(); } }
window.__wdOpenListening=openListening;
window.__wdCloseListening=closeListening;
