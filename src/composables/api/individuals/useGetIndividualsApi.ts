import { computed } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'
import self from '@/composables/localStore/useSelf'

const orgId = self.value.user?.organization_id

export function useGetIndividualsApi() {
  const query = async () =>
    orgId ? supabase.from('individuals').select().eq('org_id', orgId) : undefined

  const q = useAsyncState(query, undefined, { immediate: false }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, isSuccess }
}
