import { computed, watch } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import { useUpsertNotificationsApi } from '../api/notifications/useInsertNotificationApi'
import { useUpsertNotificationsDb } from '../db/notifications/useUpsertNotificationsDb'

import type { Notification } from '@/models/models'
import type { Tables } from '@/types/database.types'

export function useNotificationsSync() {
  const pushNotificationsApi = useUpsertNotificationsApi()
  const upsertNotificationsDb = useUpsertNotificationsDb()

  const notificationsToSync = computed(
    () =>
      notificationsToSyncQuery.rows.value
        ?.filter((n) => n._synced === false)
        .map(({ _synced, updated_at, ...rest }) => rest) as unknown as Notification[]
  )

  const notificationsToSyncQuery = useLiveQuery<Tables<'notifications'>>(
    'SELECT * FROM public.notifications WHERE _synced = false;',
    []
  )

  // Wait for queries to finish
  const areQueriesReady = computed(() => notificationsToSyncQuery?.rows.value !== undefined)

  async function sync() {
    // Push unsynced notifications
    pushNotificationsApi.form.value = notificationsToSync.value
    await pushNotificationsApi.execute()

    // Update the local database
    if (pushNotificationsApi.isSuccess.value && pushNotificationsApi.data.value) {
      upsertNotificationsDb.form.value = pushNotificationsApi.data.value
      await upsertNotificationsDb.execute()
    }
  }

  const launch = () => {
    const watcher = watch(
      areQueriesReady,
      async (isReady) => {
        if (isReady) {
          sync()
          watcher()
        }
      },
      { immediate: true }
    )
  }

  return { sync, launch, areQueriesReady }
}
