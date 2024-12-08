import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

const orgId = self.value.user?.organization_id

export function useGetProductsApi() {
  const params = reactive({
    date: '' // You can bind this to a specific date value
  })

  const query = async () => {
    if (orgId) {
      let query = supabase
        .from('products')
        .select()
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false }) // Use ascending: true for ascending order

      if (params.date) {
        query = query.gt('updated_at', params.date)
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
