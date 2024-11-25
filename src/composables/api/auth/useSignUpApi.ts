import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

export function useSignUpApi() {
  const params = reactive({ email: '' })

  const query = () =>
    supabase.auth.signInWithOtp({
      email: params.email
    })

  const q = useAsyncState(query, null, { immediate: false })

  const data = computed(() => q.state.value?.data)
  const error = computed(() => !!q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, params, data, error, isSuccess }
}
