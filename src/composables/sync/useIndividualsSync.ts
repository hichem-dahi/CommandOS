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

  const individualsQuery = useLiveQuery('SELECT * FROM public.individuals;', [])

  const individuals = computed(
    () => (individualsQuery?.rows.value || []) as unknown as Individual[]
  )

  const individualsToSync = computed(() =>
    individuals.value
      ?.filter((org) => org._synced === false)
      .map(({ _synced, updated_at, ...rest }) => rest)
  )

  //push
  watch(individualsToSync, (individualsToSync) => {
    pushIndividualsApi.form.value = individualsToSync
    pushIndividualsApi.execute()
  })

  const watcher = watch(
    () => pushIndividualsApi.isReady.value,
    async (isReady) => {
      const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.individuals;')
      if (isReady) {
        pullIndividualsApi.params.date = result?.rows?.[0]?.max_date || null
        pullIndividualsApi.execute()
        watcher()
      }
    }
  )

  //pull
  watch(
    () => pullIndividualsApi.data.value,
    async (sortedProducts) => {
      if (sortedProducts?.length) {
        upsertIndividualsDb.form.value = sortedProducts
        upsertIndividualsDb.execute()
      }
    }
  )

  return { individuals }
}
