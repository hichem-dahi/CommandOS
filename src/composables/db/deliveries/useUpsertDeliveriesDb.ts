import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { upsertDeliveriesDB } from '@/pglite/queries/deliveries/upsertDeliveriesDb'

import type { TablesInsert } from '@/types/database.types'

export function useUpsertDeliveriesDb() {
  const db = injectPGlite()

  const form = ref<TablesInsert<'deliveries'>[]>()

  const q = useAsyncState(upsertDeliveriesDB, undefined, { immediate: false })

  const execute = () => {
    if (db) return q.execute(0, db, form.value || [])
  }

  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
