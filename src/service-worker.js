import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

precacheAndRoute(self.__WB_MANIFEST)

// to allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})
