import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetIndividualsApi } from '../api/individuals/useGetIndividualsApi'
import { useUpsertIndividualsApi } from '../api/individuals/useUpsertIndividualsApi'

import { useUpsertIndividualsDb } from '../db/individuals/useUpsertIndividualsDb'

import type { Individual } from '@/models/models'

export function useIndividualsSync() {
  const db = injectPGlite()

  const pullIndividualsApi = useGetIndividualsApi()
  const pushIndividualsApi = useUpsertIndividualsApi()
  const upsertIndividualsDb = useUpsertIndividualsDb()

  const individualsToSyncQuery = useLiveQuery(
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
    if (updatedIndividuals.length) {
      upsertIndividualsDb.form.value = updatedIndividuals
      await upsertIndividualsDb.execute()
    }
  }

  // Watch queries and trigger launch when ready
  const launch = () => {
    const watcher = watch(areQueriesReady, async (isReady) => {
      if (isReady) {
        await sync()
        watcher()
      }
    })
  }

  return { sync, launch, areQueriesReady }
}
