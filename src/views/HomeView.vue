<template>
  <v-responsive class="border rounded">
    <v-app>
      <v-app-bar color="blue-grey-lighten-3" class="text-white" title="CommandOS">
        <template v-slot:append>
          <v-btn
            id="enable-notifications"
            variant="text"
            :icon="isPermissionGranted ? mdiBell : mdiBellOff"
            @click="requestNotificationPermission"
          />
          <v-menu :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="text" :icon="mdiDotsVertical" />
            </template>
            <v-card class="d-flex flex-column align-start px-4 py-2">
              <v-btn variant="text" :prepend-icon="mdiAccount" :to="{ name: 'self' }">
                {{ $t('profile') }}
              </v-btn>
              <v-btn variant="text" :prepend-icon="mdiDotsVertical" :to="{ name: 'organizations' }">
                {{ $t('organizations') }}
              </v-btn>
              <v-select
                variant="underlined"
                density="compact"
                v-model="$i18n.locale"
                :items="$i18n.availableLocales"
                hide-details
              />
            </v-card>
          </v-menu>
        </template>
      </v-app-bar>
      <v-banner
        v-if="deferredPrompt"
        class="text-left"
        position="fixed"
        bg-color="blue"
        style="bottom: 0; z-index: 1000"
      >
        Get our free app. It won't take up space on your phone and also works offline!
        <template v-slot:actions>
          <v-btn variant="text" @click="dismiss">Dismiss</v-btn>
          <v-btn variant="text" @click="install">Install</v-btn>
        </template>
      </v-banner>
      <v-main>
        <v-container>
          <v-row class="my-10" align="center">
            <MenuBar />
          </v-row>
          <v-divider class="my-5" />
          <router-view></router-view>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { useTitle } from '@vueuse/core'
import { mdiAccount, mdiBell, mdiBellOff, mdiDotsVertical } from '@mdi/js'

import { useSyncTables } from '@/composables/sync/useSyncTables'

import { useInsertPushSubscriptionsApi } from '@/composables/api/pushSubscriptions/useInsertPushSubscriptionsApi'

import { upsertOrganizationDB } from '@/pglite/queries/organizations/upsertOrganizationDB'

import self from '@/composables/localStore/useSelf'

import MenuBar from './HomeView/MenuBar.vue'

import { fetchVapidPublicKey } from '@/supabase/api/fetchVapidPublicKey'
import { urlBase64ToUint8Array } from '@/helpers/helpers'

const title = computed(() => `CommandOS: ${self.value.current_org?.name}`)

useTitle(title)

const db = injectPGlite()

useSyncTables()

const insertPushSubscriptionsApi = useInsertPushSubscriptionsApi()

const deferredPrompt = ref()
const isPermissionGranted = ref(Notification.permission === 'granted')

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
  })

  await db?.waitReady
  const org = self.value.current_org
  if (org && db) {
    await upsertOrganizationDB(db, org)
  }
  await requestNotificationPermission()
  await registerPushSubscription()
})

async function install() {
  deferredPrompt.value.prompt()
}

async function dismiss() {
  deferredPrompt.value = null
}

async function requestNotificationPermission() {
  await Notification.requestPermission()

  if (Notification.permission === 'denied') {
    alert('You have denied notification permission. Please change it in your settings.')
  } else {
    console.log('Notification permission denied')
  }
  isPermissionGranted.value = Notification.permission === 'granted'
}

async function registerPushSubscription() {
  try {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      console.error('Push notifications are not supported in this browser.')
      return
    }

    const registration = await navigator.serviceWorker.ready
    const vapidKey = await fetchVapidPublicKey()
    if (!vapidKey) {
      throw new Error('Failed to fetch VAPID public key.')
    }
    const subscription = await registerPushManager(registration, vapidKey)
    const { endpoint, keys } = subscription.toJSON()
    const orgId = self.value.current_org?.id
    if (orgId && keys && endpoint) {
      saveSubscriptionToSupabase(orgId, endpoint, keys)
    } else {
      throw new Error('Invalid subscription data.')
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error during push subscription registration:', error.message)
    } else {
      console.error('Unknown error during push subscription registration:', error)
    }
  }
}

async function registerPushManager(
  registration: ServiceWorkerRegistration,
  vapidKey: string
): Promise<PushSubscription> {
  const applicationServerKey = urlBase64ToUint8Array(vapidKey)
  return registration.pushManager.subscribe({
    userVisibleOnly: true, // Required for Chrome
    applicationServerKey
  })
}

function saveSubscriptionToSupabase(
  org_id: string,
  endpoint: string,
  keys: Record<string, string>
) {
  insertPushSubscriptionsApi.form.value = {
    org_id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth
  }
  insertPushSubscriptionsApi.execute()
}
</script>
