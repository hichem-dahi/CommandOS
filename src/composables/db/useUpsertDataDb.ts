import { computed, watch } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import self from '../localStore/useSelf'

import { upsertDataDB, type TablesName } from '@/sync/syncTables'
import type { TablesInsert } from '@/types/database.types'

export function useUpsertDataDb<T>(tableName: TablesName) {
  const db = injectPGlite()
  const q = useAsyncState(upsertDataDB, undefined, { immediate: false })

  const execute = async (form?: TablesInsert<TablesName>[]) => {
    const org_id = self.value.current_org?.id
    if (!org_id) return

    const formWithOrgId = form?.map((entry) => ({
      ...entry,
      org_id
    }))

    if (db && formWithOrgId && tableName) return q.execute(0, db, formWithOrgId, tableName)
  }

  const data = computed(() => q.state.value?.data?.rows as T[])
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  function onSuccess(callback: (dataReturned: typeof data.value) => void) {
    watch(
      isSuccess,
      (val) => {
        if (val) callback(data.value)
      },
      { immediate: false }
    )
  }

  return { ...q, data, error, isSuccess, execute, onSuccess }
}
