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

  const organizationsQuery = useLiveQuery(
    'SELECT * FROM public.organizations WHERE _synced = false;',
    []
  )

  const organizationsToSync = computed(
    () =>
      organizationsQuery.rows.value?.map(
        ({ _synced, updated_at, ...rest }) => rest
      ) as unknown as Organization[]
  )

  const queriesReady = computed(() => organizationsQuery.rows.value !== undefined)

  async function sync() {
    // Push organizations to API
    pushOrganizationsApi.form.value = organizationsToSync.value
    await pushOrganizationsApi.execute()

    // Pull updated organizations from API
    const result = await db?.query('SELECT MAX(updated_at) AS max_date FROM public.organizations;')
    pullOrganizationsApi.params.date = result?.rows?.[0]?.max_date || null
    await pullOrganizationsApi.execute()

    // Update local DB with pulled organizations
    const organizations = pullOrganizationsApi.data.value || []
    if (organizations.length) {
      upsertOrganizationsDb.form.value = organizations
      await upsertOrganizationsDb.execute()
    }
  }

  // Watch queries and trigger launch when ready
  const launch = () => {
    watch(
      queriesReady,
      async (isReady) => {
        if (isReady) {
          await sync()
        }
      },
      { immediate: true }
    )
  }

  const inFinished = computed(
    () =>
      pullOrganizationsApi.isReady.value &&
      pushOrganizationsApi.isReady.value &&
      upsertOrganizationsDb.isReady.value
  )

  return { inFinished, launch, sync }
}
