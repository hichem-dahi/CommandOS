import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

export function useGetProductsQtyApi() {
  const orgId = self.value.current_org?.id

  const params = reactive({
    date: '' // You can bind this to a specific date value
  })

  const query = async () => {
    if (orgId) {
      const query = supabase.from('products_qty').select().eq('org_id', orgId)

      if (params.date) {
        query.gt('updated_at', params.date)
      }

      return query
    }
    return undefined
  }

  const q = useAsyncState(query, undefined, { immediate: false }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, params }
}

export type ProductData = NonNullable<ReturnType<typeof useGetProductsQtyApi>['data']['value']>[0]
