import {
  createHandlerBoundToURL,
  precacheAndRoute,
  cleanupOutdatedCaches
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

// to allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body,
    icon: '/logo-cropped.png',
    badge: '/favicon-32x32.png',
    data: {
      url: data.url || '/'
    }
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data.url
  // eslint-disable-next-line no-undef
  event.waitUntil(clients.openWindow(url))
})
