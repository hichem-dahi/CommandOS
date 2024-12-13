import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

const orgId = self.value.user?.organization_id

export function useGetStockMovementsApi() {
  const params = reactive({
    date: ''
  }) // Use ref to make it reactive

  const query = async () => {
    if (orgId) {
      const query = supabase.from('stock_movements').select().eq('org_id', orgId)

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
