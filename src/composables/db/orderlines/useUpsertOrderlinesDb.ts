import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { upsertOrderlinesDB } from '@/pglite/queries/orderlines/upsertOrderlinesDB'

import type { Tables, TablesInsert } from '@/types/database.types'

export function useUpsertOrderlinesDb() {
  const db = injectPGlite()

  const form = ref<TablesInsert<'order_lines'>[]>()

  const q = useAsyncState(upsertOrderlinesDB, undefined, { immediate: false })

  const execute = () => {
    if (form.value && db) return q.execute(0, db, form.value)
    else {
      return undefined
    }
  }

  const data = computed(() => q.state.value?.rows as Tables<'order_lines'>[])
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
