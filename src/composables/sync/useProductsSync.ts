import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetProductsApi } from '../api/products/useGetProductsApi'
import { useUpsertProductsApi } from '../api/products/useUpsertProductsApi'

import { useUpsertProductsDb } from '../db/products/useUpsertProductsDb'

import type { Product } from '@/models/models'

export function useProductsSync() {
  const db = injectPGlite()

  const pushProductsApi = useUpsertProductsApi()
  const pullProductsApi = useGetProductsApi()
  const upsertProductsDb = useUpsertProductsDb()

  const productsQuery = useLiveQuery('SELECT * FROM public.products;', [])
  const productsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.products WHERE _synced = false;',
    []
  )

  const products = computed(() => (productsQuery.rows?.value || []) as unknown as Product[])
  const productsToSync = computed(
    () =>
      (productsToSyncQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as Product[]
  )

  watch(productsToSync, (productsToSync) => {
    pushProductsApi.form.value = productsToSync
    pushProductsApi.execute()
  })

  const watcher = watch(
    () => pushProductsApi.isReady.value,
    async (isReady) => {
      const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.products;')
      if (isReady) {
        pullProductsApi.params.date = result?.rows?.[0]?.max_date || null
        pullProductsApi.execute()
        watcher()
      }
    }
  )

  //pull
  watch(
    () => pullProductsApi.data.value,
    async (sortedProducts) => {
      if (sortedProducts?.length) {
        upsertProductsDb.form.value = sortedProducts
        upsertProductsDb.execute()
      }
    }
  )

  return { products }
}
