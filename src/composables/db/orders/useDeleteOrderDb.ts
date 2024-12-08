import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { deleteOrderDB } from '@/pglite/queries/orders/deleteOrderDB'

export function useDeleteOrderDb() {
  const db = injectPGlite()

  const orderId = ref<string>()

  const q = useAsyncState(deleteOrderDB, undefined, { immediate: false })

  const execute = () => {
    if (orderId.value) q.execute(0, db, orderId.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, OrdersId, execute }
}
