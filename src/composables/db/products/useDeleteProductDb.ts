import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import type { PGlite } from '@electric-sql/pglite'

import { deleteProductDB } from '@/pglite/queries/products/deleteProductDB'

export function useDeleteProductDb() {
  const productId = ref<string>()

  const q = useAsyncState(deleteProductDB, undefined, { immediate: false })

  const execute = (db: PGlite) => {
    if (productId.value) q.execute(0, db, productId.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, productId, execute }
}
