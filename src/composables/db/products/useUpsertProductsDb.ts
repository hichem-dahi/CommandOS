import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { upsertProductsDB } from '@/pglite/queries/products/upsertProductsDB'

import type { TablesInsert } from '@/types/database.types'

export function useUpsertProductsDb() {
  const db = injectPGlite()

  const form = ref<(TablesInsert<'products'> & { _synced?: boolean })[]>()

  const q = useAsyncState(upsertProductsDB, undefined, { immediate: false })

  const execute = () => {
    if (form.value) q.execute(0, db, form.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
