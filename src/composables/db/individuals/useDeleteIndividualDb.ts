import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { deleteIndividualDB } from '@/pglite/queries/individuals/deleteIndividualDB'

export function useDeleteIndividualDb() {
  const db = injectPGlite()

  const id = ref<string>()

  const q = useAsyncState(deleteIndividualDB, undefined, { immediate: false })

  const execute = () => {
    if (id.value && db) q.execute(0, db, id.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, id, execute }
}
