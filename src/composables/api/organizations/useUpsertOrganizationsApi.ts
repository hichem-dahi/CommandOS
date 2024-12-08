import { computed, ref, watch } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import type { TablesInsert } from '@/types/database.types'

export function useUpsertOrganizationsApi() {
  const form = ref<TablesInsert<'organizations'>[]>() // Use ref to make it reactive

  const query = async () => {
    if (form.value) {
      return supabase.from('organizations').upsert(form.value).select()
    } else {
      throw new Error('Form is null or incomplete')
    }
  }

  const q = useAsyncState(query, undefined) // Invoke query properly

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
  return { ...q, data, error, form, isSuccess, onSuccess }
}