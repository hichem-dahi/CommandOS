import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import type { TablesInsert } from '@/types/database.types'

export function useUpsertProductsQtyApi() {
  const form = ref<TablesInsert<'products_qty'>[]>() // Use ref to make it reactive

  const query = async () => {
    if (form.value) {
      return supabase.from('products_qty').upsert(form.value).select()
    } else {
      return undefined
    }
  }

  const q = useAsyncState(query, undefined, { immediate: false }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, form }
}
