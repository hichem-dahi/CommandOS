import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

import type { OrderStatus } from '@/models/models'

const orgId = self.value.user?.organization_id

export function useGetOrdersApi() {
  const params = reactive({
    dateRange: [] as [string, string] | [], // Array with [startDate, endDate]
    status: null as OrderStatus | null
  })

  const query = async () => {
    const queryBuilder = supabase.from('orders').select(
      `
        *,
        client:organizations!orders_client_id_fkey (*),   
        order_lines:order_lines (
          *,
          product:products (*)
        ),  
        delivery:deliveries (*),
        individual:individuals (*)
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

    return queryBuilder
  }

  const q = useAsyncState(query, undefined, { immediate: false }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, params }
}

export type OrderData = NonNullable<ReturnType<typeof useGetOrdersApi>['data']['value']>[0]
