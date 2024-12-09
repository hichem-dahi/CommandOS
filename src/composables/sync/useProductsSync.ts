import { computed, ref, watch } from 'vue'
import { useLocalStorage, watchOnce } from '@vueuse/core'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'
import { max } from 'lodash'

import { useGetProductsApi } from '../api/products/useGetProductsApi'
import { useUpsertProductsApi } from '../api/products/useUpsertProductsApi'

import { useUpsertProductsDb } from '../db/products/useUpsertProductsDb'

import type { Product } from '@/models/models'

const productsSync = useLocalStorage('products_sync', { push: '', pull: '' })

export function useProductsSync() {
  const db = injectPGlite()

  const pushAttempted = ref(false)

  const pushProductsApi = useUpsertProductsApi()
  const pullProductsApi = useGetProductsApi()
  const upsertProductsDb = useUpsertProductsDb()

  const productsQuery = useLiveQuery('SELECT * FROM public.products;', [])

  const products = computed(() => (productsQuery?.rows.value || []) as unknown as Product[])
  const productsToSync = computed(() =>
    products.value
      .filter((p) => p._synced === false)
      .map(({ _synced, updated_at, ...rest }) => rest)
  )
  const maxUpdatedAt = computed(() => {
    return max(products.value.map((p) => p.updated_at)) || ''
  })

  watch(productsToSync, (productsToSync) => {
    if (productsToSync.length) {
      pushProductsApi.form.value = productsToSync
      pushProductsApi.execute()
    } else {
      pushAttempted.value = true
    }
  })

  watch(
    () => pushProductsApi.isSuccess.value,
    async (isSuccess) => {
      if (isSuccess && pushProductsApi.data.value) {
        upsertProductsDb.form.value = pushProductsApi.data.value
        upsertProductsDb.execute()
      }
    }
  )

  watchOnce(
    [() => upsertProductsDb.isSuccess.value, pushAttempted],
    async ([isSuccess, pushAttempted]) => {
      if (isSuccess || pushAttempted) {
        pullProductsApi.params.date = maxUpdatedAt.value
        pullProductsApi.execute()
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
