import { computed } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { upsertDataDB, type TablesName } from '@/sync/syncTables'
import type { TablesInsert } from '@/types/database.types'

export function useUpsertDataDb() {
  const db = injectPGlite()

  const q = useAsyncState(upsertDataDB, undefined, { immediate: false })

  const execute = async (form: TablesInsert<TablesName>[], tableName: TablesName) => {
    if (form && db) return q.execute(0, db, form, tableName)
  }

  const data = computed(() => q.state.value?.data?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value && q.state.value?.error)

  return { ...q, data, error, isSuccess, execute }
}
