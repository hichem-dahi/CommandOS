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
    if (form.value && db) q.execute(0, db, form.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }

  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, execute }
}
