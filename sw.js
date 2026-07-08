const CACHE_NAME = 'moh-pregnancy-v3';

// الملفات التي سيتم تخزينها مؤقتاً عند التثبيت
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'logo.png',
  'icon-192.png',
  'icon-512.png'
];

// التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ تم فتح الكاش');
      return cache.addAll(urlsToCache);
    })
  );
  // تخطي مرحلة الانتظار وتفعيل السيرفس ووركر الجديد فوراً
  self.skipWaiting();
});

// التفعيل: حذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // السيطرة على جميع الصفحات فوراً
  self.clients.claim();
});

// استراتيجية Network First مع Fallback للكاش
self.addEventListener('fetch', event => {
  // لا نخزن طلبات Google Sheets أو الـ API
  if (event.request.url.includes('google.com') || 
      event.request.url.includes('script.google.com') ||
      event.request.url.includes('analytics')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // إذا كان الطلب ناجحاً، نخزن نسخة جديدة في الكاش
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال، استخدم النسخة المخزنة
        return caches.match(event.request);
      })
  );
});

// الاستماع لرسالة مسح الكاش
self.addEventListener('message', event => {
  if (event.data === 'clearCache') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('🗑️ تم مسح جميع الكاش');
      // إعادة تحميل الكاش الأساسي
      caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache));
    });
  }
});
