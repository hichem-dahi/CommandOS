import { computed, watch } from 'vue'
import { useLocalStorage, watchDebounced, watchOnce } from '@vueuse/core'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'
import { isAfter } from 'date-fns'
import { max } from 'lodash'

import { useGetProductsApi } from '../api/products/useGetProductsApi'
import { useUpsertProductsApi } from '../api/products/useUpsertProductsApi'

import { useUpsertProductsDb } from '../db/products/useUpsertProductsDb'

import type { Product } from '@/models/models'

const lastSyncDate = useLocalStorage('lastSyncDate', { push: '', pull: '' })

export function useProductsSync() {
  const db = injectPGlite()
  const pushProductsApi = useUpsertProductsApi()
  const pullProductsApi = useGetProductsApi()
  const upsertProductsDb = useUpsertProductsDb()

  if (lastSyncDate.value) pullProductsApi.params.date = lastSyncDate.value.pull

  const productsQuery = useLiveQuery('SELECT * FROM public.products;', [])

  const products = computed(() => (productsQuery?.rows.value || []) as unknown as Product[])
  const productsToSync = computed(() =>
    products.value.filter((p) => p._synced === false).map(({ _synced, ...rest }) => rest)
  )

  //pull
  watch(
    () => pullProductsApi.data.value,
    async (sortedProducts) => {
      if (sortedProducts?.length) {
        const maxUpdatedAt = max(sortedProducts.map((product) => product.updated_at)) || ''

        if (isAfter(maxUpdatedAt || 0, lastSyncDate.value.pull || 0)) {
          upsertProductsDb.form.value = sortedProducts
          upsertProductsDb.execute(db)
          lastSyncDate.value.pull = maxUpdatedAt
        }
      }
    }
  )

  //pull
  watchDebounced(
    productsToSync,
    (productsToSync) => {
      if (productsToSync.length !== 0) {
        pushProductsApi.form.value = productsToSync
        pushProductsApi.execute()
      }
    },
    { debounce: 5000, maxWait: 20000 }
  )

  watch(
    () => pushProductsApi.isSuccess.value,
    async (isSuccess) => {
      if (isSuccess && pushProductsApi.data.value) {
        upsertProductsDb.form.value = pushProductsApi.data.value
        upsertProductsDb.execute(db)
      }
    }
  )

  watchOnce(
    [() => upsertProductsDb.isReady.value, productsToSync],
    async ([isReady, productsToSync]) => {
      if (isReady || productsToSync) {
        pullProductsApi.execute()
      }
    }
  )

  return { products }
}
