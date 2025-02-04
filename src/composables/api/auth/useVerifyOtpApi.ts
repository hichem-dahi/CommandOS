import { computed, reactive } from 'vue'
import { useAsyncState } from '@vueuse/core'

import { supabase } from '@/supabase/supabase'

export function useVerifyCodeApi() {
  const params = reactive({ email: '', code: '' })

  const query = () =>
    supabase.auth.verifyOtp({
      email: params.email,
      token: params.code,
      type: 'email'
    })

  const q = useAsyncState(query, undefined, { immediate: false })

  const data = computed(() => q.state.value?.data)
  const error = computed(() => !!q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, data, error, params, isSuccess }
}
