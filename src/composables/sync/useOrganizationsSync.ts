import { computed, ref, watch } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { watchOnce } from '@vueuse/core'
import { max } from 'lodash'

import { useGetOrganizationsApi } from '../api/organizations/useGetOrganizationsApi'
import { useUpsertOrganizationsApi } from '../api/organizations/useUpsertOrganizationsApi'

import { useUpsertOrganizationsDb } from '../db/organizations/useUpsertOrganizationsDb'

import type { Organization } from '@/models/models'

export function useOrganizationsSync() {
  const pushAttempted = ref(false)

  const pullOrganizationsApi = useGetOrganizationsApi()
  const pushOrganizationsApi = useUpsertOrganizationsApi()
  const upsertOrganizationsDb = useUpsertOrganizationsDb()

  const organizationsQuery = useLiveQuery('SELECT * FROM public.organizations;', [])

  const organizations = computed(
    () => (organizationsQuery?.rows.value || []) as unknown as Organization[]
  )

  const organizationsToSync = computed(() =>
    organizations.value
      .filter((org) => org._synced === false)
      .map(({ _synced, updated_at, ...rest }) => rest)
  )

  const maxUpdatedAt = computed(() => max(organizations.value.map((o) => o.updated_at)) || '')

  //push
  watch(organizationsToSync, async (organizationsToSync) => {
    if (organizationsToSync.length) {
      pushOrganizationsApi.form.value = organizationsToSync
      pushOrganizationsApi.execute()
    } else {
      pushAttempted.value = true
    }
  })

  watch(
    () => pushOrganizationsApi.isSuccess.value,
    (isSuccess) => {
      if (isSuccess && pushOrganizationsApi.data.value) {
        upsertOrganizationsDb.form.value = pushOrganizationsApi.data.value
        upsertOrganizationsDb.execute()
      }
    }
  )

  watchOnce(
    [() => upsertOrganizationsDb.isSuccess.value, pushAttempted],
    ([isSuccess, pushAttempted]) => {
      if (isSuccess || pushAttempted) {
        pullOrganizationsApi.params.date = maxUpdatedAt.value
        pullOrganizationsApi.execute()
      }
    }
  )

  //pull
  watch(
    () => pullOrganizationsApi.data.value,
    async (sortedProducts) => {
      if (sortedProducts?.length) {
        upsertOrganizationsDb.form.value = sortedProducts
        upsertOrganizationsDb.execute()
      }
    }
  )

  return { organizations }
}
