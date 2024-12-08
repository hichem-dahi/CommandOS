import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { injectPGlite } from '@electric-sql/pglite-vue'

import { deleteOrganizationDB } from '@/pglite/queries/organizations/deleteOrganizationDB'

export function useDeleteOrganizationDb() {
  const db = injectPGlite()

  const id = ref<string>()

  const q = useAsyncState(deleteOrganizationDB, undefined, { immediate: false })

  const execute = () => {
    if (id.value) q.execute(0, db, id.value)
    else {
      throw new Error('Form is null or incomplete')
    }
  }
  const data = computed(() => q.state.value?.rows)
  const error = computed(() => q.error.value)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess, id, execute }
}
