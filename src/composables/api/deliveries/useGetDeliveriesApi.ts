import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

const org_id = self.value.current_org?.id

export function useGetDeliveriesApi() {
  const params = reactive({
    date: '' // You can bind this to a specific date value
  })

  const query = async () => {
    if (org_id) {
      let query = supabase
        .from('deliveries')
        .select()
        .eq('org_id', org_id)
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
