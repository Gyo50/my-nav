const CACHE_NAME = 'nav-app-v3'
const CORE_ASSETS = ['/', '/index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API / 외부 요청은 캐시 안 함
  if (
    url.hostname.includes('naver') ||
    url.hostname.includes('ntruss') ||
    url.pathname.startsWith('/api/')
  ) {
    return
  }

  // HTML 파일은 항상 네트워크 우선 → 캐시는 fallback으로만
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 새 버전 캐시에 저장
          const toCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache))
          return response
        })
        .catch(() => {
          // 네트워크 실패 시에만 캐시 사용
          return caches.match(event.request)
        })
    )
    return
  }

  // JS/CSS 등 나머지는 캐시 우선
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const toCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache))
        return response
      })
    })
  )
})