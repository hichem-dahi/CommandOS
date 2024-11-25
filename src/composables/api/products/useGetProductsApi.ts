import { computed } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

const orgId = self.value.user?.organization_id

export function useGetProductsApi() {
  const query = async () =>
    orgId ? supabase.from('products').select().eq('org_id', orgId) : undefined

  const q = useAsyncState(query, undefined, { immediate: true }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && q.state.value?.statusText === 'OK')

  return { ...q, data, error, isSuccess }
}
