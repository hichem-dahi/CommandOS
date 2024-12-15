import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetProductsApi } from '../api/products/useGetProductsApi'
import { useUpsertProductsApi } from '../api/products/useUpsertProductsApi'

import { useUpsertProductsDb } from '../db/products/useUpsertProductsDb'

import type { Product } from '@/models/models'

export function useProductsSync() {
  const db = injectPGlite()

  const pullProductsApi = useGetProductsApi()
  const pushProductsApi = useUpsertProductsApi()
  const upsertProductsDb = useUpsertProductsDb()

  const productsToSyncQuery = useLiveQuery(
    'SELECT * FROM public.products WHERE _synced = false;',
    []
  )

  const productsToSync = computed(
    () =>
      (productsToSyncQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as Product[]
  )

  const inFinished = computed(
    () =>
      pullProductsApi.isReady.value &&
      pushProductsApi.isReady.value &&
      upsertProductsDb.isReady.value
  )

  const queriesReady = computed(() => productsToSyncQuery.rows.value)

  async function sync() {
    pushProductsApi.form.value = productsToSync.value
    await pushProductsApi.execute()

    const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.products;')
    pullProductsApi.params.date = result?.rows?.[0]?.max_date || null
    await pullProductsApi.execute()

    const products = pullProductsApi.data.value || []
    upsertProductsDb.form.value = products
    await upsertProductsDb.execute()
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

  return { inFinished, launch }
}
