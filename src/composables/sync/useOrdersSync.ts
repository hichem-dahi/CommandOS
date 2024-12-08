import { computed, ref, watch } from 'vue'
import { watchOnce } from '@vueuse/core'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { max } from 'lodash'

import { useGetOrdersApi } from '../api/orders/useGetOrdersApi'
import { useUpsertOrdersApi } from '../api/orders/useUpsertOrdersApi'

import { useUpsertOrdersDb } from '../db/orders/useUpsertOrdersDb'

import type { Order } from '@/models/models'

export function useOrdersSync() {
  const pushAttempted = ref(false)

  const pushOrdersApi = useUpsertOrdersApi()
  const pullOrdersApi = useGetOrdersApi()
  const upsertOrdersDb = useUpsertOrdersDb()

  const ordersQuery = useLiveQuery('SELECT * FROM public.orders;', [])

  const orders = computed(() => (ordersQuery?.rows.value || []) as unknown as Order[])
  const ordersToSync = computed(() =>
    orders.value.filter((p) => p._synced === false).map(({ _synced, updated_at, ...rest }) => rest)
  )
  const maxUpdatedAt = computed(() => {
    return max(orders.value.map((p) => p.updated_at)) || ''
  })

  watch(ordersToSync, (ordersToSync) => {
    if (ordersToSync.length) {
      pushOrdersApi.form.value = ordersToSync
      pushOrdersApi.execute()
    } else {
      pushAttempted.value = true
    }
  })

  watch(
    () => pushOrdersApi.isSuccess.value,
    async (isSuccess) => {
      if (isSuccess && pushOrdersApi.data.value) {
        upsertOrdersDb.form.value = pushOrdersApi.data.value
        upsertOrdersDb.execute()
      }
    }
  )

  watchOnce(
    [() => upsertOrdersDb.isSuccess.value, pushAttempted],
    async ([isSuccess, pushAttempted]) => {
      if (isSuccess || pushAttempted) {
        pullOrdersApi.params.date = maxUpdatedAt.value
        pullOrdersApi.execute()
      }
    }
  )

  //pull
  watch(
    () => pullOrdersApi.data.value,
    async (sortedOrders) => {
      if (sortedOrders?.length) {
        upsertOrdersDb.form.value = sortedOrders
        upsertOrdersDb.execute()
      }
    }
  )

  return { orders }
}
