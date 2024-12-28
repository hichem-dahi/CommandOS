import { computed, ref, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetProductsQtyApi } from '../api/productsQty/useGetProductsQtyApi'

import { useUpsertProductsQtyDb } from '../db/productsQty/useUpsertProductsQtyDb'
import { useDeleteProductsQtyDb } from '../db/productsQty/useDeleteProductsQtyDb'

import type { Tables } from '@/types/database.types'
import type { MaxDateResult } from './useSync'

export function useProductsQtySync() {
  const db = injectPGlite()

  const isFinished = ref(false)

  const pullProductsQtyApi = useGetProductsQtyApi()

  const upsertProductsQtyDb = useUpsertProductsQtyDb()

  const deleteProductsQtyDb = useDeleteProductsQtyDb()

  const productsQtyToSyncQuery = useLiveQuery<Tables<'products_qty'>>(
    'SELECT * FROM public.products_qty WHERE _synced = false;',
    []
  )

  const productsQtyToDeleteQuery = useLiveQuery<Tables<'products_qty'>>(
    'SELECT * FROM public.products_qty WHERE _deleted = true AND _synced = true;',
    []
  )

  const productsQtyToSync = computed(
    () =>
      (productsQtyToSyncQuery.rows.value?.map(({ _synced, ...rest }) => rest) ||
        []) as unknown as Tables<'products_qty'>[]
  )

  const productsQtyToDelete = computed(
    () =>
      (productsQtyToDeleteQuery.rows.value?.map(({ _synced, updated_at, ...rest }) => rest) ||
        []) as unknown as Tables<'products_qty'>[]
  )

  const queriesReady = computed(() => productsQtyToSyncQuery.rows.value !== undefined)

  async function sync() {
    const result = await db?.query<MaxDateResult>(
      'SELECT MAX(updated_at) AS max_date FROM public.products_qty;'
    )
    pullProductsQtyApi.params.date = result?.rows?.[0]?.max_date || ''
    await pullProductsQtyApi.execute()

    const productsQty = pullProductsQtyApi.data.value || []
    upsertProductsQtyDb.form.value = productsQty
    await upsertProductsQtyDb.execute()

    // Collect IDs of deleted orders
    deleteProductsQtyDb.ids.value = upsertProductsQtyDb.data.value
      ?.filter((o) => o._deleted)
      .map((o) => o.product_id)
    if (deleteProductsQtyDb.ids.value?.length) await deleteProductsQtyDb.execute()

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

  return { launch, productsQtyToSync, queriesReady, isFinished }
}
