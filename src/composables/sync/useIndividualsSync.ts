import { computed, ref, watch } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { watchOnce } from '@vueuse/core'
import { max } from 'lodash'

import { useGetIndividualsApi } from '../api/individuals/useGetIndividualsApi'
import { useUpsertIndividualsApi } from '../api/individuals/useUpsertIndividualsApi'

import { useUpsertIndividualsDb } from '../db/individuals/useUpsertIndividualsDb'

import type { Individual } from '@/models/models'

export function useIndividualsSync() {
  const pushAttempted = ref(false)

  const pullIndividualsApi = useGetIndividualsApi()
  const pushIndividualsApi = useUpsertIndividualsApi()
  const upsertIndividualsDb = useUpsertIndividualsDb()

  const individualsQuery = useLiveQuery('SELECT * FROM public.Individuals;', [])

  const individuals = computed(
    () => (individualsQuery?.rows.value || []) as unknown as Individual[]
  )

  const individualsToSync = computed(() =>
    individuals.value
      .filter((org) => org._synced === false)
      .map(({ _synced, updated_at, ...rest }) => rest)
  )

  const maxUpdatedAt = computed(() => max(individuals.value.map((o) => o.updated_at)) || '')

  //push
  watch(individualsToSync, async (IndividualsToSync) => {
    if (IndividualsToSync.length) {
      pushIndividualsApi.form.value = IndividualsToSync
      pushIndividualsApi.execute()
    } else {
      pushAttempted.value = true
    }
  })

  watch(
    () => pushIndividualsApi.isSuccess.value,
    (isSuccess) => {
      if (isSuccess && pushIndividualsApi.data.value) {
        upsertIndividualsDb.form.value = pushIndividualsApi.data.value
        upsertIndividualsDb.execute()
      }
    }
  )

  watchOnce(
    [() => upsertIndividualsDb.isSuccess.value, pushAttempted],
    ([isSuccess, pushAttempted]) => {
      if (isSuccess || pushAttempted) {
        pullIndividualsApi.params.date = maxUpdatedAt.value
        pullIndividualsApi.execute()
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
