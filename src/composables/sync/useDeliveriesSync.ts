import { computed, ref, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetDeliveriesApi } from '../api/deliveries/useGetDeliveriesApi'
import { useUpsertDeliveriesApi } from '../api/deliveries/useUpsertDeliveriesApi'

import { useUpsertDeliveriesDb } from '../db/deliveries/useUpsertDeliveriesDb'

import type { Delivery } from '@/models/models'
import type { Tables } from '@/types/database.types'
import type { MaxDateResult } from './useSync'

export function useDeliveriesSync() {
  const db = injectPGlite()

  const isFinished = ref(false)

  const pullDeliveriesApi = useGetDeliveriesApi()
  const pushDeliveriesApi = useUpsertDeliveriesApi()
  const upsertDeliveriesDb = useUpsertDeliveriesDb()

  const deliveriesToSyncQuery = useLiveQuery<Tables<'deliveries'>>(
    'SELECT * FROM public.deliveries WHERE _synced = false;',
    []
  )

  const deliveriesToSync = computed(
    () =>
      deliveriesToSyncQuery.rows.value
        ?.filter((d) => d._synced === false)
        .map(({ _synced, updated_at, ...rest }) => rest) as unknown as Delivery[]
  )

  // Wait for queries to finish
  const areQueriesReady = computed(() => deliveriesToSyncQuery?.rows.value !== undefined)

  async function sync() {
    // Push unsynced Deliveries
    pushDeliveriesApi.form.value = deliveriesToSync.value
    await pushDeliveriesApi.execute()
    // Pull updated Deliveries
    const result = await db?.query<MaxDateResult>(
      'SELECT MAX(updated_at) AS max_date FROM public.deliveries;'
    )
    pullDeliveriesApi.params.date = result?.rows?.[0]?.max_date || ''
    await pullDeliveriesApi.execute()

    // Update the local database
    const updatedDeliveries = pullDeliveriesApi.data.value || []
    upsertDeliveriesDb.form.value = updatedDeliveries
    await upsertDeliveriesDb.execute()

    isFinished.value = true
  }

  // Watch queries and trigger launch when ready
  const launch = () => {
    watch(
      areQueriesReady,
      (isReady, _, stop) => {
        if (isReady) {
          sync()
          stop(() => {})
        }
      },
      { immediate: true }
    )
  }

  return { sync, launch, areQueriesReady, isFinished }
}
