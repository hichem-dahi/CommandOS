import { computed } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetStockMovementsApi } from '../api/stockMovements/useGetStockMovementsApi'
import { useInsertStockMovementsApi } from '../api/stockMovements/useInsertStockMovementsApi'

import { useUpsertStockMovementsDb } from '../db/stockMovements/useUpsertStockMovementsDb'

import type { StockMovement } from '@/models/models'

export function useStockMovementsSync() {
  const db = injectPGlite()

  const pullStockMovementsApi = useGetStockMovementsApi()
  const pushStockMovementsApi = useInsertStockMovementsApi()
  const upsertStockMovementsDb = useUpsertStockMovementsDb()

  const stockMovementsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.stock_movements WHERE _synced = false;',
    []
  )

  const stockMovementsToSync = computed(
    () =>
      (stockMovementsToSyncQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as StockMovement[]
  )

  async function launch() {
    pushStockMovementsApi.form.value = stockMovementsToSync.value
    await pushStockMovementsApi.execute()

    const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.products;')
    pullStockMovementsApi.params.date = result?.rows?.[0]?.max_date || null
    await pullStockMovementsApi.execute()

    if (pullStockMovementsApi.data.value) {
      upsertStockMovementsDb.form.value = pullStockMovementsApi.data.value
      await upsertStockMovementsDb.execute()
    }
  }

  const inFinished = computed(
    () =>
      pullStockMovementsApi.isReady.value &&
      pushStockMovementsApi.isReady.value &&
      upsertStockMovementsDb.isReady.value
  )

  return { inFinished, launch }
}
