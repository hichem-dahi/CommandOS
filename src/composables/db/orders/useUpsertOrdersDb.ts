import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { upsertOrdersDB } from '@/pglite/queries/orders/upsertOrdersDB'

import type { TablesInsert } from '@/types/database.types'

export function useUpsertOrdersDb() {
  const db = injectPGlite()

  const form = ref<TablesInsert<'orders'>[]>()

  const q = useAsyncState(upsertOrdersDB, undefined, { immediate: false })

  const execute = () => {
    if (form.value && db) return q.execute(0, db, form.value)
    else {
      return undefined
    }
  }

  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
