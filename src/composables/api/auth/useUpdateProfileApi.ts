import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

import type { TablesUpdate } from '@/types/database.types'

export function useUpdateProfileApi() {
  const form = ref<TablesUpdate<'profiles'>>()

  const query = async () =>
    form.value?.id
      ? supabase
          .from('profiles')
          .update(form.value)
          .eq('id', form.value.id)
          .select(
            `
              *, 
              organizations: organizations(*)
            `
          )
          .single()
      : undefined

  const q = useAsyncState(query, undefined, { immediate: false })

  const data = computed(() => q.state.value?.data)
  const error = computed(() => !!q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, form, data, error, isSuccess }
}
