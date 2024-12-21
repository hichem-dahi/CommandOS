import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

export function useUpdateProductsQteRpc() {
  const stockMovementsIds = ref<string[]>() // Use ref to make it reactive

  const query = async () => {
    if (stockMovementsIds.value) {
      return supabase.rpc('adjust_product_qte', {
        stock_movement_ids: stockMovementsIds.value
      })
    } else {
      throw new Error('Form is null or incomplete')
    }
  }

  const q = useAsyncState(query, undefined) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, stockMovementsIds }
}
