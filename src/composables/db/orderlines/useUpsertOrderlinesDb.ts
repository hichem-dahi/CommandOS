import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { upsertOrderlinesDB } from '@/pglite/queries/orderlines/upsertOrderlinesDB'

import type { Tables, TablesInsert } from '@/types/database.types'

export function useUpsertOrderlinesDb() {
  const db = injectPGlite()

  const form = ref<(TablesInsert<'order_lines'> & { _synced?: boolean })[]>()

  const q = useAsyncState(upsertOrderlinesDB, undefined, { immediate: false })

  const execute = () => {
    if (form.value) q.execute(0, db, form.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }

  const data = computed(() => q.state.value?.rows as Tables<'order_lines'>[])
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}