import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { deleteOrganizationDB } from '@/pglite/queries/organizations/deleteOrganizationDB'

export function useDeleteOrganizationDb() {
  const db = injectPGlite()

  const organizationId = ref<string>()

  const q = useAsyncState(deleteOrganizationDB, undefined, { immediate: false })

  const execute = () => {
    if (organizationId.value) q.execute(0, db, organizationId.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, organizationId, execute }
}
