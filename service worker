/* ═══════════════════════════════════════════════════════════════════
   SERVICE WORKER — Luz Divina Portal
   Ficheiro: sw.js (colocar na RAIZ do projecto)

   ESTRATÉGIAS DE CACHE:
   • HTML/CSS/JS  → Cache First (actualiza em background)
   • Bíblia JSONs → Cache First (grandes, raramente mudam)
   • Imagens      → Cache First + fallback
   • APIs externas → Network Only (Gemini/Claude/Fonts)

   PWA: funciona 100% offline após primeira visita
   ═══════════════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'luz-divina-v3';
const CACHE_STATIC  = 'ld-static-v3';
const CACHE_BIBLIA  = 'ld-biblia-v3';
const CACHE_IMAGES  = 'ld-images-v3';

/* ── Ficheiros essenciais — instalados imediatamente ── */
const PRECACHE = [
  '/',
  '/index.html',
  '/biblia.html',
  '/ia-biblica.html',
  '/oracoes.html',
  '/devocionais.html',
  '/loja.html',
  '/blog.html',
  '/sobre.html',
  '/contato.html',
  '/faq.html',
  '/404.html',

  /* CSS e JS do portal */
  '/navbar.css',
  '/navbar.js',
  '/knowledge.js',
  '/ia-biblica.js',
  '/css/global.css',
  '/css/components.css',

  /* Dados essenciais */
  '/oracoes.json',
  '/devocionais.json',
  '/sedrach.json',
  '/apocrif.json',
  '/data/personagens.json',
  '/biblia/index.json',

  /* Biblioteca apócrifos */
  '/biblioteca/index.json',
  '/biblioteca/enoque.json',
  '/biblioteca/tobias.json',
  '/biblioteca/sabedoria.json',

  /* Manifest e ícones PWA */
  '/manifest.json',
  '/public/icon-192.png',
  '/public/icon-512.png',
];

/* ── Livros da Bíblia — cache separado, sob demanda ── */
const BIBLIA_PATTERN = /\/biblia\/[a-z_]+\.json$/;

/* ── APIs externas — nunca cachear ─────────────────── */
const NETWORK_ONLY = [
  'generativelanguage.googleapis.com',  // Gemini
  'api.anthropic.com',                  // Claude
  'fonts.googleapis.com',               // Google Fonts CSS
  'fonts.gstatic.com',                  // Google Fonts ficheiros
  'cdn.jsdelivr.net',                   // Fuse.js CDN
  'pagead2.googlesyndication.com',      // AdSense
];

/* ══════════════════════════════════════════════════════
   INSTALL — pré-carrega os ficheiros essenciais
══════════════════════════════════════════════════════ */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function(cache) {
        /* Instala em paralelo, ignora falhas individuais */
        return Promise.allSettled(
          PRECACHE.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] Não foi possível pré-cachear:', url, err.message);
            });
          })
        );
      })
      .then(function() {
        console.log('[SW] Instalado. Cache estático pronto.');
        return self.skipWaiting();
      })
  );
});

/* ══════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════════
   SERVICE WORKER — Luz Divina Portal
   Ficheiro: sw.js (colocar na RAIZ do projecto)

   ESTRATÉGIAS DE CACHE:
   • HTML/CSS/JS  → Cache First (actualiza em background)
   • Bíblia JSONs → Cache First (grandes, raramente mudam)
   • Imagens      → Cache First + fallback
   • APIs externas → Network Only (Gemini/Claude/Fonts)

   PWA: funciona 100% offline após primeira visita
   ═══════════════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'luz-divina-v3';
const CACHE_STATIC  = 'ld-static-v3';
const CACHE_BIBLIA  = 'ld-biblia-v3';
const CACHE_IMAGES  = 'ld-images-v3';

/* ── Ficheiros essenciais — instalados imediatamente ── */
const PRECACHE = [
  '/',
  '/index.html',
  '/biblia.html',
  '/ia-biblica.html',
  '/oracoes.html',
  '/devocionais.html',
  '/loja.html',
  '/blog.html',
  '/sobre.html',
  '/contato.html',
  '/faq.html',
  '/404.html',

  /* CSS e JS do portal */
  '/navbar.css',
  '/navbar.js',
  '/knowledge.js',
  '/ia-biblica.js',
  '/css/global.css',
  '/css/components.css',

  /* Dados essenciais */
  '/oracoes.json',
  '/devocionais.json',
  '/sedrach.json',
  '/apocrif.json',
  '/data/personagens.json',
  '/biblia/index.json',

  /* Biblioteca apócrifos */
  '/biblioteca/index.json',
  '/biblioteca/enoque.json',
  '/biblioteca/tobias.json',
  '/biblioteca/sabedoria.json',

  /* Manifest e ícones PWA */
  '/manifest.json',
  '/public/icon-192.png',
  '/public/icon-512.png',
];

/* ── Livros da Bíblia — cache separado, sob demanda ── */
const BIBLIA_PATTERN = /\/biblia\/[a-z_]+\.json$/;

/* ── APIs externas — nunca cachear ─────────────────── */
const NETWORK_ONLY = [
  'generativelanguage.googleapis.com',  // Gemini
  'api.anthropic.com',                  // Claude
  'fonts.googleapis.com',               // Google Fonts CSS
  'fonts.gstatic.com',                  // Google Fonts ficheiros
  'cdn.jsdelivr.net',                   // Fuse.js CDN
  'pagead2.googlesyndication.com',      // AdSense
];

/* ══════════════════════════════════════════════════════
   INSTALL — pré-carrega os ficheiros essenciais
══════════════════════════════════════════════════════ */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function(cache) {
        /* Instala em paralelo, ignora falhas individuais */
        return Promise.allSettled(
          PRECACHE.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] Não foi possível pré-cachear:', url, err.message);
            });
          })
        );
      })
      .then(function() {
        console.log('[SW] Instalado. Cache estático pronto.');
        return self.skipWaiting();
      })
  );
});

/* ══════════════════════════════════════════════════════
   ACTIVATE — limpa caches antigos
══════════════════════════════════════════════════════ */
self.addEventListener('activate', function(event) {
  var CURRENT_CACHES = [CACHE_STATIC, CACHE_BIBLIA, CACHE_IMAGES];

  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) { return !CURRENT_CACHES.includes(name); })
            .map(function(name) {
              console.log('[SW] A remover cache antigo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] Activado. Caches antigos removidos.');
        return self.clients.claim();
      })
  );
});

/* ══════════════════════════════════════════════════════
   FETCH — estratégias por tipo de recurso
══════════════════════════════════════════════════════ */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* ── Ignora pedidos não-GET ─────────────────────── */
  if (event.request.method !== 'GET') return;

  /* ── Network Only — APIs externas ──────────────── */
  if (NETWORK_ONLY.some(function(host) { return url.hostname.includes(host); })) {
    event.respondWith(fetch(event.request));
    return;
  }

  /* ── Livros da Bíblia — Cache First ────────────── */
  if (BIBLIA_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_BIBLIA));
    return;
  }

  /* ── Imagens — Cache First com fallback ─────────── */
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(imageStrategy(event.request));
    return;
  }

  /* ── JSON de dados — Stale While Revalidate ─────── */
  if (url.pathname.endsWith('.json')) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_STATIC));
    return;
  }

  /* ── HTML — Network First com fallback offline ─── */
  if (event.request.headers.get('Accept') &&
      event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(networkFirstHTML(event.request));
    return;
  }

  /* ── CSS, JS, Fonts — Cache First ───────────────── */
  event.respondWith(cacheFirst(event.request, CACHE_STATIC));
});

/* ══════════════════════════════════════════════════════
   ESTRATÉGIAS DE CACHE
══════════════════════════════════════════════════════ */

/* Cache First — serve do cache, actualiza em background */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) {
        /* Actualiza em background silenciosamente */
        fetch(request).then(function(fresh) {
          if (fresh && fresh.ok) cache.put(request, fresh.clone());
        }).catch(function() {});
        return cached;
      }
      /* Não está em cache — vai buscar à rede */
      return fetch(request).then(function(response) {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

/* Stale While Revalidate — serve cache e actualiza */
function staleWhileRevalidate(request, cacheName) {
  var networkFetch = fetch(request).then(function(response) {
    if (response && response.ok) {
      caches.open(cacheName).then(function(cache) {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(function() { return null; });

  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      return cached || networkFetch;
    });
  });
}

/* Network First para HTML — conteúdo sempre fresco */
function networkFirstHTML(request) {
  return fetch(request)
    .then(function(response) {
      if (response && response.ok) {
        caches.open(CACHE_STATIC).then(function(cache) {
          cache.put(request, response.clone());
        });
      }
      return response;
    })
    .catch(function() {
      /* Offline — serve do cache */
      return caches.match(request).then(function(cached) {
        if (cached) return cached;
        /* Fallback para a página offline */
        return caches.match('/404.html');
      });
    });
}

/* Imagens com fallback SVG se offline */
function imageStrategy(request) {
  return caches.open(CACHE_IMAGES).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(function() {
        /* Fallback SVG inline para imagens em falta */
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">' +
          '<rect width="400" height="200" fill="#0f1b2d"/>' +
          '<text x="50%" y="50%" text-anchor="middle" fill="#c9a84c" font-size="20" dy=".3em">✦</text>' +
          '</svg>',
          { headers: { 'Content-Type': 'image/svg+xml' } }
        );
      });
    });
  });
}

/* ══════════════════════════════════════════════════════
   BACKGROUND SYNC — sincroniza quando volta online
══════════════════════════════════════════════════════ */
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-cache') {
    event.waitUntil(
      /* Tenta actualizar os ficheiros mais importantes */
      Promise.allSettled([
        updateCache('/knowledge.js'),
        updateCache('/ia-biblica.js'),
        updateCache('/oracoes.json'),
        updateCache('/biblia/index.json'),
      ])
    );
  }
});

function updateCache(url) {
  return fetch(url).then(function(response) {
    if (response && response.ok) {
      return caches.open(CACHE_STATIC).then(function(cache) {
        return cache.put(url, response);
      });
    }
  }).catch(function() {});
}

/* ══════════════════════════════════════════════════════
   PUSH NOTIFICATIONS (opcional — para futuro)
══════════════════════════════════════════════════════ */
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data = event.data.json().catch(function() { return {}; });
  var title   = (data && data.title)   || '✦ Luz Divina';
  var options = {
    body:    (data && data.body)    || 'Nova mensagem espiritual',
    icon:    '/public/icon-192.png',
    badge:   '/public/icon-192.png',
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://luzdivina.top')
  );
});

console.log('[SW] Service Worker Luz Divina carregado. Cache:', CACHE_NAME);
￼EnterIVATE — limpa caches antigos
══════════════════════════════════════════════════════ */
self.addEventListener('activate', function(event) {
  var CURRENT_CACHES = [CACHE_STATIC, CACHE_BIBLIA, CACHE_IMAGES];

  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) { return !CURRENT_CACHES.includes(name); })
            .map(function(name) {
              console.log('[SW] A remover cache antigo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] Activado. Caches antigos removidos.');
        return self.clients.claim();
      })
  );
});

/* ══════════════════════════════════════════════════════
   FETCH — estratégias por tipo de recurso
══════════════════════════════════════════════════════ */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* ── Ignora pedidos não-GET ─────────────────────── */
  if (event.request.method !== 'GET') return;

  /* ── Network Only — APIs externas ──────────────── */
  if (NETWORK_ONLY.some(function(host) { return url.hostname.includes(host); })) {
    event.respondWith(fetch(event.request));
    return;
  }

  /* ── Livros da Bíblia — Cache First ────────────── */
  if (BIBLIA_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_BIBLIA));
    return;
  }

  /* ── Imagens — Cache First com fallback ─────────── */
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(imageStrategy(event.request));
    return;
  }

  /* ── JSON de dados — Stale While Revalidate ─────── */
  if (url.pathname.endsWith('.json')) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_STATIC));
    return;
  }

  /* ── HTML — Network First com fallback offline ─── */
  if (event.request.headers.get('Accept') &&
      event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(networkFirstHTML(event.request));
    return;
  }

  /* ── CSS, JS, Fonts — Cache First ───────────────── */
  event.respondWith(cacheFirst(event.request, CACHE_STATIC));
});

/* ══════════════════════════════════════════════════════
   ESTRATÉGIAS DE CACHE
══════════════════════════════════════════════════════ */

/* Cache First — serve do cache, actualiza em background */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) {
        /* Actualiza em background silenciosamente */
        fetch(request).then(function(fresh) {
          if (fresh && fresh.ok) cache.put(request, fresh.clone());
        }).catch(function() {});
        return cached;
      }
      /* Não está em cache — vai buscar à rede */
      return fetch(request).then(function(response) {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

/* Stale While Revalidate — serve cache e actualiza */
function staleWhileRevalidate(request, cacheName) {
  var networkFetch = fetch(request).then(function(response) {
    if (response && response.ok) {
      caches.open(cacheName).then(function(cache) {
        cache.put(request, response.clone());
      });
    }
    return response;
