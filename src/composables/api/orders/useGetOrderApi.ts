import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { supabase } from '@/supabase/supabase'

export type OrderData = NonNullable<ReturnType<typeof useGetOrderApi>['data']['value']>
export type OrderLineData = NonNullable<
  ReturnType<typeof useGetOrderApi>['data']['value']
>['order_lines'][0]

// Composition function to fetch an order
export function useGetOrderApi() {
  const orderId = ref<string>()

  const query = async () =>
    orderId.value
      ? supabase
          .from('orders')
          .select(
            `
              *,
              client:organizations!orders_client_id_fkey (*),    
              order_lines:order_lines (
                *,
                product:products (*)
              ),    
              payments(*),
              delivery:deliveries (*),
              individual:individuals (*)
            `
          )
          .eq('id', orderId.value)
          .single()
      : undefined

  const q = useAsyncState(query, undefined, { immediate: false })

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, orderId, data, error, isSuccess }
}
