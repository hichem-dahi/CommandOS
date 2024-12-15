import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { upsertStockMovementsDB } from '@/pglite/queries/stock_movements/upsertStockMovementsDB'

import type { Tables, TablesInsert } from '@/types/database.types'

export function useUpsertStockMovementsDb() {
  const db = injectPGlite()

  const form = ref<(TablesInsert<'stock_movements'> & { _synced?: boolean })[]>()

  const q = useAsyncState(upsertStockMovementsDB, undefined, { immediate: false })

  const execute = async () => {
    if (form.value) return q.execute(0, db, form.value)
  }

  const data = computed(() => q.state.value?.rows as Tables<'stock_movements'>[])
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
