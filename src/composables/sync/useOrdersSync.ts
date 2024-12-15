import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetOrdersApi } from '../api/orders/useGetOrdersApi'
import { useUpsertOrdersApi } from '../api/orders/useUpsertOrdersApi'
import { useUpsertOrderlinesApi } from '../api/orderlines/useUpsertOrderlinesApi'
import { useUpsertPaymentsApi } from '../api/payments/useUpsertPaymentsApi'

import { useUpsertOrdersDb } from '../db/orders/useUpsertOrdersDb'
import { useUpsertOrderlinesDb } from '../db/orderlines/useUpsertOrderlinesDb'
import { useUpsertPaymentsDb } from '../db/payments/useUpsertPaymentsDb'

import type { TablesInsert } from '@/types/database.types'

export function useOrdersSync() {
  const db = injectPGlite()

  // APIs
  const pullOrdersApi = useGetOrdersApi()

  const pushOrdersApi = useUpsertOrdersApi()
  const pushOrderlinesApi = useUpsertOrderlinesApi()
  const pushPaymentsApi = useUpsertPaymentsApi()

  const upsertOrdersDb = useUpsertOrdersDb()
  const upsertOrderlinesDb = useUpsertOrderlinesDb()
  const upsertPaymentsDb = useUpsertPaymentsDb()

  // Queries
  const ordersToSyncQuery = useLiveQuery('SELECT * FROM public.orders WHERE _synced = false;', [])
  const orderlinesToSyncQuery = useLiveQuery(
    'SELECT * FROM public.order_lines WHERE _synced = false;',
    []
  )
  const paymentsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.payments WHERE _synced = false;',
    []
  )

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

  const paymentsToSync = computed(
    () =>
      paymentsToSyncQuery.rows.value?.map(
        ({ _synced, updated_at, ...rest }) => rest
      ) as unknown as TablesInsert<'payments'>[]
  )

  const queriesReady = computed(
    () =>
      ordersToSyncQuery.rows.value &&
      orderlinesToSyncQuery.rows.value &&
      paymentsToSyncQuery.rows.value
  )

  const inFinished = computed(
    () =>
      pullOrdersApi.isReady.value &&
      pushOrdersApi.isReady.value &&
      pushOrderlinesApi.isReady.value &&
      pushPaymentsApi.isReady.value &&
      upsertOrdersDb.isReady.value &&
      upsertOrderlinesDb.isReady.value &&
      upsertPaymentsDb.isReady.value
  )

  async function sync() {
    // Push orders to API
    pushOrdersApi.form.value = ordersToSync.value
    await pushOrdersApi.execute()

    // Push orderlines if orders are successfully pushed
    if (pushOrdersApi.isReady.value) {
      pushOrderlinesApi.form.value = orderlinesToSync.value
      await pushOrderlinesApi.execute()
      pushPaymentsApi.form.value = paymentsToSync.value
      await pushPaymentsApi.execute()
    }

    // Pull updated orders from API
    const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.orders;')
    pullOrdersApi.params.date = result?.rows?.[0]?.max_date || null
    await pullOrdersApi.execute()

    // Update local DB with pulled orders and orderlines
    const orders = pullOrdersApi.data.value || []
    if (orders.length) {
      upsertOrdersDb.form.value = orders
      await upsertOrdersDb.execute()

      const orderlines = orders.flatMap((o) => o.order_lines || [])
      upsertOrderlinesDb.form.value = orderlines
      await upsertOrderlinesDb.execute()

      const payments = orders.flatMap((o) => o.payments || [])
      upsertPaymentsDb.form.value = payments
      await upsertPaymentsDb.execute()
    }
  }

  // Watch queries and trigger launch when ready
  const launch = () => {
    const watcher = watch(queriesReady, async (isReady) => {
      if (isReady) {
        await sync()
        watcher()
      }
    })
  }

  return { inFinished, sync, launch }
}
