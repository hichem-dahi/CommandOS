import { computed, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { supabase } from '@/supabase/supabase'

export function useDeleteOrderApi() {
  const orderId = ref<string>()

  const query = async () => {
    if (orderId.value) {
      return supabase.from('orders').delete().eq('id', orderId.value)
    } else {
      throw new Error('Form is null or incomplete')
    }
  }

  const q = useAsyncState(query, undefined, { immediate: false })

  const data = computed(() => q.state.value?.data)
  const error = computed(() => q.state.value?.error)
  const isSuccess = computed(() => q.isReady.value && !error.value)

  return { ...q, orderId, data, error, isSuccess }
}
