import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { deletePaymentDB } from '@/pglite/queries/payments/deletePaymentDB'

export function useDeletePaymentDb() {
  const db = injectPGlite()

  const paymentId = ref<string>()

  const q = useAsyncState(deletePaymentDB, undefined, { immediate: false })

  const execute = () => {
    if (paymentId.value) q.execute(0, db, paymentId.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, paymentId, execute }
}
