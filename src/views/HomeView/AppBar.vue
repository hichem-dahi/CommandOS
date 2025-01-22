<template>
  <v-app-bar theme="light" color="blue-grey-lighten-5">
    <template v-slot:prepend>
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <img src="/logo-aes-cropped.png" width="150" alt="logo" />
    </template>

    <template v-slot:append>
      <v-btn
        :prepend-icon="mdiSync"
        variant="plain"
        :color="isSynced ? 'green' : 'orange'"
        @click="callSyncTables"
        :loading="isSyncLoading"
      >
        {{ $t('sync') }}
      </v-btn>
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
          <v-btn variant="text" @click="logout">
            {{ $t('logout') }}
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
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/supabase/supabase'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { mdiAccount, mdiBell, mdiBellOff, mdiDotsVertical, mdiSync } from '@mdi/js'

import { useIsSynced } from '@/composables/sync/useIsSynced'

import { syncTables } from '@/sync/syncTables'

let syncInterval: ReturnType<typeof setInterval> | null = null

const drawer = defineModel<boolean>('drawer')

const db = injectPGlite()

const { isSynced } = useIsSynced()

const isPermissionGranted = ref(Notification.permission === 'granted')

const isSyncLoading = ref(false)

async function callSyncTables() {
  isSyncLoading.value = true
  if (db) await syncTables(db)
  isSyncLoading.value = false
}

async function logout() {
  await supabase.auth.signOut()
}

onMounted(async () => {
  await db?.waitReady
  callSyncTables()
  syncInterval = setInterval(callSyncTables, 300000) // 300,000 ms = 5 min

  await requestNotificationPermission()
})

onUnmounted(() => {
  // Clear the interval when the component is unmounted
  if (syncInterval) {
    clearInterval(syncInterval)
  }
})

async function requestNotificationPermission() {
  await Notification.requestPermission()

  if (Notification.permission === 'denied') {
    alert('You have denied notification permission. Please change it in your settings.')
  } else {
    console.log('Notification permission denied')
  }
  isPermissionGranted.value = Notification.permission === 'granted'
}
</script>
