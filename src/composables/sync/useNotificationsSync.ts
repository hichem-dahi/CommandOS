import { computed, watch } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import { useUpsertNotificationsApi } from '../api/notifications/useInsertNotificationApi'

import { useUpsertNotificationsDb } from '../db/notifications/useUpsertNotificationsDb'

import type { Notification } from '@/models/models'

export function useNotificationsSync() {
  const pushNotificationsApi = useUpsertNotificationsApi()
  const upsertNotificationsDb = useUpsertNotificationsDb()

  const notificationsQuery = useLiveQuery('SELECT * FROM public.notifications;', [])

  const notifications = computed(
    () => (notificationsQuery?.rows.value || []) as unknown as Notification[]
  )

  const notificationsToSync = computed(() =>
    notifications.value
      ?.filter((n) => n._synced === false)
      .map(({ _synced, updated_at, ...rest }) => rest)
  )

  //push
  watch(notificationsToSync, (notificationsToSync) => {
    pushNotificationsApi.form.value = notificationsToSync
    pushNotificationsApi.execute()
  })

  const watcher = watch(
    () => pushNotificationsApi.isSuccess.value,
    async (isReady) => {
      if (isReady && pushNotificationsApi.data.value) {
        upsertNotificationsDb.form.value = pushNotificationsApi.data.value
        upsertNotificationsDb.execute()
        watcher()
      }
    }
  )

  return { notifications }
}
