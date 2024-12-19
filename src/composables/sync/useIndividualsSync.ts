import { computed, ref, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetIndividualsApi } from '../api/individuals/useGetIndividualsApi'
import { useUpsertIndividualsApi } from '../api/individuals/useUpsertIndividualsApi'

import { useUpsertIndividualsDb } from '../db/individuals/useUpsertIndividualsDb'

import type { Individual } from '@/models/models'
import type { Tables } from '@/types/database.types'

export function useIndividualsSync() {
  const db = injectPGlite()

  const isFinished = ref(false)

  const pullIndividualsApi = useGetIndividualsApi()
  const pushIndividualsApi = useUpsertIndividualsApi()
  const upsertIndividualsDb = useUpsertIndividualsDb()

  const individualsToSyncQuery = useLiveQuery<Tables<'individuals'>>(
    'SELECT * FROM public.individuals WHERE _synced = false;',
    []
  )

  const individualsToSync = computed(
    () =>
      individualsToSyncQuery.rows.value
        ?.filter((org) => org._synced === false)
        .map(({ _synced, updated_at, ...rest }) => rest) as unknown as Individual[]
  )

  // Wait for queries to finish
  const areQueriesReady = computed(() => individualsToSyncQuery?.rows.value !== undefined)

  async function sync() {
    // Push unsynced individuals
    pushIndividualsApi.form.value = individualsToSync.value
    await pushIndividualsApi.execute()

    // Pull updated individuals
    const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.individuals;')
    pullIndividualsApi.params.date = result?.rows?.[0]?.max_date || null
    await pullIndividualsApi.execute()

    // Update the local database
    const updatedIndividuals = pullIndividualsApi.data.value || []
    upsertIndividualsDb.form.value = updatedIndividuals
    await upsertIndividualsDb.execute()

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
