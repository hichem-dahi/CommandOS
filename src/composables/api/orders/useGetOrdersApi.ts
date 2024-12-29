import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

import type { OrderStatus } from '@/models/models'

export function useGetOrdersApi() {
  const orgId = self.value.current_org?.id

  const params = reactive({
    dateRange: [] as [string, string] | [], // Array with [startDate, endDate]
    status: null as OrderStatus | null,
    date: ''
  })

  const query = async () => {
    const queryBuilder = supabase.from('orders').select(
      `
        *,
        client:organizations!orders_client_id_fkey (*),   
        order_lines:order_lines (*),  
        delivery:deliveries (*),
        individual:individuals (*),
        payments:payments (*)
      `
    )

    if (orgId) {
      queryBuilder.eq('org_id', orgId)
    }

    if (params.dateRange.length === 2) {
      queryBuilder.gte('date', params.dateRange[0]).lte('date', params.dateRange[1])
    }

    if (params.status !== null) {
      queryBuilder.eq('status', params.status)
    }

    if (params.date) {
      queryBuilder.gt('updated_at', params.date)
    }

    return queryBuilder
  }

  const q = useAsyncState(query, undefined, { immediate: false }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, params }
}

export type OrderData = NonNullable<ReturnType<typeof useGetOrdersApi>['data']['value']>[0]
