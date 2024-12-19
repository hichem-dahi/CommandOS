import { computed, ref, watch } from 'vue'
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'

import { useGetOrganizationsApi } from '../api/organizations/useGetOrganizationsApi'
import { useUpsertOrganizationsApi } from '../api/organizations/useUpsertOrganizationsApi'

import { useUpsertOrganizationsDb } from '../db/organizations/useUpsertOrganizationsDb'

import type { Organization } from '@/models/models'
import type { Tables } from '@/types/database.types'

export function useOrganizationsSync() {
  const db = injectPGlite()

  const isFinished = ref(false)

  const pullOrganizationsApi = useGetOrganizationsApi()
  const pushOrganizationsApi = useUpsertOrganizationsApi()
  const upsertOrganizationsDb = useUpsertOrganizationsDb()

  const organizationsQuery = useLiveQuery<Tables<'organizations'>>(
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
    upsertOrganizationsDb.form.value = organizations
    await upsertOrganizationsDb.execute()

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

  return { isFinished, launch, sync }
}
