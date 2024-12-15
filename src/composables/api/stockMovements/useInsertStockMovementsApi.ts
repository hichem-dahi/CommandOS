import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import type { TablesInsert } from '@/types/database.types'
import type { StockMovementType } from '@/models/models'

export function useInsertStockMovementsApi() {
  const type = ref<StockMovementType>()
  const form = ref<TablesInsert<'stock_movements'>[]>() // Use ref to make it reactive

  const query = async () => {
    if (form.value) {
      return supabase.from('stock_movements').insert(form.value).select()
    } else {
      return undefined
    }
  }

  const q = useAsyncState(query, undefined) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form, type }
}
