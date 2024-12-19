import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { upsertNotificationsDB } from '@/pglite/queries/notifications/upsertNotificationsDB'

import type { Tables, TablesInsert } from '@/types/database.types'

export function useUpsertNotificationsDb() {
  const db = injectPGlite()

  const form = ref<TablesInsert<'notifications'>[]>()

  const q = useAsyncState(upsertNotificationsDB, undefined, { immediate: false })

  const execute = () => {
    if (form.value && db) return q.execute(0, db, form.value)
    else {
      return undefined
    }
  }

  const data = computed(() => q.state.value?.rows as Tables<'notifications'>[])
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
