import { computed, ref, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetOrdersApi } from '../api/orders/useGetOrdersApi'
import { useUpsertOrdersApi } from '../api/orders/useUpsertOrdersApi'
import { useUpsertOrderlinesApi } from '../api/orderlines/useUpsertOrderlinesApi'
import { useUpsertPaymentsApi } from '../api/payments/useUpsertPaymentsApi'

import { useUpsertOrdersDb } from '../db/orders/useUpsertOrdersDb'
import { useUpsertOrderlinesDb } from '../db/orderlines/useUpsertOrderlinesDb'
import { useUpsertPaymentsDb } from '../db/payments/useUpsertPaymentsDb'

import { useDeleteOrdersDb } from '../db/orders/useDeleteOrderDb'
import { useDeleteOrderlinesDb } from '../db/notifications/useDeleteNotificationsDb'
import { useDeletePaymentsDb } from '../db/payments/useDeletePaymentsDb'

import type { Tables, TablesInsert } from '@/types/database.types'
import type { MaxDateResult } from './useSync'

export function useOrdersSync() {
  const db = injectPGlite()

  const isFinished = ref(false)

  // APIs
  const pullOrdersApi = useGetOrdersApi()

  const pushOrdersApi = useUpsertOrdersApi()
  const pushOrderlinesApi = useUpsertOrderlinesApi()
  const pushPaymentsApi = useUpsertPaymentsApi()

  const upsertOrdersDb = useUpsertOrdersDb()
  const upsertOrderlinesDb = useUpsertOrderlinesDb()
  const upsertPaymentsDb = useUpsertPaymentsDb()

  const deleteOrdersDb = useDeleteOrdersDb()
  const deleteOrderlinesDb = useDeleteOrderlinesDb()
  const deletePaymentsDb = useDeletePaymentsDb()

  // Queries
  const ordersToSyncQuery = useLiveQuery<Tables<'orders'>>(
    'SELECT * FROM public.orders WHERE _synced = false;',
    []
  )
  const orderlinesToSyncQuery = useLiveQuery<Tables<'order_lines'>>(
    'SELECT * FROM public.order_lines WHERE _synced = false;',
    []
  )
  const paymentsToSyncQuery = useLiveQuery<Tables<'payments'>>(
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
      ordersToSyncQuery.rows.value !== undefined &&
      orderlinesToSyncQuery.rows.value !== undefined &&
      paymentsToSyncQuery.rows.value !== undefined
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
    const result = await db?.query<MaxDateResult>(
      'SELECT MAX(updated_at) AS max_date FROM public.orders;'
    )
    pullOrdersApi.params.date = result?.rows?.[0]?.max_date || ''
    await pullOrdersApi.execute()

    // Update local DB with pulled orders and orderlines
    const orders = pullOrdersApi.data.value || []
    upsertOrdersDb.form.value = orders
    await upsertOrdersDb.execute()

    const orderlines = orders.flatMap((o) => o.order_lines || [])
    upsertOrderlinesDb.form.value = orderlines
    await upsertOrderlinesDb.execute()

    const payments = orders.flatMap((o) => o.payments || [])
    upsertPaymentsDb.form.value = payments
    await upsertPaymentsDb.execute()

    // Collect IDs of deleted orders
    deleteOrdersDb.ids.value = orders.filter((o) => o._deleted).map((o) => o.id)
    await deleteOrdersDb.execute()

    // Collect IDs of deleted order lines
    deleteOrderlinesDb.ids.value = orderlines.filter((ol) => ol._deleted).map((ol) => ol.id)
    await deleteOrderlinesDb.execute()

    // Collect IDs of deleted payments
    deletePaymentsDb.ids.value = payments.filter((p) => p._deleted).map((p) => p.id)
    if (deletePaymentsDb.ids.value?.length) await deletePaymentsDb.execute()

    isFinished.value = true
  }

  // Watch queries and trigger launch when ready
  const launch = () => {
    watch(
      queriesReady,
      (isReady, _, stop) => {
        if (isReady) {
          sync()
          stop(() => {})
        }
      },
      { immediate: true }
    )
  }

  return { isFinished, sync, launch }
}
