# WordDrop — Claude va ChatGPT hamkorlik kelishuvi

Sana: 2026-11-22. Tomonlar: Claude (Anthropic) va ChatGPT (OpenAI). Hakam va egasi: Bexruz Yo'ldoshev.

## 1. Mas'uliyat hududlari
| Hudud | Mas'ul |
|---|---|
| GitHub repo `yoldoshevb/worddrop` (`fronted/`, `backend/`, `tools/`, `docs/`) | Claude |
| Supabase: edge funksiyalar, migratsiyalar, jadvallar, RLS, Storage | Claude |
| Telegram bot (`tg-bot`, `tg-v101`) | Claude |
| Cloudflare Worker `worddrop-connector` (MCP / ChatGPT ilovasi, `worddrop-connector.yoldoshev.workers.dev/mcp`) | ChatGPT |
| Cloudflare D1 `worddrop-listening` (A2–B1 Listening mashg'ulot natijalari) | ChatGPT |
| Saytga oid Cloudflare resurslari: Pages loyihasi, `worddrop` va `worddrop-uz` Worker'lari, `worddrop-app.uz` domeni, DNS, marshrutlar | Hech kim Bexruz ruxsatisiz o'zgartirmaydi |

Boshqa tomon hududida o'zgarish kerak bo'lsa — avval Bexruz orqali kelishiladi.

## 2. Yagona manba qoidasi (sayt)
- Saytning yagona manbasi — GitHub `main`. Sayt faqat shu tarmoqdan joylanadi.
- Pages'ga lokal nusxadan to'g'ridan-to'g'ri yuklash (direct upload / `wrangler pages deploy`) qilinmaydi.
- Saytga tegishli tuzatish kerak bo'lsa: GitHub'ga push qilinadi, yoki o'zgarish (diff) Bexruz orqali Claude'ga yuboriladi.
- Fayl nomlari versiyalanadi: `.js`, `.css` va `.mp3` 1 yilga «immutable» keshlanadi. Mazmun o'zgarsa, nom ham o'zgaradi (`ml.v101d.js` → `ml.v101e.js`, `app.<nom>.<xesh>.js`).

## 3. Umumiy resurslar
- **`word_translations`** — connector `en`, `uz`, `pos`, `ipa`, `def`, `ex`, `level` ustunlarini `verified=true` bilan o'qiydi. Claude bu ustunlarni o'zgartirishdan oldin xabar beradi.
- **`word_phrasal_verbs`** — connector `en`, `uz`, `meanings`, `examples`, `level` ustunlarini `verified=true` bilan o'qiydi. Xuddi shu qoida.
- **Supabase `audio` papkasi** — connector undagi ochiq MP3 manzillardan foydalanadi. Claude o'chirmaydi va nomlarini o'zgartirmaydi.
- **Kalitlar:**
  - connector faqat Supabase publishable kaliti bilan, faqat o'qiydi;
  - `service_role` kaliti Worker'ga qo'yilmaydi;
  - foydalanuvchi ma'lumoti kerak bo'lsa — foydalanuvchi tokeni va RLS orqali, oldindan kelishib.
- **Groq API** — bitta akkaunt va umumiy limitlar (TTS kuniga ~3 600 token). Connector Groq ishlatishidan oldin kelishiladi.

## 4. Ish tartibi
1. Ish boshida:
   - `git fetch` + `git status`, lokal va `origin/main` farqi tekshiriladi;
   - tegiladigan resursning joriy holati (Cloudflare versiyasi, Supabase funksiya versiyasi) tekshiriladi.
2. Har o'zgarishdan keyin quyidagi bo'limdagi jurnalga yozuv qo'shiladi: sana, kim, nima o'zgardi, qayerga chiqdi, versiya.
3. Ziddiyat bo'lsa, hech kim boshqasining ishini ustidan yozmaydi. Qarorni Bexruz qabul qiladi.

## 5. Hal qilingan masala (2026-11-23)
- Holat:
  - ChatGPT Multilevel audio tuzatishini (6e8d064) Pages'ga lokal nusxadan qo'lda chiqargan edi;
  - GitHub `main` esa 735cbde da qolgan edi;
  - Pages GitHub'ga ulangan (production: `main`, avtomatik deploy, chiqish papkasi: `fronted/`).
- Hal qilinishi:
  - ChatGPT to'rtta patchni Bexruz orqali yubordi.
  - Claude ularni `git am --3way` bilan 735cbde ustiga qo'lladi, muallifligi saqlandi:
    - 8abf46a — Multilevel audio tuzatishi;
    - 2251aa3, 83f6480, e681e51 — `backend/connector/`.
  - `fronted/app.html` va `fronted/ml.v101d.js` jonli sayt bilan baytma-bayt bir xil.
  - Claude'ning ishchi nusxasi (monolit `app.html`) ham shu holatga keltirildi.
- Natija: GitHub `main` = jonli sayt. Bundan keyin sayt faqat `main` dan joylanadi (2-band).

## 6. Roziliklar
- **Claude:** roziman (2026-11-22).
- **ChatGPT:** roziman (2026-11-22). ChatGPT so'zlari, qisqacha: «Mening mas'uliyatim — `worddrop-connector` Worker va `worddrop-listening` D1. Saytga oid Cloudflare resurslari, GitHub, Supabase va Telegram botdagi o'zgarishlar uchun avval Bexruz orqali kelishaman. Supabase'dan hozircha faqat o'qish kerak; `service_role` kalitini Worker'ga joylamayman. Domen bo'yicha o'zgarish so'ramayman. Groq kerak bo'lsa, avval kelishamiz. Ish boshlashdan oldin `main` va Cloudflare'dagi joriy versiyani tekshiraman. Ziddiyat chiqsa, qarorni Bexruzga qoldiramiz.»

## 7. O'zgarishlar jurnali
| Sana | Kim | Nima | Qayerga | Versiya |
|---|---|---|---|---|
| 2026-11-22 | Claude | Multilevel, daraja testi, taklif, statistika, app.html bo'linishi | GitHub, Supabase | 08f547e…735cbde |
| 2026-11-22 | ChatGPT | `worddrop-connector` (MCP) va `worddrop-listening` D1 | Cloudflare | connector 0.3.0 |
| 2026-11-22 | ChatGPT | Multilevel audio tuzatishi | Pages (direct upload) | 6e8d064 |
| 2026-11-23 | Claude | ChatGPT patchlari `main` ga qo'llandi; `docs/HAMKORLIK.md` | GitHub → Pages (avtomatik) | 8abf46a…e681e51 + shu commit |
| 2026-11-23 | Claude | Multilevel #2 va #3 uchun Kokoro MP3 (62 yozuv); `ml-exam` v5: mavzular takrorlanmaydi, segment 900 belgi | GitHub → Pages, Supabase | shu commit |
| 2026-11-23 | Claude | Splash v102: haqiqiy yuklanishga bog'langan, foydalanuvchi so'zlari, qorong'i rejim; head kutubxonalari defer | GitHub → Pages | shu commit |
| 2026-11-23 | Claude | Splash v103–v104: silliq kompozitor motion, sintez ovoz, vinetkasiz fon; Telegram SDK erta ulanib `ready()` darhol chaqiriladi | GitHub → Pages | shu commit |
| 2026-11-24 | Claude | v105: taklif — 3 do'st = 7 kun Pro (tg-v101 v3); Multilevel chuqur tahlil (ml.v105.js); Pro oynasi yangi dizayn | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v105b: Multilevel — Pro; bepul hisobga bitta cheklangan urinish (wd_ml_free, ml-exam v6, RLS), ml.v105b.js | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v106: Pro promokodlari — wd_promo_codes/uses, admin oynasi, ilova (Pro oynasi, promokod oynasi) va bot (/promo, tugma, start=promo_KOD), tg-v101 v5 | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v106: kompyuter uchun maxsus kursor (cursor.v106.js) — ilova va landing | GitHub → Pages | shu commit |
| 2026-11-24 | Claude | v107: kompyuterda sichqoncha g'ildiragi chetdagi bo'sh joylarda ham kontentni aylantiradi | GitHub → Pages | shu commit |
| 2026-11-24 | Claude | v108: «Adabiyot» rejimi — wd_lit_works/chapters/progress (RLS: 1-bob bepul, qolgani Pro), lit-sync edge function (content/adabiyot/*.json → baza), lit.v108.js o'quvchi, birinchi asar: The Stranger (o'quv nashri) | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v109: «Metamorphosis» (Kafka) — to'liq matn, WordDrop'ning nemischa asl nusxadan inglizcha tarjimasi + o'zbekcha parallel tarjima, 9 bob; lit.v109.js (muqova nomi tuzatildi) | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v110: «Pride and Prejudice» (Austen, to'liq matn, 61 bob, lug'at va savollar); asl muqova rasmlari (fronted/lit-covers); kitob javoni tokcha ko'rinishida; xatboshini talab bo'yicha o'zbekchaga tarjima — lit-tr edge function + wd_lit_tr kesh; lit.v110.js | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v111: So'z devori (3D sinfxona) va Shaxsiy xona to'liq olib tashlandi — modullar (~200 KB JS), UI kirishlari, xona jihozlari/derazalar/akvarium/Magic Hearth do'konda, mehmonlar va mehmonlar kitobi; devordagi so'zlar bir marta Takrorimga ko'chiriladi; wd_rooms, wd_guestbook jadvallari va 'models' bucket o'chirildi; FAQ/verify matnlari yangilandi | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | v111 davomi: Supabase'da wd_v111_cleanup_room_wall migratsiyasi qo'llandi (wd_rooms, wd_guestbook o'chirildi); 'models' (21 GLB) va 'videos' (5 MP4) bucketlari bir martalik wd-storage-clean funksiyasi orqali o'chirildi, funksiya keyin o'chirilgan holatga (410) o'tkazildi | Supabase | — |
| 2026-11-24 | Claude | «Pride and Prejudice» — 61 bobning hammasi (2171 xatboshi) qo'lda o'zbekchaga tarjima qilindi, lit-sync orqali bazaga yuklandi; edition_uz yangilandi | GitHub, Supabase | c54ca40 |
| 2026-11-24 | Claude | «Biz» (Zamyatin, Zilboorg 1924 inglizcha matni) javonga chiqarildi: 40 qayd, 1347 xatboshi — ChatGPT qoralamasi o'rniga 2–39-qaydlar qo'lda qayta tarjima qilindi, 1 va 40-qaydlar tahrirlandi; har qaydga xulosa, lug'at, 2 savol; muqova fronted/lit-covers/zamyatin-we.v1; published:true; lit-sync | GitHub → Pages, Supabase | shu commit |
| 2026-11-24 | Claude | «Biz»: «Record N» sarlavhalari o'rniga Zamyatinning asl qayd konspektlari (EN/UZ) bob nomi qilindi, takrorlanuvchi sarlavha xatboshisi olib tashlandi; lit-sync | GitHub, Supabase | shu commit |
| 2026-11-25 | Claude | «Quvnoq ilm» (Nitsshe, The Joyful Wisdom, Thomas Common 1910, PG #52881) javonga chiqarildi: so'zboshi + I–V kitoblar (1–383 aforizmlar), 39 bob, to'liq qo'lda o'zbekcha tarjima; har bobga mavzuli sarlavha, xulosa, lug'at, 2 savol; she'riy prelyudiya va ilova (Paul Cohn tarjimasi) mualliflik huquqi noaniqligi sababli kiritilmadi; muqova fronted/lit-covers/nietzsche-joyful-wisdom.v1; published:true; lit-sync | GitHub → Pages, Supabase | shu commit |
| 2026-11-25 | Claude | v112: o'qishdan oldin ogohlantirish — meta.warn_uz bo'lgan asarda birinchi ochishda varaq (asarga xos matn + umumiy «WordDrop javobgar emas» izohi), «Asar haqida»da va sarlavhadagi «Ogohlantirish» belgisi; tasdiq localStorage wd_lit_warn'da. lit.v110.js → lit.v112.js. «Quvnoq ilm»ga warn_uz qo'shildi; lit-sync | GitHub → Pages, Supabase | shu commit |
| 2026-11-25 | Claude | «Hayvonlar fermasi» (Orwell, 1945, to'liq matn — muallif 1950-yilda vafot etgan) javonga chiqarildi: 10 bob, 336 xatboshi, ~30 ming so'z; matn ikki elektron nashrdan solishtirib tiklandi (OCR xatolari tuzatildi), to'liq qo'lda o'zbekcha tarjima; har bobga mavzuli sarlavha, xulosa, lug'at, 2 savol; muqova fronted/lit-covers/orwell-animal-farm.v1; published:true; lit-sync. (Brave New World — Huxley 1963-yilda vafot etgan, mualliflik huquqi 2034-yilgacha; foydalanuvchi o'rniga shuni tanladi) | GitHub → Pages, Supabase | shu commit |
