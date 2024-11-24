import { computed, ref, watch } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import type { TablesInsert } from '@/types/database.types'

export function useInsertNotificationApi() {
  const form = ref<TablesInsert<'notifications'>>()

  const query = async () => {
    if (form.value) {
      return supabase.from('notifications').insert(form.value).select().single()
    } else {
      throw new Error('Form is null or incomplete')
    }
  }

  const q = useAsyncState(query, undefined) // Invoke query properly

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  const onSuccess = (fn: () => void) => {
    watch(isSuccess, (newValue) => {
      if (newValue) {
        fn()
      }
    })
  }

  return { ...q, data, error, isSuccess, form, onSuccess }
}
