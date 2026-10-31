/* ============================================================
   WORDDROP SERVICE WORKER (v1.0)
   ------------------------------------------------------------
   Vazifalari:
     1. Sayt fayllarini keshga saqlash (offline ishlash)
     2. Internet sekin bo'lganda keshdan tez berish
     3. Bildirishnomalarni qo'llab-quvvatlash (streak, SRS)
     4. Yangi versiya chiqqanda eski keshni tozalash
   ============================================================ */

const CACHE_VERSION = 'worddrop-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

/* ---------- 1. KESHGA SAQLANADIGAN ASOSIY FAYLLAR ----------
   Sayt ochilishi uchun zarur bo'lgan fayllar.
   Bu ro'yxatga faqat STATIK fayllar kiradi (o'zgarmaydigan).
   API so'rovlari, dinamik kontent bu yerga kirmaydi. */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/cert.js',
  '/signature-data.js'
];

/* ---------- 2. O'RNATISH (INSTALL) ----------
   Service Worker birinchi marta ishga tushganda chaqiriladi.
   Asosiy fayllarni keshga yuklaymiz. */
self.addEventListener('install', (event) => {
  console.log('[SW] O\'rnatilmoqda...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Asosiy fayllar keshga saqlanmoqda');
        // addAll muvaffaqiyatsiz bo'lsa, butun install to'xtamaydi
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => 
              console.warn(`[SW] Keshga saqlanmadi: ${url}`, err)
            )
          )
        );
      })
      .then(() => {
        // Darhol yangi versiyaga o'tish (eski sahifa yangilanishini kutmaslik)
        return self.skipWaiting();
      })
  );
});

/* ---------- 3. FAOLLASHTIRISH (ACTIVATE) ----------
   Yangi Service Worker faollashganda chaqiriladi.
   Eski keshlarni tozalaymiz. */
self.addEventListener('activate', (event) => {
  console.log('[SW] Faollashtirilmoqda...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
              console.log('[SW] Eski kesh o\'chirilmoqda:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        // Barcha ochiq sahifalarni darhol boshqarishni boshlash
        return self.clients.claim();
      })
  );
});

/* ---------- 4. SO'ROVLARNI USHLASH (FETCH) ----------
   Har bir tarmoq so'rovi shu yerdan o'tadi.
   Strategiya: "Network First" (tarmoq birinchi) — yangi kontentni
   olishga harakat qilamiz, muvaffaqiyatsiz bo'lsa keshdan olamiz.
   Bu PWA uchun eng yaxshi strategiya, chunki foydalanuvchi har doim
   eng yangi ma'lumotni ko'radi, lekin offline bo'lsa ham ishlaydi. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) FAQAT GET so'rovlarini keshga olamiz (POST, PUT keshda saqlanmaydi)
  if (request.method !== 'GET') return;

  // 2) Supabase, Google, CDN kabi tashqi so'rovlarni o'tkazib yuboramiz
  //    (ular offline keshga tushmasligi kerak)
  const skipHosts = [
    'supabase.co',
    'googleapis.com',
    'gstatic.com',
    'jsdelivr.net',
    'cloudflareinsights.com',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  if (skipHosts.some(host => url.hostname.includes(host))) {
    return; // Brauzer to'g'ridan-to'g'ri tarmoqqa yuboradi
  }

  // 3) HTML sahifalar uchun: "Network First" strategiyasi
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Muvaffaqiyatli bo'lsa — keshga yangilab qo'yamiz
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Tarmoq ishlamayapti — keshdan qaytaramiz
          return caches.match(request).then(cached => {
            return cached || caches.match('/app.html');
          });
        })
    );
    return;
  }

  // 4) Statik fayllar (CSS, JS, rasm) uchun: "Cache First" strategiyasi
  //    (tezroq — keshdan darhol beriladi, keyin fonda yangilanadi)
  event.respondWith(
    caches.match(request).then((cached) => {
      // Keshda bor bo'lsa — darhol qaytaramiz
      const networkFetch = fetch(request)
        .then((response) => {
          // Fonda keshni yangilaymiz (stale-while-revalidate)
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

/* ---------- 5. BILDIRISHNOMALAR (PUSH) ----------
   Serverdan push xabar kelganda (kelajakda Supabase Functions orqali).
   Hozircha ishlatilmaydi, lekin tayyor turadi. */
self.addEventListener('push', (event) => {
  console.log('[SW] Push xabar keldi');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('[SW] Push xabar JSON emas:', e);
  }
  const title = data.title || 'WordDrop';
  const options = {
    body: data.body || 'Kunlik mashqingizni qiling!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'wd-push',
    data: { url: data.url || '/app.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---------- 6. BILDIRISHNOMA BOSILGANDA ----------
   Foydalanuvchi bildirishnomani bossa, ilovani ochamiz. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/app.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Agar ilova allaqachon ochiq bo'lsa — shu sahifaga o'tamiz
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Aks holda yangi oyna ochamiz
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});

/* ---------- 7. XABARLAR (MESSAGE) ----------
   Sahifadan (`app.html`) xabar kelganda ishlaydi.
   Asosan: state'ni yangilash, keshni tozalash. */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  if (type === 'wd-state') {
    // Sahifadan joriy holat keldi (streak, due so'zlar)
    // Uni kelajakda bildirishnomalar uchun ishlatishimiz mumkin
    self.__wdState = payload;
    console.log('[SW] Holat yangilandi:', payload);
  }

  if (type === 'SKIP_WAITING') {
    // Yangi versiyaga darhol o'tish
    self.skipWaiting();
  }

  if (type === 'CLEAR_CACHE') {
    // Foydalanuvchi keshni tozalamoqchi
    event.waitUntil(
      caches.keys().then(keys => 
        Promise.all(keys.map(k => caches.delete(k)))
      )
    );
  }
});

/* ---------- 8. DAVRIY ESLATMA (PERIODIC SYNC) ----------
   Chrome/Android'da ilova yopiq bo'lsa ham eslatib turadi.
   `app.html` da `periodicSync.register` orqali ro'yxatga olinadi. */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'wd-reminder') {
    console.log('[SW] Davriy eslatma tekshirilmoqda');
    event.waitUntil(checkAndNotify());
  }
});

/* ---------- 9. ESLATMA TEKSHIRUVI ----------
   Holatga qarab bildirishnoma ko'rsatadi. */
async function checkAndNotify() {
  const state = self.__wdState;
  if (!state) return; // Holat noma'lum — jim turamiz

  const { streak = 0, due = 0, tasksLeft = 0, activeToday = false } = state;
  let title, body;

  if (streak > 0 && !activeToday) {
    title = `${streak} kunlik streak xavfda!`;
    body = 'Bugun hali mashq qilmadingiz. Bitta topshiriq yetarli.';
  } else if (due >= 5) {
    title = `${due} so'z takrorlashga tayyor`;
    body = 'Takrorlash — eslab qolishning eng kuchli usuli. 2 daqiqa yetadi.';
  } else if (tasksLeft > 0) {
    title = 'Bugungi topshiriqlar kutib turibdi';
    body = `${tasksLeft} ta topshiriq qoldi. Bajarib WordCoin va XP oling.`;
  } else {
    return; // Sabab yo'q — bezovta qilmaymiz
  }

  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'wd-reminder',
    data: { url: '/app.html' }
  });
}

/* ---------- 10. XATOLARNI USHLASH ---------- */
self.addEventListener('error', (event) => {
  console.error('[SW] Xatolik:', event.message);
});

console.log('[SW] Service Worker yuklandi ✓');
