import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { deleteProductsDB } from '@/pglite/queries/products/deleteProductsDB'

export function useDeleteProductsDb() {
  const db = injectPGlite()

  const ids = ref<string[]>()

  const q = useAsyncState(deleteProductsDB, undefined, { immediate: false })

  const execute = () => {
    if (ids.value && db) return q.execute(0, db, ids.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, ids, execute }
}
