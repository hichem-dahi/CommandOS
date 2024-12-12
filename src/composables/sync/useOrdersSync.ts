import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'
import { max } from 'lodash'

import { useGetOrdersApi } from '../api/orders/useGetOrdersApi'
import { useUpsertOrdersApi } from '../api/orders/useUpsertOrdersApi'

import { useUpsertOrderlinesApi } from '../api/orderlines/useUpsertOrderlinesApi'

import { useUpsertOrdersDb } from '../db/orders/useUpsertOrdersDb'
import { useUpsertOrderlinesDb } from '../db/orderlines/useUpsertOrderlinesDb'

import type { Tables, TablesInsert } from '@/types/database.types'

export function useOrdersSync() {
  const db = injectPGlite()

  // APIs
  const pushOrdersApi = useUpsertOrdersApi()
  const pullOrdersApi = useGetOrdersApi()
  const upsertOrdersDb = useUpsertOrdersDb()

  const pushOrderlinesApi = useUpsertOrderlinesApi()
  const upsertOrderlinesDb = useUpsertOrderlinesDb()

  // Queries
  const ordersQuery = useLiveQuery('SELECT * FROM public.orders;', [])

  const ordersToSyncQuery = useLiveQuery('SELECT * FROM public.orders WHERE _synced = false;', [])
  const orderlinesToSyncQuery = useLiveQuery(
    'SELECT * FROM public.order_lines WHERE _synced = false;',
    []
  )

  // Orders
  const orders = computed(() => (ordersQuery?.rows.value || []) as unknown as Tables<'orders'>[])

  const ordersToSync = computed(
    () =>
      ordersToSyncQuery.rows.value?.map(
        ({ _synced, updated_at, ...rest }) => rest
      ) as unknown as TablesInsert<'orders'>[]
  )

  const orderlinesToSync = computed(
    () =>
      orderlinesToSyncQuery.rows.value?.map(
        ({ _synced, updated_at, ...rest }) => rest
      ) as unknown as TablesInsert<'order_lines'>[]
  )

  // Watch for Orders to Sync
  watch(ordersToSync, (ordersToSync) => {
    pushOrdersApi.form.value = ordersToSync
    pushOrdersApi.execute()
  })

  // Watch for OrderLines to Sync
  watch([orderlinesToSync, () => pushOrdersApi.isReady.value], ([orderlinesToSync, isReady]) => {
    if (isReady && orderlinesToSync) {
      pushOrderlinesApi.form.value = orderlinesToSync
      pushOrderlinesApi.execute()
    }
  })

  // Pull Orders After Sync
  const watcher = watch([() => pushOrderlinesApi.isReady.value], async (isReady) => {
    const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.orders;')
    if (isReady) {
      pullOrdersApi.params.date = result?.rows?.[0]?.max_date || null
      pullOrdersApi.execute()
      watcher()
    }
  })

  // Pull Orders Data Watch
  watch(
    () => pullOrdersApi.data.value,
    async (sortedOrders) => {
      if (sortedOrders?.length) {
        upsertOrdersDb.form.value = sortedOrders
        await upsertOrdersDb.execute()
        upsertOrderlinesDb.form.value = sortedOrders.flatMap((o) => o.order_lines)
        await upsertOrderlinesDb.execute()
      }
    }
  )

  return { orders }
}
