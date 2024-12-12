import { computed, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetOrganizationsApi } from '../api/organizations/useGetOrganizationsApi'
import { useUpsertOrganizationsApi } from '../api/organizations/useUpsertOrganizationsApi'

import { useUpsertOrganizationsDb } from '../db/organizations/useUpsertOrganizationsDb'

import type { Organization } from '@/models/models'

export function useOrganizationsSync() {
  const db = injectPGlite()

  const pullOrganizationsApi = useGetOrganizationsApi()
  const pushOrganizationsApi = useUpsertOrganizationsApi()
  const upsertOrganizationsDb = useUpsertOrganizationsDb()

  const organizationsQuery = useLiveQuery('SELECT * FROM public.organizations;', [])

  const organizations = computed(
    () => (organizationsQuery?.rows.value || []) as unknown as Organization[]
  )

  const organizationsToSync = computed(() =>
    organizations.value
      ?.filter((org) => org._synced === false)
      .map(({ _synced, updated_at, ...rest }) => rest)
  )

  //push
  watch(organizationsToSync, async (organizationsToSync) => {
    pushOrganizationsApi.form.value = organizationsToSync
    pushOrganizationsApi.execute()
  })

  const watcher = watch(
    () => pushOrganizationsApi.isReady.value,
    async (isReady) => {
      const result = await db?.query(
        'SELECT MAX(updated_at) AS max_date FROM public.organizations;'
      )
      if (isReady) {
        pullOrganizationsApi.params.date = result?.rows?.[0]?.max_date || null
        pullOrganizationsApi.execute()
        watcher() // Stop the watcher after triggering
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
