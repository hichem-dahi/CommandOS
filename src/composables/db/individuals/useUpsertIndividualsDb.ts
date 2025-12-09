import { computed, ref, watch } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { upsertIndividualsDB } from '@/pglite/queries/individuals/upsertIndividualsDB'

import type { TablesInsert } from '@/types/database.types'

export function useUpsertIndividualsDb() {
  const db = injectPGlite()

  const form = ref<TablesInsert<'individuals'>[]>()

  const q = useAsyncState(upsertIndividualsDB, undefined, { immediate: false })

  const execute = () => {
    if (db) return q.execute(0, db, form.value || [])
  }

  const data = computed(() => q.state.value?.rows)
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

  return { ...q, data, error, isSuccess, form, execute, onSuccess }
}
