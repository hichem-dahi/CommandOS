import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'
import { updateProductsQtyDb } from '@/pglite/queries/products/updateProductsQtyDb'

export function useUpdateProductsQtyDb() {
  const db = injectPGlite()

  const stockMovementsIds = ref<string[]>()

  const q = useAsyncState(updateProductsQtyDb, undefined, { immediate: false })

  const execute = () => {
    return db ? q.execute(0, db, stockMovementsIds.value || []) : undefined
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, stockMovementsIds, execute }
}
