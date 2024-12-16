import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetStockMovementsApi } from '../api/stockMovements/useGetStockMovementsApi'
import { useInsertStockMovementsApi } from '../api/stockMovements/useInsertStockMovementsApi'

import { useUpsertStockMovementsDb } from '../db/stockMovements/useUpsertStockMovementsDb'
import { useDeleteStockMovementsDB } from '../db/stockMovements/useDeleteStockMovementsDB'

import type { StockMovement } from '@/models/models'

export function useStockMovementsSync() {
  const db = injectPGlite()

  const pullStockMovementsApi = useGetStockMovementsApi()
  const pushStockMovementsApi = useInsertStockMovementsApi()
  const upsertStockMovementsDb = useUpsertStockMovementsDb()

  const deleteStockMovementsDb = useDeleteStockMovementsDB()

  const stockMovementsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.stock_movements WHERE _synced = false;',
    []
  )

  const stockMovementsToSync = computed(
    () =>
      (stockMovementsToSyncQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as StockMovement[]
  )

  const queriesReady = computed(() => stockMovementsToSyncQuery.rows.value !== undefined)

  async function sync() {
    pushStockMovementsApi.form.value = stockMovementsToSync.value
    await pushStockMovementsApi.execute()
    const result = await db?.query(
      'SELECT MAX(updated_at) AS max_date FROM public.stock_movements;'
    )
    pullStockMovementsApi.params.date = result?.rows?.[0]?.max_date || null
    await pullStockMovementsApi.execute()

    const stockMovements = pullStockMovementsApi.data.value
    if (stockMovements) {
      upsertStockMovementsDb.form.value = stockMovements
      await upsertStockMovementsDb.execute()

      deleteStockMovementsDb.ids.value = upsertStockMovementsDb.data.value
        .filter((s) => s._deleted)
        .map((s) => s.id)
      await deleteStockMovementsDb.execute()
    }
  }

  // Watch queries and trigger launch when ready
  const launch = () => {
    const watcher = watch(
      queriesReady,
      async (isReady) => {
        if (isReady) {
          await sync()
          watcher()
        }
      },
      { immediate: true }
    )
  }

  const inFinished = computed(
    () =>
      pullStockMovementsApi.isReady.value &&
      pushStockMovementsApi.isReady.value &&
      upsertStockMovementsDb.isReady.value
  )

  return { inFinished, launch, sync }
}
