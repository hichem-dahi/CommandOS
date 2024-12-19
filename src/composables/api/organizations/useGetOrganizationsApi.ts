import { computed, reactive, watch } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import self from '@/composables/localStore/useSelf'

const orgId = self.value.current_org?.id

export function useGetOrganizationsApi() {
  const params = reactive({
    date: '' // You can bind this to a specific date value
  })

  const query = async () => {
    if (orgId) {
      let query = supabase
        .from('organizations')
        .select()
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false }) // Use ascending: true for ascending order

      if (params.date) {
        query = query.gt('updated_at', params.date)
      }

      return query
    }
    return undefined
  }

  const q = useAsyncState(query, undefined, { immediate: false }) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  const onSuccess = (callback: (d: typeof data.value) => void) => {
    watch(isSuccess, (isSuccess) => {
      if (isSuccess) {
        callback(data.value)
      }
    })
  }

  return { ...q, data, isSuccess, onSuccess, error, params }
}
