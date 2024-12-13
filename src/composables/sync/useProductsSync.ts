import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetProductsApi } from '../api/products/useGetProductsApi'
import { useUpsertProductsApi } from '../api/products/useUpsertProductsApi'
import { useUpsertStockMovementsApi } from '../api/stockMovements/useUpsertStockMovementsApi'
import { useGetStockMovementsApi } from '../api/stockMovements/useGetStockMovementsApi'

import { useUpsertProductsDb } from '../db/products/useUpsertProductsDb'
import { useUpsertStockMovementsDb } from '../db/stockMovements/useUpsertStockMovementsDb'

import type { Product, StockMovement } from '@/models/models'

export function useProductsSync() {
  const db = injectPGlite()

  const pullProductsApi = useGetProductsApi()
  const pullStockMovementsApi = useGetStockMovementsApi()
  const pushProductsApi = useUpsertProductsApi()

  const pushStockMovementsApi = useUpsertStockMovementsApi()

  const upsertProductsDb = useUpsertProductsDb()
  const upsertStockMovementsDb = useUpsertStockMovementsDb()

  const productsQuery = useLiveQuery('SELECT * FROM public.products;', [])
  const productsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.products WHERE _synced = false;',
    []
  )
  const stockMovementsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.stock_movements WHERE _synced = false;',
    []
  )

  const products = computed(() => (productsQuery.rows?.value || []) as unknown as Product[])
  const productsToSync = computed(
    () =>
      (productsToSyncQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as Product[]
  )

  const stockMovementsToSync = computed(
    () =>
      (stockMovementsToSyncQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as StockMovement[]
  )

  watch(productsToSync, (productsToSync) => {
    pushProductsApi.form.value = productsToSync
    pushProductsApi.execute()
  })

  watch(
    [stockMovementsToSync, () => pushProductsApi.isReady.value],
    ([stockMovementsToSync, isReady]) => {
      if (isReady) {
        pushStockMovementsApi.form.value = stockMovementsToSync
        pushStockMovementsApi.execute()
      }
    }
  )

  const watcher = watch(
    () => pushStockMovementsApi.isReady.value,
    async (isReady) => {
      const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.products;')
      if (isReady) {
        pullProductsApi.params.date = result?.rows?.[0]?.max_date || null
        pullProductsApi.execute()
        watcher()
      }
    }
  )

  // Pull Orders Data Watch
  watch(
    () => pullProductsApi.isSuccess.value,
    async (isSuccess) => {
      if (!isSuccess) return
      const products = pullProductsApi.data.value || []
      upsertProductsDb.form.value = products
      await upsertProductsDb.execute()

      const result = await db?.query(
        'SELECT MAX(updated_at) AS max_date FROM public.stock_movements;'
      )
      pullStockMovementsApi.params.date = result?.rows?.[0]?.max_date || null

      await pullStockMovementsApi.execute()
      if (pullStockMovementsApi.data.value) {
        upsertStockMovementsDb.form.value = pullStockMovementsApi.data.value
        upsertStockMovementsDb.execute()
      }
    }
  )

  return { products }
}
