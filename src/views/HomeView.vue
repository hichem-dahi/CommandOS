<template>
  <v-responsive>
    <v-app style="background: linear-gradient(135deg, #f9ffff, #fafafc)">
      <AppBar />
      <v-main>
        <v-container>
          <v-row class="my-6" align="center">
            <MenuBar />
          </v-row>
          <v-divider class="my-5" />
          <router-view></router-view>
        </v-container>
      </v-main>
    </v-app>
    <BannerBar />
  </v-responsive>
</template>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { useTitle } from '@vueuse/core'

import { useInsertPushSubscriptionsApi } from '@/composables/api/pushSubscriptions/useInsertPushSubscriptionsApi'

import { upsertOrganizationDB } from '@/pglite/queries/organizations/upsertOrganizationDB'

import self from '@/composables/localStore/useSelf'

import MenuBar from './HomeView/MenuBar.vue'
import AppBar from './HomeView/AppBar.vue'
import BannerBar from './HomeView/BannerBar.vue'

import { fetchVapidPublicKey } from '@/supabase/api/fetchVapidPublicKey'
import { urlBase64ToUint8Array } from '@/helpers/helpers'

const title = computed(() => `CommandOS: ${self.value.current_org?.name}`)

useTitle(title)

const db = injectPGlite()

const insertPushSubscriptionsApi = useInsertPushSubscriptionsApi()

onMounted(async () => {
  await db?.waitReady
  const org = self.value.current_org
  if (org && db) {
    await upsertOrganizationDB(db, org)
  }
  await registerPushSubscription()
})

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
